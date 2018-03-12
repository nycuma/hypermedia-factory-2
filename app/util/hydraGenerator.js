/**
 * Created by Julian Richter on 04 Feb 2018
 */

'use strict';

var _ = require('underscore');
var Utils = require('./utils');
var sugSource;
sugSource = require('../collections/suggestionSource');

function HydraDocs(graph, namespace, baseURL, apiTitle, apiDescr) {
    if (!(this instanceof HydraDocs)) {
        return new HydraDocs();
    }

    this._graph = graph;
    this._namespace = namespace.slice(-1) === '#' ? namespace : namespace+'#';
    this._baseURL = baseURL.slice(-1) === '/' ? baseURL : baseURL+'/';
    this._apiTitle = apiTitle;
    this._apiDescr = apiDescr;

    this._id = this._baseURL + 'docs.jsonld';

    this._mapHttpMethods = {
        RETRIEVE: 'GET',
        CREATE: 'POST',
        REPLACE: 'PUT',
        DELETE: 'DELETE'
    };
}

HydraDocs.prototype = {


    downloadHydraAPIDocs: function () {
        var completeDocs = this.generateHydraObj();
        Utils.downloadFile(JSON.stringify(completeDocs, null, '\t'), 'docs.json');
    },

    generateHydraObj: function () {
        var docs = {};

        docs['@context'] = this.generateContext();
        docs['@id'] = this._id;
        docs['@type'] = 'hydra:ApiDocumentation';
        docs['hydra:title'] = this._apiTitle;
        docs['hydra:description'] = this._apiDescr;
        docs['hydra:entrypoint'] = this._baseURL;

        var cells = this._graph.get('cells');
        docs['hydra:supportedClass'] = [];

        // each resource = one supported class
        cells.forEach(_.bind(function (cell) {

            if (cell.get('type') === 'html.Node') {
                // for each class: get suppoted propteries & supported operations
                var supportedClass = this.getSupportedClass(cell);
                docs['hydra:supportedClass'].push(supportedClass);
            }
            else  if (cell.get('type') === 'custom.StartNode') {
                var entryPoint = this.getEntryPoint(cell);
                docs['hydra:supportedClass'].push(entryPoint);
            }
        }, this));

        return docs;
    },

    generateContext: function () {
        var context = {};
        context['vocab'] = this._namespace;
        context['hydra'] = 'http://www.w3.org/ns/hydra/core#';
        context['rdf'] = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
        context['rdfs'] = 'http://www.w3.org/2000/01/rdf-schema#';
        context['xmls'] = 'http://www.w3.org/2001/XMLSchema#';
        context['owl'] = 'http://www.w3.org/2002/07/owl#';
        context['domain'] = {"@id": "rdfs:domain", "@type": "@id"};
        context['range'] = {'@id': 'rdfs:range', '@type': '@id'};
        context['subClassOf'] = { '@id': 'rdfs:subClassOf', '@type': '@id' };
        context['expects'] = {'@id': 'hydra:expects', '@type': '@id'};
        context['returns'] = {'@id': 'hydra:returns', '@type': '@id'};

        // TODO get prefixes from SuggestionSource

        return context;
    },

    getEntryPoint: function(startNode) {

        var entryPoint = {};
        entryPoint['@id'] = 'http://schema.org/EntryPoint';
        entryPoint['@type'] = 'hydra:Class';
        entryPoint['hydra:label'] = 'EntryPoint';
        entryPoint['hydra:supportedProperty'] = this.getSupportedLinkProperties(startNode);

        return entryPoint;
    },

    getSupportedOperationFromEntryPoint: function(resourceName) {
        var supportedOps = [];
        var supportedOp = {};

        supportedOp['@type'] = 'http://schema.org/ReadAction';
        supportedOp['hydra:method'] = 'GET';
        supportedOp['expects'] = 'null';
        supportedOp['returns'] = resourceName.isCustom ? 'vocab:' + resourceName.value : resourceName.iri;

        supportedOps.push(supportedOp);
        return supportedOps;
    },

    getSupportedClass: function (cell, outboundLinks) {
        var resourceName = cell.prop('resourceName');

        var classObj = {};
        classObj['@id'] = resourceName.isCustom ? 'vocab:' + resourceName.value : resourceName.iri;
        classObj['@type'] = 'hydra:Class';
        if(cell.prop('structuralType') && cell.prop('structuralType') == 'collection') classObj['subClassOf'] = 'hydra:Collection';
        if (resourceName.isCustom) classObj['rdfs:comment'] = resourceName.customDescr;
        classObj['rdfs:label'] = cell.prop('value');
        classObj['hydra:description'] = resourceName.isCustom ? resourceName.customDescr : sugSource.getDescriptionFromVocab(resourceName.iri);
        classObj['hydra:supportedProperty'] = this.getSupportedProperties(cell);

        // only for links pointing back to the same resource
        classObj['hydra:supportedOperation'] = this.getSupportedOperationsForClass(cell);


        return classObj;

    },


    getSupportedProperties: function (cell) {
        var supportedPropsArr = [];
        var resourceAttrs = cell.prop('resourceAttrs');
        var resourceName = cell.prop('resourceName');

        // resource attributes from resource have literal values and are shipped as resource content
        if(resourceAttrs) {
            resourceAttrs.forEach(function (attr) {

                var supportedProp = {}, hydraProp = {};
                supportedProp['@type'] = 'hydra:SupportedProperty';

                hydraProp['@id'] = attr.isCustom ? 'vocab:' + attr.value : attr.iri;
                hydraProp['@type'] = 'rdf:Property';
                hydraProp['rdfs:label'] = attr.value;
                if (attr.isCustom) hydraProp['rdfs:comment'] = attr.customDescr;
                hydraProp['domain'] = resourceName.isCustom ? 'vocab:' + resourceName.value : resourceName.iri;
                hydraProp['range'] = attr.dataType ? 'xmls:' + attr.dataType : 'xmls:string';

                supportedProp['hydra:property'] = hydraProp;
                supportedProp['hydra:title'] = attr.value;
                supportedProp['hydra:description'] = attr.isCustom ? attr.customDescr : sugSource.getDescriptionFromVocab(attr.iri);
                //supportedProp['hydra:required']
                supportedProp['hydra:readonly'] =  attr.isReadonly;

                supportedPropsArr.push(supportedProp);
            });
        }

        //if Node is a Collection and Items are embedded in Collection: add standard property 'hydra:member'
        if(this.checkNodeIsCollection(cell)) {

            var linkToItem = this.getLinkToItemNode(cell);
            if(linkToItem.prop('embedItems') && linkToItem.prop('embedItems') === true) {
                var memberProp =
                    {
                        'hydra:property': {
                            '@id' : 'hydra:member',
                            '@type' : 'rdf:Property',
                            'domain': this.getResourceNameOfNode(cell),
                            'range': this.getResourcenNameOfTarget(linkToItem)
                        },
                        'hydra:title' : 'member',
                        'hydra:description' : 'A member of the collection.'
                };

                supportedPropsArr.push(memberProp);
            }
        }

        var supportedLinkProps = this.getSupportedLinkProperties(cell);
        return supportedPropsArr.concat(supportedLinkProps);
    },

    // get link relations of outgoing links
    // (They have type hydra:Link and indicate to client that value is a dereferencable URL)
    getSupportedLinkProperties: function (cell) {

        var supportedLinkPropsArr = [];
        var resourceName = '', domain = '';
        if(cell.prop('resourceName')) {
            domain = resourceName.isCustom ? 'vocab:' + resourceName.value : resourceName.iri;
        } else {
            // cell is the start node
            domain = 'http://schema.org/EntryPoint';
        }

        var outboundLinks = this._graph.getConnectedLinks(cell, {outbound: true});
        var self = this;

        if (outboundLinks) {
            outboundLinks.forEach(_.bind(function (link) {

                if (!this.checkLinkIsSelfReferencing(link)) {

                    var linkOperations = link.prop('operations');

                    if (linkOperations && linkOperations.length > 0) {

                        linkOperations.forEach(function (op) {
                            var supportedPropLink = {}, hydraPropLink = {}, descr;
                            if(op.iri === 'http://www.w3.org/ns/hydra/core#member') {
                                descr = 'A member of the collection'; // TODO this is just a quick fix, Hydra vocab should be parsed
                            } else {
                                descr = op.isCustom ? op.customDescr : sugSource.getDescriptionFromVocab(op.iri);
                            }

                            hydraPropLink['@id'] = op.isCustom ? 'vocab:' + op.value : op.iri;
                            hydraPropLink['@type'] = 'hydra:Link';
                            hydraPropLink['rdfs:label'] = op.value;
                            if (op.isCustom) hydraPropLink['rdfs:comment'] = op.customDescr;
                            hydraPropLink['domain'] = domain;
                            hydraPropLink['range'] = self.getResourcenNameOfTarget(link);

                            hydraPropLink['hydra:supportedOperation'] = self.getSupportedOperationsForProperty(link, op);

                            supportedPropLink['hydra:property'] = hydraPropLink;
                            supportedPropLink['hydra:title'] = op.value;
                            supportedPropLink['hydra:description'] = descr;
                            //supportedPropLink['hydra:required'] = 'null';
                            supportedPropLink['hydra:readonly'] = 'true';

                            supportedLinkPropsArr.push(supportedPropLink);
                        });
                    }
                }

                // if TragetNode is a Collection and link prop 'Allow filter queries' is checked: add filter operation
                if (this.checkNodeIsCollection(this.getTarget(link))) {
                    var filterLinkProp = this.getFilterLinkPropIfRequired(link);
                    if (filterLinkProp) supportedLinkPropsArr.push(filterLinkProp);
                }

            }, this));
        }



        return supportedLinkPropsArr;
    },

    // Only deals with links where targetNode != sourceNode
    getSupportedOperationsForProperty: function (link, operation) {

        var supportedOpsForPropArr = [];

        if (!this.checkLinkIsSelfReferencing(link)) {

            var operationForPropObj = {}, expects = '', returns = '';
            var source = this.getSource(link);
            var target = this.getTarget(link);

            if (operation.method == 'RETRIEVE') {
                expects = null;
                returns = this.getResourcenNameOfTarget(link);
            }
            else if (operation.method == 'CREATE') {

                // case 2: SourceNode = Collection and TargetNode = Item
                if (this.checkNodeIsCollection(source) && this.checkNodeIsItem(target)) {
                    expects = returns = this.getResourcenNameOfTarget(link);
                }
                // case 3: SourceNode = some other Node and TargetNode = Collection
                else if (this.checkNodeIsCollection(target)) {
                    //get corresponding item node for collection node
                    var linkToItemT = this.getLinkToItemNode(target);
                    expects = this.getResourcenNameOfTarget(linkToItemT);
                    returns = this.getResourcenNameOfTarget(link);
                }
                // default case: (assumption: TargetNode is the Type to be created)
                else {
                    expects = returns = this.getResourcenNameOfTarget(link);
                }

            }
            else if (operation.method == 'REPLACE') {
                // if link is not self referencing, then assumption is that target node is supposed to be replaced
                expects = returns = this.getResourcenNameOfTarget(link);
            }
            else if (operation.method == 'DELETE') {
                expects = null;
                returns = 'owl:Nothing';
            }

            // TODO @id ??
            operationForPropObj['@type'] = this.getActionType(operation);
            if(operation.isCustom) operationForPropObj['rdfs:comment'] = operation.customDescr;
            operationForPropObj['hydra:method'] = this.getOperationMethod(operation);
            operationForPropObj['expects'] = expects;
            operationForPropObj['returns'] = returns;

            supportedOpsForPropArr.push(operationForPropObj);
        }
        return supportedOpsForPropArr;
    },

    // Deals with link where targetNode = sourceNode
    getSupportedOperationsForClass: function (cell) {

        var operationsForClassArr = [],
            selfLink = this.getSelfReferencingLink(cell);

        if (selfLink) {
            var linkOperations = selfLink.prop('operations');
            if (linkOperations && linkOperations.length > 0) {

                linkOperations.forEach(_.bind(function (operation) {

                    var operationForClass = {}, expects = '', returns = '';

                    if (operation.method == 'RETRIEVE') {
                        expects = null;
                        returns = this.getResourceNameOfNode(cell);
                    }
                    else if (operation.method == 'CREATE' || operation.method == 'REPLACE') {

                        // case: Node is a Collection
                        if (this.checkNodeIsCollection(cell)) {
                            //get corresponding item node for collection node
                            var linkToItem = this.getLinkToItemNode(cell);
                            expects = this.getResourcenNameOfTarget(linkToItem);
                            returns = this.getResourceNameOfNode(cell);

                        } else {
                            //default: a resource of the type of the node itself is supposed to be created / replaced
                            expects = returns = this.getResourceNameOfNode(cell);
                        }

                    } else if (operation.method == 'DELETE') {
                        expects = null;
                        returns = 'owl:Nothing';
                    }


                    operationForClass['@type'] = this.getActionType(operation);
                    if(operation.isCustom) operationForClass['rdfs:comment'] = operation.customDescr;
                    operationForClass['hydra:method'] = this.getOperationMethod(operation);
                    operationForClass['expects'] = expects;
                    operationForClass['returns'] = returns;
                    operationForClass['hydra:title'] = operation.value;
                    operationForClass['hydra:description'] = operation.isCustom ? operation.customDescr : sugSource.getDescriptionFromVocab(operation.iri);
                    // TODO get description for IANA rels

                    operationsForClassArr.push(operationForClass);

                }, this));
            } // operations
        } // SelfLink
        return operationsForClassArr;
    },

    // creates a standard property whose values (that will be served by the server) are templated links
    getFilterLinkPropIfRequired: function (linkToCollection) {

        var target = this.getTarget(linkToCollection);
        var linkToItem = this.getLinkToItemNode(target);

        if(linkToItem && linkToItem.prop('allowFilter') && linkToItem.prop('allowFilter') === true) {

            return {
                'hydra:property' : {
                    '@id' : 'hydra:search',
                    '@type' : 'hydra:TemplatedLink',
                    //'rdfs:label': 'A IRI template that can be used to query a collection.'
                },
                'hydra:title': 'Search',
                'hydra:description' : 'Filter items of the collection',
                'hydra:readonly': true
            };
        }
    },

    getRelationValueForFilterLink: function (linkToCollection) {

        var hasRetrieveOp = false, retrieveOpVal;

        linkToCollection.prop('operations').forEach(function (op) {
            if(op.method == 'RETRIEVE') {
                hasRetrieveOp = true;
                retrieveOpVal = op.value;
            }
        });

        // if the link already has a RETRIEVE operation: take the same relation value
        if(hasRetrieveOp == true) {
            return retrieveOpVal;
        } else {
            // else take lowercase collection name
            return this.getResourcenNameOfTarget(linkToCollection);
        }
    },

     // Looks for links whose source node and target node are the same (= <cell> )
    // returns the first link that was found for the given node
    getSelfReferencingLink: function (cell) {

        var outgoingLinks = this._graph.getConnectedLinks(cell, {outbound: true});
        var incomingLinks = this._graph.getConnectedLinks(cell, {inbound: true});

        var returningLinks = [];
        if (outgoingLinks && incomingLinks && outgoingLinks.length > 0 && incomingLinks.length > 0) {
            outgoingLinks.forEach(function (outLink) {
                var sourceId = outLink.get('source').id;
                incomingLinks.forEach(function (inLink) {
                    var targetId = inLink.get('target').id;
                    if (sourceId === targetId && inLink.get('id') === outLink.get('id')) {
                        returningLinks.push(inLink);
                    }
                });
            });
        }
        //console.log('found returning links for node ' + cell.prop('resourceName').value + ': ' + JSON.stringify(returningLinks));
        if(returningLinks.length > 0) return returningLinks[0];
    },

    getResourceNameOfNode: function (cell) {
        var resName = cell.prop('resourceName');
        if(resName) return resName.isCustom ? 'vocab:'+resName.value : resName.iri;
    },

    getResourcenNameOfTarget: function(link) {
        var target = this.getTarget(link);
        return this.getResourceNameOfNode(target);
    },

    getResourcenNameOfSource: function(link) {
        var source = this.getSource(link);
        return this.getResourceNameOfNode(source);
    },

    checkNodeIsItem: function (cell) {
         return (cell.prop('structuralType') && cell.prop('structuralType') == 'item');
    },
    
    checkNodeIsCollection: function (cell) {
        return (cell.prop('structuralType') && cell.prop('structuralType') == 'collection');
    },

    getSource: function (link) {
        var node = link.get('source');
        if(node) return this._graph.getCell(node.id);
    },

    getTarget: function (link) {
        var node = link.get('target');
        if(node) return this._graph.getCell(node.id);
    },
    
    checkLinkIsSelfReferencing: function (link) {
        var source = this.getSource(link);
        var target = this.getTarget(link);
        if(source && target)
            return source.id == target.id;
    },

    // returns the link that connects the collection node to the target node
    getLinkToItemNode: function (collectionNode) {
        // get all outgoing links
        var outgoingLinks = this._graph.getConnectedLinks(collectionNode, {outbound: true});
        var linkToItemNode;
        if(outgoingLinks) {
            outgoingLinks.forEach(_.bind(function (link) {
                // get the link that has isCollItemLink set to true
                if(link.prop('isCollItemLink') && link.prop('isCollItemLink') === true) {
                    linkToItemNode = link;
                }
            }, this));
        }
        return linkToItemNode;
    },

    getActionType: function (operation) {
        var actionTypes = ['hydra:Operation'];
        if(operation.actionPrefix && operation.actionValue)
                        actionTypes.push(operation.actionPrefix + ':' + operation.actionValue);
        return actionTypes;
    },

    getOperationMethod: function (operation) {
        return operation.method ? this._mapHttpMethods[operation.method] : 'GET';
    }
};

module.exports = HydraDocs;

