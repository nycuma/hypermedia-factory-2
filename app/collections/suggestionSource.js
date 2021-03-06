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

    /**
     * saves an RDF class for each vocab that will be ignored when displaying the type hierarchy in the suggestions
     * (all superclasses will be ignored too)
     * example: setting ignoreTypeHierarchyFrom.schema = 'http://schema.org/Thing'
     *          when user types 'School'
     *              suggestion shows: 'schema: Organization > EducationalOrganization > School'
     *              instead of: 'schema: Thing > Organization > EducationalOrganization > School'
     */
    ignoreTypeHierarchyFrom: {},

    rdfsComment:'http://www.w3.org/2000/01/rdf-schema#comment',
    rdfsDomain: 'http://www.w3.org/2000/01/rdf-schema#domain',
    rdfsSubClass: 'http://www.w3.org/2000/01/rdf-schema#subClassOf',

    initialize: function () {
        var self = this;
        self.prefixes.hydra = 'http://www.w3.org/ns/hydra/core#';

        var schemaOrgSource = new SchemaOrgSource();
        $.when(schemaOrgSource.fetch({parse: true})).then(function() {
            self.rdfStore.addTriples(schemaOrgSource.store.getTriples());
            self.prefixes.schema = 'http://schema.org/';
            self.ignoreTypeHierarchyFrom.schema = 'http://schema.org/Thing'
        });

        // non-RDF vocabulary is saved in local model
        var ianaLinkRelsSource = new IanaLinkRelsSource();
        $.when(ianaLinkRelsSource.fetch({parse: true})).then(function() {
            self.add(ianaLinkRelsSource.models);
            self.prefixes.iana = 'http://www.iana.org/assignments/relation/';
            ianaLinkRelsSource.reset();
        });
    },

    /**
     * Checks whether the given RDF class classIri or any of its super-classes
     * is in the domain of the RDF property propIri
     * @param classIri
     * @param propIri
     */
    checkIfClassInDomainOfProp: function (classIri, propIri) {
        var typesAsIri = this.getRDFSuperClasses(classIri);
        return typesAsIri.some(_.bind(function (typeIri) {
            var tripleCount = this.rdfStore.countTriplesByIRI(propIri, this.rdfsDomain, typeIri);
            return (tripleCount > 0);
        }, this));
    },

    /**
     * returns an array with the class itself and all super classes of an RDF class
     * example: calling the method with 'http://schema.org/School'
     *          returns ['http://schema.org/School', 'http://schema.org/EducationalOrganization', 'http://schema.org/Organization', 'http://schema.org/Thing']
     */
    getRDFSuperClasses: function(classIri) {
        var localClass = classIri;
        var superClasses = [localClass];

        while(localClass) {
            var superType = this.rdfStore.getObjectsByIRI(localClass, this.rdfsSubClass);
            if(superType && superType[0] != null) { superClasses.push(superType[0]); }
            localClass = superType[0];
        }
        return superClasses;
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

    getValueFromIanaIri: function (ianaIri) {
        return ianaIri.replace('http://www.iana.org/assignments/relation/', '');
    },

    getDescriptionFromVocab: function(iri, prefix, value) {
        var descr = '';
        if(prefix === 'iana' && iri) {
            var ianaVal = this.getValueFromIanaIri(iri);
            descr = this.getDescriptionForNonRDFTerm(prefix, ianaVal);
        } else {
            if(iri) {
                var rdfComment = this.rdfStore.getObjectsByIRI(iri, this.rdfsComment);
                if(rdfComment && rdfComment[0]) descr = rdfComment[0].substr(1, rdfComment[0].length-2);
            }
        }
        return Utils.getStringFromHTML(descr);
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
            if (term.get('prefix') === prefix) {
                filteredColl.push(term.toJSON());
            }
            return filteredColl;
        }, []);
    }

});

module.exports = new SuggestionSource();