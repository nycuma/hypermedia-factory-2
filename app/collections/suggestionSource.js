/**
 * Created by Julian Richter on 18 Dec 2017
 */

'use strict';

var Backbone = require('backbone');
var Suggestion = require('../models/suggestion');

var SuggestionList = Backbone.Collection.extend({

    model: Suggestion,
    url: '../app/static/vocabs/link-relations.xml',

    sync: function (method, model, options) {
        if(method == 'read') {

            var ajaxParams = {
                url: '../app/static/vocabs/link-relations.xml',
                method: 'GET',
                dataType: 'xml',
                success: function (data, textStatus, jqXHR) {
                    console.log('sucessfully received IANA XML file');

                    this.parse(jqXHR.responseXML);
                },
                error: function () {
                    console.log('error while requesting IANA XML file');

                }

            };


            return $.ajax(ajaxParams);

        }

    },



    parse: function (data) {
        this.parseLinkRelsFromXML(data);
    },


    parseLinkRelsFromXML: function (xml) {
    var linkRelsArr = [];
    var linkRelNodes = xml.getElementsByTagName('value');
    for (var i = 0; i < linkRelNodes.length; i++) {
        console.log('IANA rel ' + i + ': '+ linkRelNodes[i].childNodes[0].nodeValue);
        linkRelsArr.push(linkRelNodes[i].childNodes[0].nodeValue);
    }
    return linkRelsArr;

    // TODO: set model props with data (name, vocab, comment, etc.)
    // var item = {name: .., :vocab: 'IANA Link Relations', ... }
    //this.push(term);
        // return this.models
}
});

module.exports = SuggestionList;
