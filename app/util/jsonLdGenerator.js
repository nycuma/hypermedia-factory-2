/**
 * Created by Julian Richter on 04 Feb 2018
 */

'use strict';

//TODO umschreiben: Funktionen an Prototype hängen
var ZipDownload = require('./zipFileGenerator');
var sugSource;
sugSource = require('../collections/suggestionSource');

var downloadJsonLdContexts = function(graph) {
    console.log('downloadJsonLdContexts called');
    //var profilDocs = getProfileDocs(graph);
    //ZipDownload.downloadZip(profilDocs);


    testJsonLdLib();
    //ZipDownload.downloadZipTest('file.txt', testJsonLdLib());



};

var downloadHydraAPI = function(graph, namespace) {
    console.log('downloadHydraAPI called');

    var hydraApiObj = {};

    // get context info
    var contextObj = getApiDocContext(namespace);

    hydraApiObj['@context'] = contextObj;
    hydraApiObj['@id'] = '/docs.jsonld';
    hydraApiObj['@type'] = 'hydra:ApiDocumentation';

    console.log('hydraApiObj: ' + JSON.stringify(hydraApiObj, null, 2));

    var cells = graph.get('cells');
    contextObj['hydra:supportedClass'] = [];
    // each resource = one supported class
    cells.forEach(function(cell) {
        if (cell.get('type') === 'html.Node') {
            // for each class: get suppoted propteries & supported operations
            var outgoingLinks = graph.getConnectedLinks(cell, { outbound: true });
            var incomingLinks = graph.getConnectedLinks(cell, { inbound: true });
            var supportedClass = getSupportedClass(cell, outgoingLinks, incomingLinks);
            contextObj['hydra:supportedClass'].push(supportedClass);
        }
    });

};

function getApiDocContext(namespace) {
    var contextObj = {};

    contextObj['vocab'] = namespace;
    contextObj['hydra'] = 'http://www.w3.org/ns/hydra/core#';
    contextObj['rdf'] = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    contextObj['rdfs'] = 'http://www.w3.org/2000/01/rdf-schema#';
    //contextObj['xmls'] = 'http://www.w3.org/2001/XMLSchema#';
    contextObj['owl'] = 'http://www.w3.org/2002/07/owl#';
    contextObj['domain'] = { "@id": "rdfs:domain", "@type": "@id" };
    contextObj['range'] = { '@id': 'rdfs:range', '@type': '@id' };
    //contextObj['subClassOf'] = { '@id': 'rdfs:subClassOf', '@type': '@id' };
    contextObj['expects'] = { '@id': 'hydra:expects', '@type': '@id' };
    contextObj['returns'] = { '@id': 'hydra:returns', '@type': '@id' };

    return contextObj;
}

function getSupportedClass(cell, outboundLinks, incomingLinks) {
    var resourceName = cell.prop('resourceName');

    var classObj = {};
    classObj['@id'] = resourceName.isCustom ? 'vocab:'+resourceName.value : resourceName.iri;
    classObj['@type'] = 'hydra:Class'; // TODO Hydra Class or Link?
    if(resourceName.isCustom) classObj['rdfs:comment'] = resourceName.customDescr;
    classObj['rdfs:label'] = cell.prop('value'); // TODO get value with spaces?
    classObj['hydra:title'] = cell.prop('value');
    //classObj['hydra:description'] = cell.prop('isCustom') ? cell.prop('customDescr') : // TODO get RDF comment
    classObj['hydra:supportedProperty'] = getSupportedProperties(cell, outboundLinks);

    // only for links pointing back to the same resource
    var returningLinks = getReturningLinks(cell, outboundLinks, incomingLinks);
    classObj['hydra:supportedOperation'] = getSupportedOperationsForClass(cell, returningLinks);


    return classObj;

}

function getSupportedProperties(cell, outboundLinks) {
    var supportedPropsArr = [];
    var resourceAttrs = cell.prop('resourceAttrs');
    var resourceName = cell.prop('resourceName');

    // resource attributes from resource have literal values and are shipped as resource content
    resourceAttrs.forEach(function(attr) {
        var supportedProp = {}, hydraProp = {};
        supportedProp['@type'] = 'hydra:SupportedProperty';

        hydraProp['@id'] = attr.isCustom ? 'vocab:'+attr.value : attr.iri;
        hydraProp['@type'] = 'rdf:Property';
        hydraProp['rdfs:label'] = attr.value;
        if(attr.isCustom) hydraProp['rdfs:comment'] = attr.customDescr;
        hydraProp['domain'] = resourceName.isCustom ? 'vocab:'+resourceName.value : resourceName.iri;
        //hydraProp['range'] = // TODO range of a property = data type

        supportedProp['hydra:property'] = hydraProp;
        supportedProp['hydra:title'] = attr.value;
        //supportedProp['hydra:description'] = attr.isCustom ? attr.customDescr : //TODO get RDF comment
        //supportedProp['hydra:required'] =  // TODO
        //supportedProp['hydra:readonly'] =  // TODO
        //supportedProp['hydra:writable'] =  // TODO

        supportedPropsArr.push(supportedProp);
    });


    // get link relations of outgoing links
    // (They have type hydra:Link and indicate to client that value is a dereferencable URL)
    outboundLinks.forEach(function(link) {

        var linkOperations = link.prop('operations');
        if(linkOperations && linkOperations.length > 0) {

            linkOperations.forEach(function(op) {
                var supportedPropLink = {}, hydraPropLink = {};

                hydraPropLink['@id'] = op.isCustom ? 'vocab:'+op.value : op.iri;
                hydraPropLink['@type'] = 'hydra:Link';
                hydraPropLink['rdfs:label'] = op.value;
                if(op.isCustom) hydraPropLink['rdfs:comment'] = op.customDescr;
                hydraPropLink['domain'] = resourceName.isCustom ? 'vocab:'+resourceName.value : resourceName.iri;
                //hydraPropLink['range'] = // TODO range = resource name of target node


                hydraPropLink['hydra:supportedOperation'] = getSupportedOperationsForProperty(link, op);

                supportedPropLink['hydra:property'] = hydraPropLink;
                supportedPropLink['hydra:title'] = op.value;
                if(op.customDescr) supportedPropLink['hydra:description'] = op.customDescr;  //TODO get RDF comment
                supportedPropLink['hydra:required'] =  'null';
                //supportedProp['hydra:readonly'] =  // TODO
                //supportedProp['hydra:writable'] =  // TODO

                supportedPropsArr.push(supportedPropLink);
            });
        }


    });

    return supportedPropsArr;
}

function getSupportedOperationsForProperty(link, operation) {
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
}

function getSupportedOperationsForClass(cell, returningLinks) {
    var operationsForClassArr = [];

    return operationsForClassArr;
}

/**
 * Returns all links for <cell> whose source node and target node are the same
 * @param cell
 * @param outboundLinks of cell
 * @param incomingLinks of cell
 * @return {Array}
 */
function getReturningLinks(cell, outboundLinks, incomingLinks) {
    var returningLinks = [];
    if(outboundLinks && incomingLinks && outboundLinks.length > 0 && incomingLinks.length > 0) {
        outboundLinks.forEach(function(outLink) {
           var sourceId = outLink.get('source').id;
           incomingLinks.forEach(function(inLink) {
              var targetId = inLink.get('target').id;
              if(sourceId === targetId === cell.id) {
                  returningLinks.push(inLink);
              }
           });
        });
    }
    console.log('found returning links for node ' + cell.id + ': ' + JSON.stringify(returningLinks));
    return returningLinks;
}


function getProfileDocs(graph){

    var cells = graph.get('cells');



    cells.forEach(function(cell) {
        if(cell.get('type') === 'html.Node') {

            var jsonLdAsString = getJsonLdStringForNode(cell);
            /*
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
            */
        }
/*
        if(cell.get('type') === 'link.RelationLink') {
            console.log('cell type: ' + cell.get('type'));
            console.log('link source: ' + cell.get('source').id);
            console.log('link target: ' + cell.get('target').id);
        }
        */


    });

    var profileDocs = [];

    profileDocs.push(['file.text', 'some json ld']);

    //for each resource in the graph
    // get resourceName, save in array at index 0

    //

    return profileDocs;
}

function getJsonLdStringForNode(node){

    var context = {};

    context['@type'] = sugSource.getPrefixIRIFromPrefix(node.prop('resourceName').prefix)
        + node.prop('resourceName').value;

    var resourceAttrs = node.prop('resourceAttrs');
    if(resourceAttrs) {
        resourceAttrs.forEach(function(attr) {
            context[attr.value] = sugSource.getPrefixIRIFromPrefix(attr.prefix)
                + attr.value;
        });
    }

    var outboundLinks = graph.getConnectedLinks(cell, { outbound: true });

    outboundLinks.forEach(function(outLink) {
        console.log('\toutLink type: ' + outLink.get('type'));
        console.log('\tlink source: ' + outLink.get('source').id);
        console.log('\tlink target: ' + outLink.get('target').id);
        console.log('\tlink relation: ' + JSON.stringify(outLink.prop('relation')));
        console.log('\tlink operations: ' + JSON.stringify(outLink.prop('operations')));
        console.log('\n');
    });

    //return JSON.stringify(context, null, '\t');
    return JSON.stringify(context, null, 2);

}


function testJsonLdLib() {
    var doc = {
        "http://schema.org/name": "Manu Sporny",
        "http://schema.org/url": {"@id": "http://manu.sporny.org/"},
        "http://schema.org/image": {"@id": "http://manu.sporny.org/images/manu.png"}
    };
    var context = {
        "name": "http://schema.org/name",
        "homepage": {"@id": "http://schema.org/url", "@type": "@id"},
        "image": {"@id": "http://schema.org/image", "@type": "@id"}
    };

    var ctxStr = JSON.stringify(context, null, '\t');
    console.log(ctxStr);

    return ctxStr;

// compact a document according to a particular context
// see: http://json-ld.org/spec/latest/json-ld/#compacted-document-form
    /*
    jsonld.compact(doc, context, function(err, compacted) {
        console.log(JSON.stringify(compacted, null, 2));

    });
*/

}

//function


module.exports = {
    downloadJsonLdProfileDocs: downloadJsonLdContexts,
    downloadHydraAPI: downloadHydraAPI
};