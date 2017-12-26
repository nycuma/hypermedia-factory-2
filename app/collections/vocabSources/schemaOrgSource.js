/**
 * Created by Julian Richter on 21 Dec 2017
 */

'use strict';

var Backbone = require('backbone');
var $ = require('jquery');
Backbone.$ = $;
var N3 = require('n3');
var Term = require('../../models/term');

var SchemaOrgSource = Backbone.Collection.extend({

    model: Term,
    url: '../app/static/vocabs/schema.ttl',

    sync: function (method, model, options) {
        if(method == 'read') {
            console.log('Schema.org sync called');

            var ajaxParams = _.extend({
                url: this.url,
                method: 'GET',
                dataType: 'text',
                success: function (data, textStatus, jqXHR) {
                    console.log('sucessfully received Schema.org turtle file');
                },
                error: function () {
                    console.log('error while requesting Schema.org turtle file');

                }

            }, options);


            return $.ajax(ajaxParams);

        }

    },

    parse: function (turtle) {
        console.log('Schema.org parser called');

        var store = N3.Store();
        var parser = N3.Parser({ format: 'Turtle' });
        var term = {};
        var self = this;

        // synchron
        var triples = parser.parse(turtle);
        triples.forEach(function (triple) {
            store.addTriple(triple.subject, triple.predicate, triple.object);
        });

        // filter all unique Schema.org classes
        store.forSubjectsByIRI(function (subject) {
            term.value = subject.substr(18);
            term.prefix = 'schema';
            term.isRdfClass = true;
            if(term.value.startsWith('Action') || term.value.endsWith('Action')) {
                // TODO bug: other terms are also marked as actions
                //console.log('isAction: ' + term.value);
                term.isAction = true;
            } else {
                term.isAction = false;
            }
            term.label = term.prefix + ': ' + term.value;
            var rdfComment = store.getObjectsByIRI(subject, 'http://www.w3.org/2000/01/rdf-schema#comment')[0];
            term.desc = rdfComment.substr(1, rdfComment.length-2);
            self.push(term);
        }, null, 'http://www.w3.org/2000/01/rdf-schema#Class');

        // filter unique Schema.org properties
        store.forSubjectsByIRI(function (subject) {
            term.value = subject.substr(18);
            term.prefix = 'schema';
            term.isRdfProperty = true;
            term.label = term.prefix + ': ' + term.value; // TODO: set label automatically on model
            term.desc = store.getObjectsByIRI(subject, 'http://www.w3.org/2000/01/rdf-schema#comment');
            self.push(term);
        }, null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#:Property');


        // asynchron
        /*
        parser.parse(data,
            function (error, triple, prefixes) {
                if (triple) {

                    store.addTriple(triple.subject, triple.predicate, triple.object);


                    if (triple.subject == 'http://schema.org/Person' &&
                        triple.predicate == 'http://www.w3.org/2000/01/rdf-schema#subClassOf') {

                        console.log(triple.subject, triple.predicate, triple.object, '.');
                        countInCB++;
                        console.log('current count: ' + countInCB);
                    }
                }
            });
            */
        return this.models;
    }
});



module.exports = SchemaOrgSource;


