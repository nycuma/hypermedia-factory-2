/**
 * Created by Julian Richter on 21 Dec 2017
 */

'use strict';

var Backbone = require('backbone');
var $ = require('jquery');
Backbone.$ = $;
var Term = require('../../models/term');

var IanaLinkRelsSource = Backbone.Collection.extend({

    model: Term,
    url: '../app/static/vocabs/link-relations.xml',

    sync: function (method, model, options) {
        if(method == 'read') {
            console.log('IANA sync called');
            var ajaxParams = _.extend({
                url: this.url,
                method: 'GET',
                dataType: 'xml',
                success: function (data, textStatus, jqXHR) {
                    console.log('sucessfully received IANA XML file');
                },
                error: function () {
                    console.log('error while requesting IANA XML file');

                }

            }, options);
            return $.ajax(ajaxParams);
        }
    },



    parse: function (xml) {

        console.log('IANA parser called');

        var term = {};
        var recordNodes = xml.getElementsByTagName('record');
        for (var i = 0; i < recordNodes.length; i++) {

            for (var j = 0; j < recordNodes[i].childNodes.length; j++) {

                if (recordNodes[i].childNodes[j].nodeType != 3 && recordNodes[i].childNodes[j].nodeName == 'value') {
                    term.value = recordNodes[i].childNodes[j].childNodes[0].nodeValue;
                }
                if (recordNodes[i].childNodes[j].nodeType != 3 && recordNodes[i].childNodes[j].nodeName == 'description') {
                    term.descr = recordNodes[i].childNodes[j].childNodes[0].nodeValue;
                }
            }
            term.prefix = 'IANA';
            term.label = term.prefix + ': ' + term.value;
            this.push(term);

        }

        return this.models;
    }
});

module.exports = IanaLinkRelsSource;

