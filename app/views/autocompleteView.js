/**
 * Created by Julian Richter on 17 Dec 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var sugSource;
sugSource = require('../collections/suggestionSource');
var methodsSugs;
methodsSugs = require('../collections/methodSuggestions');
var autocomplete = require('jquery-ui/ui/widgets/autocomplete');
var Utils = require('../util/utils');

var AutocompleteView = Backbone.View.extend({
    template: _.template($('#autocomplete-input-template').html()),

    methodMap: {
        'RETRIEVE': 'retrieve (safe)',
        'CREATE': 'create (not idemportent)',
        'REPLACE': 'replace (idempotent)',
        'DELETE': 'delete (idempotent)'
    },

    iriConstants : {
        rdfsDomain: 'http://www.w3.org/2000/01/rdf-schema#domain',
        rdfsRange: 'http://www.w3.org/2000/01/rdf-schema#range',
        rdfsClass: 'http://www.w3.org/2000/01/rdf-schema#Class',
        rdfProperty: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property',
        schemaAction: 'http://schema.org/Action'
    },


    initialize: function(options){
        //_.bindAll(this, 'render');

        this.options = options;
        this.render();
    },

    render: function () {
        this.$el.append(this.template({label: this.options.label, idAC: this.id}));

        if(this.id === 'resourceName' || this.id.match(/action/)) {
            this.createInputField();

        } else if (this.id.match(/resourceAttr/) || this.id.match(/relation/)) {

            console.log('new AutocompleteView for '+this.id+' with suggestions for...' +
                '\n\t iri: ' + this.options.resourceNameIri);

            this.createInputField(this.options.resourceNameIri);
        }
    },

    getSourceResName: function(userInput, propIri) {

        var results = [];
        var regExUserInput = new RegExp(userInput, 'i'); // characters entered by user
        var self = this;

        if(propIri) { // get only RDF classes in the range of this property
           sugSource.rdfStore.forObjectsByIRI(function(object) {
                var val = sugSource.getTermFromIRI(object);

                if(val.match(regExUserInput)) {
                    results.push({
                        value: val,
                        label: sugSource.getPrefixFromIRI(object)+': '+ self.getRDFTypeHierarchyAsString(object, 'http://schema.org/Thing')
                    });
                }

            }, propIri, self.iriConstants.rdfsRange);


        } else { //get all RDF classes matching entered characters

            sugSource.rdfStore.forSubjectsByIRI(function (subject) {

                var val = sugSource.getTermFromIRI(subject);
                if(val.match(regExUserInput)) {
                    results.push({
                        value: val,
                        label: sugSource.getPrefixFromIRI(subject)+': '+self.getRDFTypeHierarchyAsString(subject, 'http://schema.org/Thing')
                    });
                }
            }, null, self.iriConstants.rdfsClass);
        }

        return results;
    },

    getSourceResAttribute: function(userInput, resourceNameIri) {

        var results = this.getSourceRdfProperties(userInput, resourceNameIri);

        return results;
    },

    getSourceLinkRelation: function(userInput, resourceNameIri) {

        var results = this.getSourceRdfProperties(userInput, resourceNameIri);

        // add IANA link relations to suggestion list
        var ianaRels = $.ui.autocomplete.filter(sugSource.getAllTermsFromVocab('iana'), userInput);
        results = results.concat(ianaRels);

        return results;

    },

    // currently searches only for Actions from Schema.org vocab
    getSourceActions: function(userInput) {

        var results = [];
        var regExUserInput = new RegExp(userInput, 'i');
        var self = this;

        //get all RDF classes describing actions
        sugSource.rdfStore.forSubjectsByIRI(function (subject) {

            var val = sugSource.getTermFromIRI(subject);
            if(val.match(regExUserInput) && val.match(/Action/)) {
                results.push({
                    value: val,
                    label: sugSource.getPrefixFromIRI(subject)+': '+self.getRDFTypeHierarchyAsString(subject, self.iriConstants.schemaAction)
                });
            }
        }, null, self.iriConstants.rdfsClass);

        return results;
    },

    getSourceRdfProperties: function(userInput, resourceNameIri) {

        var results = [];
        var regExUserInput = new RegExp(userInput, 'i');
        var self = this;

        if (resourceNameIri) { // get RDF properties only for entered resource name and its super types

            var typesAsIri = this.getRDFSuperClasses(resourceNameIri);
            var self = this;

            typesAsIri.forEach(function (typeIri) {

                sugSource.rdfStore.forSubjectsByIRI(function (subject) {
                    var val = sugSource.getTermFromIRI(subject);
                    if (val.match(regExUserInput)) {
                        results.push({
                            value: val,
                            label: sugSource.getLabelFromIRI(subject)
                        });
                    }
                }, self.iriConstants.rdfsDomain, typeIri);
            });

        } else { // get all RDF properties that match entered characters

            sugSource.rdfStore.forSubjectsByIRI(function (subject) {
                var val = sugSource.getTermFromIRI(subject);

                if(val.match(regExUserInput)) {
                    results.push({
                        value: val,
                        label: sugSource.getLabelFromIRI(subject)
                    });
                }
            }, null, self.iriConstants.rdfProperty);
        }

        return results;
    },

    createInputField: function (iri) {
        var self = this;
        new autocomplete({
            minLength: 1,
            source: function(request, response) { // values to be suggested to user

                var results = [];
                // TODO get results only for one specific vocab
                // TODO bug: error thrown when user types '['

                if(self.id === 'resourceName') results = self.getSourceResName(request.term, iri);
                else if (self.id.match(/resourceAttr/)) results = self.getSourceResAttribute(request.term, iri);
                else if(self.id.match(/relation/)) results = self.getSourceLinkRelation(request.term, iri);
                else if(self.id.match(/action/)) results = self.getSourceActions(request.term);

                response(results.slice(0,50)); // return max. 50 results
            },

            focus: function(event, ui) {
                self.displayTermDescription(event, ui);
            },

            select: function(event, ui) {
                var prefix = sugSource.getPrefixFromLabel(ui.item.label);
                var prefixIri = sugSource.getPrefixIRIFromLabel(ui.item.label);

                // update method suggestions depending on selected relation and action
                if(self.id.match(/relation/)) self.updateVisibilityActionAndMethods(event, ui.item.value, prefix);
                if(self.id.match(/action/)) self.updateMethodSuggestions(null, event, ui.item.value, prefix);

                // refresh input fields for resources attributes (suggest only properties for selected resource name)
                if(self.id === 'resourceName') self.trigger('resourceNameSelected', { iri: prefixIri + ui.item.value});

                // display complete IRI below autocomplete field
                self.fillInputFieldIri(ui.item.label, ui.item.value);

                // display complete description next to autocomplete field
                self.fillInputFieldTermDescr(ui);

                // save prefix as attribute of input field
                self.updateCurrentPrefix(prefix);

                // deactivate change listener for value input field
                self.unregisterTermValueChangeEvent();
            },

            close: function() {
                $('#termDesc').hide().empty();
            }

        }).element.attr({ type: 'text', id: this.id})
            .appendTo('#'+this.id+'InputField');

        if(!this.id.match(/action/)) this.registerInputChangeEvents();

    },

    displayTermDescription: function(event, ui) {
        var position = {top: event.pageY + 15, left: event.pageX + 25};
        var termDescr = this.getTermDescription(ui);
        $('#termDesc').html(termDescr).css(position).show();
    },

    getTermDescription: function(ui) {
        var descr = '';
        if(ui.item.descr) {
            descr = ui.item.descr;
        } else {
            var prefixIRI = sugSource.getPrefixIRIFromLabel(ui.item.label);
            var rdfComment = sugSource.rdfStore.getObjectsByIRI(prefixIRI+ui.item.value, 'http://www.w3.org/2000/01/rdf-schema#comment');

            if(rdfComment && rdfComment[0]) {
                descr = rdfComment[0].substr(1, rdfComment[0].length-2);
            }
        }
        return descr;
    },

    // goes up the class hierarchy until 'ignore'
    getRDFTypeHierarchyAsString: function(typeIri, ignore) {
        var localType = typeIri;
        var typeHierString = sugSource.getTermFromIRI(typeIri);

        while(localType && localType != ignore) {
            var superType = sugSource.rdfStore.getObjectsByIRI(localType, 'http://www.w3.org/2000/01/rdf-schema#subClassOf');

            if(superType && superType[0] != null && superType[0] != ignore) {
                typeHierString = sugSource.getTermFromIRI(superType[0]) + ' > ' + typeHierString;
            }
            localType = superType[0];
        }

        return typeHierString;

    },

    // returns an array with the class itself and all super classes of an RDF class
    // example: calling the mothod with 'http://schema.org/School'
    //          returns ['http://schema.org/School', 'http://schema.org/EducationalOrganization', 'http://schema.org/Organization', 'http://schema.org/Thing']
    getRDFSuperClasses: function(typeIri) {
        var localType = typeIri;
        var superClasses = [localType];

        while(localType) {
            var superType = sugSource.rdfStore.getObjectsByIRI(localType, 'http://www.w3.org/2000/01/rdf-schema#subClassOf');
            if(superType && superType[0] != null) { superClasses.push(superType[0]); }
            localType = superType[0];
        }

        return superClasses;
    },

    // called when selection a new link relation
    // if selected relation is an IANA link relation, the input fields for Action are hidden
    // and the method options are updated according to the selected relation
    updateVisibilityActionAndMethods: function (evt, value, prefix) {
        var $parent = $(evt.target).closest('table');
        var $action = $parent.find('.actionInputWrapper');
        var $method = $parent.find('select[name=methodDropdown]');

        if(prefix === 'iana') {
            $action.hide('slow');
            // update method suggestions
            this.updateMethodSuggestions($method, null, value, prefix);
        } else {
            // show Action Input Field
            $action.show('slow');
        }
    },

    // updates the available methods to choose from, according to the info from the model data
    // (see modelData/methodSuggestions.json)
    updateMethodSuggestions: function(methodDropdownElement, evt, value, prefix) {

        var methods = methodsSugs.getMethodSuggestion(value, prefix);
        var $dropdown = methodDropdownElement ? methodDropdownElement :
                $(evt.target).closest('table').find('select[name=methodDropdown]');

        if($dropdown && methods) {
            $dropdown.empty();
            methods.available.forEach(_.bind(function (method) {
                $dropdown.append($('<option></option>').attr('value', method).text(this.methodMap[method]));
            }, this));
            $dropdown.val(methods.default);
        }
    },

    fillInputFieldIri: function(label, value) {
        var prefixIRI = sugSource.getPrefixIRIFromLabel(label);
        if(prefixIRI) {
            $('#'+this.id+'Iri').val(prefixIRI + value);
        } else {
            $('#'+this.id+'Iri').val('');
        }
    },

    fillInputFieldTermDescr: function(ui) {
        var descrHTML = this.getTermDescription(ui);
        $('#'+this.id+'TermDescr').val(Utils.getStringFromHTML(descrHTML));
    },

    setCustomIRI: function(targetId) {
        $('#'+targetId+'Iri').val('{myURL}/vocab#' + $('#'+targetId).val());
    },

    resetCustomIRI: function() {
        $('#'+this.id+'Iri').val('');
    },

    updateCurrentPrefix: function(prefix) {
        $('#'+this.id).attr({'term-prefix': prefix, 'isCustom': false});
    },

    setAsCustom: function (targetId) {
        $('#'+targetId).attr({'term-prefix': '', 'isCustom': true});
    },

    registerInputChangeEvents: function () {
        this.registerTermValueChangeEvent();
        this.registerTermDescrChangeEvent();
    },

    registerTermValueChangeEvent: function () {
        $('#'+this.id).on('input', _.bind(this.handleChangeEventsForValueField, this));
    },

    unregisterTermValueChangeEvent: function () {
        $('#'+this.id).off('input');
    },

    registerTermDescrChangeEvent: function () {
        $('#'+this.id+'TermDescr').on('input', _.bind(this.handleChangeEventsForDescrField, this));
    },


    handleChangeEventsForValueField: function (evt) {
        var targetId = evt.target.id;

        this.setCustomIRI(targetId);
        this.setAsCustom(targetId);
    },

    handleChangeEventsForDescrField: function (evt) {
        var targetId = evt.target.id;
        targetId = targetId.substr(0, targetId.indexOf('TermDescr'));

        this.setCustomIRI(targetId);
        this.setAsCustom(targetId);
        this.registerTermValueChangeEvent();
    }
});

module.exports = AutocompleteView;
