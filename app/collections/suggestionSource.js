/**
 * Created by Julian Richter on 18 Dec 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var N3 = require('n3');
var Term = require('../models/term');

// Import vocabularies to load
var SchemaOrgSource = require('./vocabSources/schemaOrgSource');
var IanaLinkRelsSource = require('./vocabSources/ianaLinkRelsSource');

var SuggestionSource = Backbone.Collection.extend({

    model: Term,

    // RDF store contains terms from all RDF vocabularies
    rdfStore: N3.Store(),

    initialize: function () {
        var self = this;

        var schemaOrgSource = new SchemaOrgSource();
        $.when(schemaOrgSource.fetch({parse: true})).then(function() {
            self.rdfStore.addTriples(schemaOrgSource.store.getTriples());
            self.rdfStore.addPrefix('schema', 'http://schema.org/');
        });

        // non-RDF vocabulary is saved in local model
        var ianaLinkRelsSource = new IanaLinkRelsSource();
        $.when(ianaLinkRelsSource.fetch({parse: true})).then(function() {
            self.add(ianaLinkRelsSource.models);
            ianaLinkRelsSource.reset();
        });

    },



    getRDFClasses: function() {
        /*
        var result = this.filter(function (term) {
            return term.get('isRdfClass');
        });
        var result = this.where({isRdfClass: true, isAction: false});
        return result;
        */


        return this.reduce(function (filteredColl, term) {
            if (term.get('isRdfClass') && !term.get('isAction')) {
                filteredColl.push(term.toJSON());
            }
            return filteredColl;
        }, []);

    },

    getRDFProps: function() {
        return this.reduce(function (filteredColl, term) {
            if (term.get('isRdfProperty')) {
                filteredColl.push(term.toJSON());
            }
            return filteredColl;
        }, []);
    },

    getActions: function () {
        return this.reduce(function (filteredColl, term) {
            if (term.get('isAction')) {
                filteredColl.push(term.toJSON());
            }
            return filteredColl;
        }, []);
    },

    getAllTermsFromVocab: function (prefix) {
        return this.reduce(function (filteredColl, term) {
            if (term.get('prefix' === prefix)) {
                filteredColl.push(term.toJSON());
            }
            return filteredColl;
        }, []);
    }
});

module.exports = new SuggestionSource();