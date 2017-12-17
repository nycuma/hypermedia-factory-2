/**
 * Created by Julian Richter on 10 Dec 2017
 */

'use strict';

var $ = require('jquery');


var getIanaLinkRelations = function() {

    $.ajax({
        url: '../app/static/vocabs/link-relations.xml',
        method: 'GET',
        dataType: 'xml',
        success: function (data, textStatus, jqXHR) {
            console.log('sucessfully received IANA XML file');

            parseLinkRelsFromXML(jqXHR.responseXML);
        },
        error: function () {
            console.log('error while requesting IANA XML file');
            
        }

    });
};


/**
 * Parses XML file and saves the link relation values as strings in an array
 * @param xml XML file
 * @returns array with IANA link relations
 */
function parseLinkRelsFromXML(xml) {
    var linkRelsArr = [];
    var linkRelNodes = xml.getElementsByTagName('value');
    for (var i = 0; i < linkRelNodes.length; i++) {
        console.log('IANA rel ' + i + ': '+ linkRelNodes[i].childNodes[0].nodeValue);
        linkRelsArr.push(linkRelNodes[i].childNodes[0].nodeValue);
    }
    return linkRelsArr;
}



module.exports = {
    getIanaLinkRelations: getIanaLinkRelations
};




