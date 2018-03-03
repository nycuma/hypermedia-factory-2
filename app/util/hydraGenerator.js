/**
 * Created by Julian Richter on 04 Feb 2018
 */

'use strict';

var _ = require('underscore');
var Utils = require('./utils');
var sugSource;
sugSource = require('../collections/suggestionSource');

// TODO sonderfall: when resource == collection, dann type: hydra:Collection
// TODO TemplatedLinks for filter operations

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
}

HydraDocs.prototype = {


    downloadHydraAPIDocs: function () {
        var completeDocs = this.generateHydraObj();

        //Utils.downloadZip('docs.jsonld', JSON.stringify(completeDocs, null, 2), 'hydraAPI');
        console.log('COMPLETE DOCS:\n' + JSON.stringify(completeDocs, null, 2));
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
        //context['subClassOf'] = { '@id': 'rdfs:subClassOf', '@type': '@id' };
        context['expects'] = {'@id': 'hydra:expects', '@type': '@id'};
        context['returns'] = {'@id': 'hydra:returns', '@type': '@id'};

        // TODO get prefixes from SuggestionSource

        return context;
    },

    getEntryPoint: function(startNode) {

        var entryPoint = {};
        entryPoint['@id'] = 'http://schema.org/EntryPoint';
        entryPoint['@type'] = 'hydra:Class';
        entryPoint['label'] = 'EntryPoint';
        entryPoint['supportedProperty'] = this.getSupportedLinkProperties(startNode);

        return entryPoint;
    },

    /*
    getLinksFromEntryPoint: function (startNode) {

        var supportedProps = [];
        // get links from StartNode
        var startLinks = this._graph.getConnectedLinks(startNode, {outbound: true});
        var self = this;

        if(startLinks) {
            startLinks.forEach(function(link) {
                var linkProp = {}, hydraProp = {};
                var targetNode = link.get('target').id;
                var resourceName = self._graph.getCell(targetNode).prop('resourceName');

                hydraProp['@id'] = resourceName.value.charAt(0).toLowerCase() + resourceName.value.slice(1);
                hydraProp['@type'] = 'hydra:Link';
                hydraProp['domain'] = 'http://schema.org/EntryPoint';
                hydraProp['range'] = resourceName.isCustom ? 'vocab:' + resourceName.value : resourceName.iri;
                hydraProp['supportedOperation'] = self.getSupportedOperationFromEntryPoint(resourceName);

                linkProp['hydra:property'] = hydraProp;
                linkProp['hydra:title'] = resourceName.value;
                linkProp['hydra:description'] = resourceName.isCustom ? resourceName.customDescr : sugSource.getDescriptionFromVocab(resourceName.iri);


                supportedProps.push(linkProp);
            });
        }
        return supportedProps;
    },
    */

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
        if (resourceName.isCustom) classObj['rdfs:comment'] = resourceName.customDescr;
        classObj['rdfs:label'] = cell.prop('value');
        classObj['hydra:description'] = resourceName.isCustom ? resourceName.customDescr : sugSource.getDescriptionFromVocab(resourceName.iri);
        classObj['hydra:supportedProperty'] = this.getSupportedProperties(cell);

        // only for links pointing back to the same resource
        var selfReferecingLinks = this.getSelfReferencingLinks(cell);
        classObj['hydra:supportedOperation'] = this.getSupportedOperationsForClass(cell, selfReferecingLinks);


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

        if(outboundLinks) {
            outboundLinks.forEach(function (link) {

                var linkOperations = link.prop('operations');

                if (linkOperations && linkOperations.length > 0) {

                    linkOperations.forEach(function (op) {
                        var supportedPropLink = {}, hydraPropLink = {};

                        hydraPropLink['@id'] = op.isCustom ? 'vocab:' + op.value : op.iri;
                        hydraPropLink['@type'] = 'hydra:Link';
                        hydraPropLink['rdfs:label'] = op.value;
                        if (op.isCustom) hydraPropLink['rdfs:comment'] = op.customDescr;
                        hydraPropLink['domain'] = domain;
                        hydraPropLink['range'] = self.getResourcenNameOfTarget(link);

                        hydraPropLink['hydra:supportedOperation'] = self.getSupportedOperationsForProperty(link, op);

                        supportedPropLink['hydra:property'] = hydraPropLink;
                        supportedPropLink['hydra:title'] = op.value;
                        supportedPropLink['hydra:description'] = op.isCustom ? op.customDescr : sugSource.getDescriptionFromVocab(op.iri);
                        supportedPropLink['hydra:required'] = 'null';
                        supportedPropLink['hydra:readonly'] =  'true';

                        supportedLinkPropsArr.push(supportedPropLink);
                    });
                }
            });
        }

        return supportedLinkPropsArr;
    },

    // Only deals with links where targetNode != sourceNode
    getSupportedOperationsForProperty: function (link, operation) {

        if (!this.checkLinkIsSelfReferencing(link)) {

            var operationsForPropObj = {}, expects = '', returns = '';
            var source = this.getSource(link);
            var target = this.getTarget(link);

            if (operation.method == 'RETRIVE') {
                expects = null;
                returns = this.getResourcenNameOfTarget(link);
            }
            else if (operation.method = 'CREATE') {

                if (this.checkLinkIsSelfReferencing(link)) {
                    // case 1: SourceNode = Collection and TargetNode = Collection // TODO this method should not deal with self-referencing links
                    if (this.checkNodeIsCollection(source) && this.checkNodeIsCollection(target)) {
                        //get corresponding item node for collection node
                        var itemNodeS = this.getItemNode(source);
                        expects = returns = itemNodeS;
                    }
                } else {
                    // case 2: SourceNode = Collection and TargetNode = Item
                    if (this.checkNodeIsCollection(source) && this.checkNodeIsItem(target)) {
                        expects = returns = this.getResourcenNameOfTarget(link);
                    }
                    // case 3: SourceNode = some other Node and TargetNode = Collection
                    else if (this.checkNodeIsCollection(target)) {
                        //get corresponding item node for collection node
                        var itemNodeT = this.getItemNode(target);
                        expects = returns = itemNodeT;
                    }
                }
            }
            else if (operation.method = 'REPLACE') {

                if (this.checkLinkIsSelfReferencing(link)) {
                    // case 1: link is self referencing // TODO this method should not deal with self-referencing links
                    expects = returns = this.getResourcenNameOfSource(link);

                } else {
                    // case 2: link is not self referencing (then we assume that target node is supposed to be replaced)
                    expects = returns = this.getResourcenNameOfTarget(link);
                }
            }
            else if (operation.method == 'DELETE') {
                expects = null;
                returns = 'owl:Nothing';
            }

            // TODO @id ??
            operationsForPropObj['@type'] = operation.actionPrefix && operation.actionValue ?
                            operation.actionPrefix + ':' + operation.actionValue : 'hydra:Operation';
            operationsForPropObj['hydra:method'] = operation.method ? operation.method : 'RETRIEVE';
            operationsForPropObj['expects'] = expects;
            operationsForPropObj['returns'] = returns;

            return operationsForPropObj;
        }




        /**
         *{
                                "@id": "_:user_retrieve",
                                "@type": "hydra:Operation",
                                "method": "GET",
                                "label": "Retrieves a User entity",
                                "description": null,
                                "expects": null,
                                "returns": "vocab:User",
                                "statusCodes": []
                            }
         */


    },

    // Deals with link where targetNode = sourceNode
    getSupportedOperationsForClass: function (cell, returningLinks) {
        var operationsForClassArr = [], operationForClass = {};


        return operationsForClassArr;
    },



     //Returns an array with all links for <cell> whose source node and target node are the same
      //TODO do we need that?

    getSelfReferencingLinks: function (cell) {

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
        return returningLinks;
    },

    getResourcenNameOfTarget: function(link) {
        var target = this.getTarget(link);
        var targetNodeResName = target.prop('resourceName');
        return targetNodeResName.isCustom ? 'vocab:'+targetNodeResName.value : targetNodeResName.iri;
    },

    getResourcenNameOfSource: function(link) {
        var source = this.getSource(link);
        var targetNodeResName = source.prop('resourceName');
        if(targetNodeResName)
            return targetNodeResName.isCustom ? 'vocab:'+targetNodeResName.value : targetNodeResName.iri;
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

    // returns corresponding item node for a collection node
    getItemNode: function (collectionNode) {
        // get all outgoing links
        var outgoingLinks = this._graph.getConnectedLinks(collectionNode, {outbound: true});

        if(outgoingLinks) {
            outgoingLinks.forEach(_.bind(function (link) {
                // get the link that has isCollItemLink set to true
                if(link.prop('isCollItemLink') && link.prop('isCollItemLink') === true) {
                    // get target node of that link
                    return this.getTarget(link);
                }
            }, this));
        }
    }
};

module.exports = HydraDocs;

