/**
 * Created by Julian Richter on 21 Dec 2017
 */

'use strict';

var Backbone = require('backbone');
var $ = require('jquery');
Backbone.$ = $;
var _ = require('underscore');
var N3 = require('n3');
var Term = require('../../models/term');

var SchemaOrgSource = Backbone.Collection.extend({

    model: Term,
    url: '../app/static/vocabs/schema.ttl',

    store: N3.Store(null, {prefixes : {schema : 'http://schema.org'}}),

    sync: function (method, model, options) {
        if(method == 'read') {
            console.log('Schema.org sync called');

            var ajaxParams = _.extend({
                url: this.url,
                method: 'GET',
                dataType: 'text',
                success: function() {
                    console.log('sucessfully received Schema.org turtle file');
                },
                error: function() {
                    console.log('error while requesting Schema.org turtle file');

                }

            }, options);

            return $.ajax(ajaxParams);
        }
    },

    parse: function (turtle) {
        console.log('Schema.org parser called');

        var parser = N3.Parser({ format: 'Turtle' });
        var self = this;

        parser.parse(turtle, function(error, triple) {
            if (triple) {
                self.store.addTriple(triple.subject, triple.predicate, triple.object);
            } else {
                console.log('finished parsing Schema.org file');
            }
            if(error) {
                console.log('error while parsing Schema.org turtle file');
            }

        });


        // synchron
        /*
        triples.forEach(_.bind(function (triple) {
            this.store.addTriple(triple.subject, triple.predicate, triple.object);
        }, this));
        */

        /*
        // filter unique Schema.org properties
        this.store.forSubjectsByIRI(_.bind(function (subject) {
            var rdfComment = this.store.getObjectsByIRI(subject, 'http://www.w3.org/2000/01/rdf-schema#comment')[0];
            self.add(new Term({ value: subject.substr(18),
                                prefix: 'schema',
                                isRdfProperty: true,
                                descr : rdfComment.substr(1, rdfComment.length-2)
            }));
        }, this), null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property');


        // filter all unique Schema.org classes
        this.store.forSubjectsByIRI(_.bind(function (subject) {

            // TODO test if no comment available
            var rdfComment = this.store.getObjectsByIRI(subject, 'http://www.w3.org/2000/01/rdf-schema#comment')[0];
            self.add(new Term({ value: subject.substr(18),
                                prefix: 'schema',
                                isRdfClass: true,
                                isAction: subject.substr(18).includes('Action'),
                                descr : rdfComment.substr(1, rdfComment.length-2)
            }));
        }, this), null, 'http://www.w3.org/2000/01/rdf-schema#Class');
        */

        //return this.models;
    }
});



module.exports = SchemaOrgSource;


