/**
 * Created by Julian Richter on 18 Dec 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var Term = require('../models/term');
var N3 = require('n3');
var Utils = require('../util/utils');

// Import vocabularies to load
var SchemaOrgSource = require('./vocabSources/schemaOrgSource');
var IanaLinkRelsSource = require('./vocabSources/ianaLinkRelsSource');

var SuggestionSource = Backbone.Collection.extend({

    model: Term,

    // RDF store contains terms from all RDF vocabularies
    rdfStore: N3.Store(),
    prefixes: {},

    initialize: function () {
        var self = this;

        var schemaOrgSource = new SchemaOrgSource();
        $.when(schemaOrgSource.fetch({parse: true})).then(function() {
            self.rdfStore.addTriples(schemaOrgSource.store.getTriples());
            self.prefixes.schema = 'http://schema.org/';
        });

        // non-RDF vocabulary is saved in local model
        var ianaLinkRelsSource = new IanaLinkRelsSource();
        $.when(ianaLinkRelsSource.fetch({parse: true})).then(function() {
            self.add(ianaLinkRelsSource.models);
            self.prefixes.iana = 'http://www.iana.org/assignments/relation/';
            ianaLinkRelsSource.reset();
        });

    },

    getPrefixIRIFromPrefix: function(prefix) {
        return this.prefixes[prefix];
    },

    // label = <prefix>: <term>
    getPrefixIRIFromLabel: function(label) {
        var prefix = label.substr(0, label.indexOf(':'));
        return this.prefixes[prefix];
    },

    getPrefixFromLabel: function(label) {
        return label.substr(0, label.indexOf(':'));
    },

    getPrefixFromPrefixIRI: function(prefixIRI) {
        for (var key in this.prefixes) {
            if (this.prefixes.hasOwnProperty(key)) {

                if(prefixIRI === this.prefixes[key]) {  //.match(new RegExp(iri)))
                    return key;
                }
            }
        }
    },

    getPrefixFromIRI: function(iri) {
        for (var key in this.prefixes) {
            if (this.prefixes.hasOwnProperty(key)) {

                if(iri.indexOf(this.prefixes[key]) === 0) { //check with which prefixIRI the IRI starts with
                    //console.log('getPrefixFromIRI ' + iri + ': ' + key);
                    return key;
                }
            }
        }

    },

    getTermFromIRI: function(iri) {

        var prefix = this.getPrefixFromIRI(iri);
        if (this.prefixes.hasOwnProperty(prefix)) {
            return iri.substr(this.prefixes[prefix].length);
        }
    },

    getLabelFromIRI: function(iri) {
        return this.getPrefixFromIRI(iri) + ': ' + this.getTermFromIRI(iri);
    },

    getDescriptionForNonRDFTerm: function(prefix, value) {
        var result = this.findWhere({prefix: prefix, value: value});
        if(result) return result.get('descr');
    },

    getDescriptionFromVocab: function(iri, prefix, value) {
        var descr = '';
        if(prefix === 'iana' && value) {
            descr = this.getDescriptionForNonRDFTerm(prefix, value);
        } else {
            if(iri) {
                var rdfComment = this.rdfStore.getObjectsByIRI(iri, 'http://www.w3.org/2000/01/rdf-schema#comment');
                if(rdfComment && rdfComment[0]) descr = rdfComment[0].substr(1, rdfComment[0].length-2);
            }
        }
        return Utils.getStringFromHTML(descr);
    },


    /*
    getRDFClasses: function() {

        //var result = this.filter(function (term) {
        //    return term.get('isRdfClass');
        //});
        //var result = this.where({isRdfClass: true, isAction: false});
        //return result;



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
*/

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
            if (term.get('prefix') === prefix) {
                filteredColl.push(term.toJSON());
            }
            return filteredColl;
        }, []);
    }

});

module.exports = new SuggestionSource();