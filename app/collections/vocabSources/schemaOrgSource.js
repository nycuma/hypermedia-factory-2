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
    // PRODUCTION: url: '../static/vocabs/schema.ttl',
    // DEV:
    url: '../app/static/vocabs/schema.ttl',

    schemaDomain: 'http://schema.org/domainIncludes',
    schemaRange: 'http://schema.org/rangeIncludes',
    rdfsDomain: 'http://www.w3.org/2000/01/rdf-schema#domain',
    rdfsRange: 'http://www.w3.org/2000/01/rdf-schema#range',

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

        var parser = N3.Parser({format: 'Turtle'});
        var self = this;
        var domainPred = 0, rangePred = 0;
        parser.parse(turtle, function (error, triple) {

            if (triple) {

                // Schema.org defines a new term to describe the domain and range of properties,
                // instead of using the standard rdfs:domain and rdfs:range.
                // The Schema.org terms 'schema:domainIncludes' and 'schema:rangeIncludes' are replaced
                // by the standard terms, because this makes it easier to search in multiple RDF vocabs.
                if (triple.predicate == self.schemaDomain) {
                    self.store.addTriple(triple.subject, self.rdfsDomain, triple.object);
                    domainPred++;
                }
                else if (triple.predicate == self.schemaRange) {
                    self.store.addTriple(triple.subject, self.rdfsRange, triple.object);
                    rangePred++;
                }
                else {
                    self.store.addTriple(triple.subject, triple.predicate, triple.object);
                }

            } else {
                console.log('finished parsing Schema.org file');
                console.log('\treplaced ' + domainPred + ' domain predicates');
                console.log('\treplaced ' + rangePred + ' range predicates');
            }
            if (error) {
                console.log('error while parsing Schema.org turtle file');
            }

        });
    }
});



module.exports = SchemaOrgSource;


