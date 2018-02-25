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
}

HydraDocs.prototype = {


    downloadHydraAPIDocs: function () {
        var completeDocs = this.generateHydraObj();

        //Utils.downloadZip('docs.jsonld', JSON.stringify(completeDocs, null, 2));
        console.log('complete docs: ' + JSON.stringify(completeDocs, null, 2));
    },

    generateHydraObj: function () {
        var docs = {};

        docs['@context'] = this.generateContext();
        docs['@id'] = this._id;
        docs['@type'] = 'hydra:ApiDocumentation';
        docs['hydra:title'] = this._apiTitle;
        docs['hydra:description'] = this._apiDescr;

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

        return context;
    },

    getEntryPoint: function () {

        var entryPoint = {};


        return entryPoint;
    },

    getSupportedClass: function (cell, outboundLinks) {
        var resourceName = cell.prop('resourceName');

        var classObj = {};
        classObj['@id'] = resourceName.isCustom ? 'vocab:' + resourceName.value : resourceName.iri;
        classObj['@type'] = 'hydra:Class';
        if (resourceName.isCustom) classObj['rdfs:comment'] = resourceName.customDescr;
        classObj['rdfs:label'] = cell.prop('value');
        //classObj['hydra:description'] = cell.prop('isCustom') ? cell.prop('customDescr') : // TODO get RDF comment
        classObj['hydra:supportedProperty'] = this.getSupportedProperties(cell);

        // only for links pointing back to the same resource
        var returningLinks = this.getReturningLinks(cell);
        classObj['hydra:supportedOperation'] = this.getSupportedOperationsForClass(cell, returningLinks);


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
                hydraProp['range'] = 'xmls:' + attr.dataType;

                supportedProp['hydra:property'] = hydraProp;
                supportedProp['hydra:title'] = attr.value;
                supportedProp['hydra:description'] = attr.isCustom ? attr.customDescr : sugSource.getDescriptionFromVocab(attr.iri);
                //supportedProp['hydra:required']
                supportedProp['hydra:readonly'] =  attr.isReadonly;

                supportedPropsArr.push(supportedProp);
            });
        }



        // get link relations of outgoing links
        // (They have type hydra:Link and indicate to client that value is a dereferencable URL)
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
                        hydraPropLink['domain'] = resourceName.isCustom ? 'vocab:' + resourceName.value : resourceName.iri;
                        hydraPropLink['range'] = self.getResNameTargetNode(link);



                        hydraPropLink['hydra:supportedOperation'] = self.getSupportedOperationsForProperty(link, op);

                        supportedPropLink['hydra:property'] = hydraPropLink;
                        supportedPropLink['hydra:title'] = op.value;
                        supportedPropLink['hydra:description'] = op.isCustom ? op.customDescr : sugSource.getDescriptionFromVocab(op.iri);
                        supportedPropLink['hydra:required'] = 'null';
                        supportedPropLink['hydra:readonly'] =  'true';

                        supportedPropsArr.push(supportedPropLink);
                    });
                }
            });
        }

        return supportedPropsArr;
    },

    getSupportedOperationsForProperty: function (link, operation) {
        var operationsForPropObj = {};
        // TODO id?

        return operationsForPropObj;

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

    getSupportedOperationsForClass: function (cell, returningLinks) {
        var operationsForClassArr = [];

        return operationsForClassArr;
    },


    /**
     * Returns an array with all links for <cell> whose source node and target node are the same
     */
    getReturningLinks: function (cell) {
        var outgoingLinks = this._graph.getConnectedLinks(cell, {outbound: true});
        var incomingLinks = this._graph.getConnectedLinks(cell, {inbound: true});
        var returningLinks = [];
        if (outgoingLinks && incomingLinks && outgoingLinks.length > 0 && incomingLinks.length > 0) {
            outgoingLinks.forEach(function (outLink) {
                var sourceId = outLink.get('source').id;
                incomingLinks.forEach(function (inLink) {
                    var targetId = inLink.get('target').id;
                    if (sourceId === targetId === cell.id) {
                        returningLinks.push(inLink);
                    }
                });
            });
        }
        console.log('found returning links for node ' + cell.id + ': ' + JSON.stringify(returningLinks));
        return returningLinks;
    },

    getResNameTargetNode: function(link) {
        console.log('link target: ' + JSON.stringify(link.get('target')));
        var targetNode = this._graph.getCell(link.get('target').id);

        console.log('target node res name: ' + JSON.stringify(this._graph.getCell(targetNode)));

        var targetNodeResName = targetNode.prop('resourceName');

        return targetNodeResName.isCustom ? 'vocab:'+targetNodeResName.value : targetNodeResName.iri;
    }

};

/*
function getProfileDocs(graph) {

    var cells = graph.get('cells');


    cells.forEach(function (cell) {
        if (cell.get('type') === 'html.Node') {

            var jsonLdAsString = getJsonLdStringForNode(cell);

             console.log('cell type: ' + cell.get('type'));
             console.log('cell resource name: ' + JSON.stringify(cell.prop('resourceName')));
             console.log('cell resource attrs: ' + JSON.stringify(cell.prop('resourceAttrs')));
             console.log('cell struc type: ' + JSON.stringify(cell.prop('structuralType')));

             var outboundLinks = graph.getConnectedLinks(cell, { outbound: true });

             outboundLinks.forEach(function(outLink) {
             console.log('\toutLink type: ' + outLink.get('type'));
             console.log('\tlink source: ' + outLink.get('source').id);
             console.log('\tlink target: ' + outLink.get('target').id);
             console.log('\tlink relation: ' + JSON.stringify(outLink.prop('relation')));
             console.log('\tlink operations: ' + JSON.stringify(outLink.prop('operations')));
             console.log('\n');
             });

        }

         if(cell.get('type') === 'link.RelationLink') {
         console.log('cell type: ' + cell.get('type'));
         console.log('link source: ' + cell.get('source').id);
         console.log('link target: ' + cell.get('target').id);
         }



    });

}

function getJsonLdStringForNode(node) {

    var context = {};

    context['@type'] = sugSource.getPrefixIRIFromPrefix(node.prop('resourceName').prefix)
        + node.prop('resourceName').value;

    var resourceAttrs = node.prop('resourceAttrs');
    if (resourceAttrs) {
        resourceAttrs.forEach(function (attr) {
            context[attr.value] = sugSource.getPrefixIRIFromPrefix(attr.prefix)
                + attr.value;
        });
    }

    var outboundLinks = graph.getConnectedLinks(cell, {outbound: true});

    outboundLinks.forEach(function (outLink) {
        console.log('\toutLink type: ' + outLink.get('type'));
        console.log('\tlink source: ' + outLink.get('source').id);
        console.log('\tlink target: ' + outLink.get('target').id);
        console.log('\tlink relation: ' + JSON.stringify(outLink.prop('relation')));
        console.log('\tlink operations: ' + JSON.stringify(outLink.prop('operations')));
        console.log('\n');
    });

    //return JSON.stringify(context, null, '\t');
    return JSON.stringify(context, null, 2);

    }*/

module.exports = HydraDocs;