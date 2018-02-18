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

    // get context info
    var contextObj = getApiDocContext(namespace);

    var cells = graph.get('cells');
    contextObj['hydra:supportedClass'] = [];
    // each resource = one supported class
    cells.forEach(function(cell) {
        if (cell.get('type') === 'html.Node') {

            // for each class: get suppoted propteries & supported operations
            var supportedClass = getSupportedClass(cell);
            contextObj['hydra:supportedClass'].push(supportedClass);
        }
    });
};

function getApiDocContext(namespace) {

}

function getSupportedClass(cell) {

}

/**
 *
 * @param graph
 */
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