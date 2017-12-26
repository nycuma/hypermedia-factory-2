/**
 * Created by Julian Richter on 18 Dec 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var Term = require('../models/term');

// Import vocabularies to load
var SchemaOrgSource = require('./vocabSources/schemaOrgSource');
var IanaLinkRelsSource = require('./vocabSources/ianaLinkRelsSource');

var SuggestionSource = Backbone.Collection.extend({

    model: Term,

    // TODO Superclass RDFSource which defines basic parse methods
    initialize: function () {
        var self = this;
        var schemaOrgSource = new SchemaOrgSource();
        $.when(schemaOrgSource.fetch({parse: true})).then(function() {
            self.add(schemaOrgSource.models);
            //schemaOrgSource.reset();
        });


        var ianaLinkRelsSource = new IanaLinkRelsSource();
        $.when(ianaLinkRelsSource.fetch({parse: true})).then(function() {
            self.add(ianaLinkRelsSource.models);
            //ianaLinkRelsSource.reset()
        });

    },



    getRDFClasses: function() {
        // term = instance of BB.Model
        /*
        var result = this.filter(function (term) {
            return term.get('isAction');
        });
        */

        return this.where({isAction: true});
    },

    getRDFProps: function() {
        return this.where({isRdfProperty: true});
    },

    getActions: function () {
        return this.where({isAction: true});
    },

    getAllTermsFromVocab: function (prefix) {
        return this.where({prefix: prefix});
    }
});

module.exports = new SuggestionSource();