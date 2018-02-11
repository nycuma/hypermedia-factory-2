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
var autocomplete = require('jquery-ui/ui/widgets/autocomplete');

var AutocompleteView = Backbone.View.extend({
    template: _.template($('#autocomplete-input-template').html()),

    initialize: function(options){
        //_.bindAll(this, 'render');

        this.options = options;
        this.render();
    },

    events: {
        'click input[type=checkbox]' : 'displayInputCustomTermDescr'
    },

    render: function () {
        this.$el.append(this.template({label: this.options.label, idAC: this.id}));

        if(this.id === 'resourceName') {
            this.createInputField();

        } else if (this.id.match(/resourceAttr/)) {

            console.log('new suggestionInputView attr: value and prefix: '
                + this.options.resourceNameValue + ', ' + this.options.resourceNamePrefix);

            this.createInputField(this.options.resourceNameValue, this.options.resourceNamePrefix);

        } else if(this.id === 'relation') {

            console.log('new suggestionInputView relation: value and prefix: '
                + this.options.resourceNameValue + ', ' + this.options.resourceNamePrefix);

            this.createInputField(this.options.resourceNameValue, this.options.resourceNamePrefix);
        } else if(this.id.match(/operation/)) {
            this.createInputField();
        }


        return this;
    },

    getSourceResName: function(userInput, propValue, propPrefix) {

        var results = [];
        var regExUserInput = new RegExp(userInput, 'i'); // characters entered by user
        var self = this;

        if(propValue && propPrefix) { // get only RDF classes in the range of this property

            var prefixIRI = sugSource.getPrefixIRIFromPrefix(propPrefix);

            sugSource.rdfStore.forObjectsByIRI(function(object) {

                var val = sugSource.getTermFromIRI(object);

                if(val.match(regExUserInput)) {
                    results.push({
                        value: val,
                        label: propPrefix+': '+ self.getRDFTypeHierarchyAsString(object, 'http://schema.org/Thing')
                    });
                }

            }, prefixIRI+propValue,'http://schema.org/rangeIncludes'); //TODO RDF IRI for rangeIncludes?


        } else { //get all RDF classes matching entered characters

            sugSource.rdfStore.forSubjectsByIRI(function (subject) {

                var val = sugSource.getTermFromIRI(subject);
                if(val.match(regExUserInput)) {
                    results.push({
                        value: val,
                        label: sugSource.getPrefixFromIRI(subject)+': '+self.getRDFTypeHierarchyAsString(subject, 'http://schema.org/Thing')
                    });
                }
            }, null, 'http://www.w3.org/2000/01/rdf-schema#Class');
        }

        return results.slice(0, 15); // max. 15 results
    },

    getSourceResAttribute: function(userInput, resourceNameValue, resourceNamePrefix) {

        var results = this.getSourceRdfProperties(userInput, resourceNameValue, resourceNamePrefix);

        return results.slice(0, 15);// max. 15 results
    },

    getSourceLinkRelation: function(userInput, resourceNameValue, resourceNamePrefix) {

        var results = this.getSourceRdfProperties(userInput, resourceNameValue, resourceNamePrefix);

        // add IANA link relations to suggestion list
        var ianaRels = $.ui.autocomplete.filter(sugSource.getAllTermsFromVocab('IANA'), userInput);
        results = results.concat(ianaRels);

        return results.slice(0, 15);  // max. 15 results

    },

    getSourceOperation: function(userInput) {

        var results = [];
        var regExUserInput = new RegExp(userInput, 'i');
        var self = this;

        //get all RDF classes describing actions
        sugSource.rdfStore.forSubjectsByIRI(function (subject) {

            var val = sugSource.getTermFromIRI(subject);
            if(val.match(regExUserInput) && val.match(/Action/)) {
                results.push({
                    value: val,
                    label: sugSource.getPrefixFromIRI(subject)+': '+self.getRDFTypeHierarchyAsString(subject, 'http://schema.org/Action')
                });
            }
        }, null, 'http://www.w3.org/2000/01/rdf-schema#Class');

        return results.slice(0, 15); // max. 15 results
    },

    getSourceRdfProperties: function(userInput, resourceNameValue, resourceNamePrefix) {

        var results = [];
        var regExUserInput = new RegExp(userInput, 'i');

        if(resourceNameValue && resourceNamePrefix) { // get RDF properties only for entered resource name and its super types

            var prefixIRI = sugSource.getPrefixIRIFromPrefix(resourceNamePrefix);

            var typesAsIri = this.getRDFSuperClasses(prefixIRI+resourceNameValue);
            //console.log('TYPES AS IRI: ' + JSON.stringify(typesAsIri));

            typesAsIri.forEach(function (typeIri) {

                sugSource.rdfStore.forSubjectsByIRI(function (subject) {
                    var val = sugSource.getTermFromIRI(subject);
                    if(val.match(regExUserInput)) {
                        results.push({
                            value: val,
                            label: resourceNamePrefix + ': ' + val
                        });
                    }
                }, 'http://schema.org/domainIncludes', typeIri);

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
            }, null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property');
        }

        return results;
    },

    createInputField: function (value, prefix) {
        var self = this;
        new autocomplete({
            minLength: 2,
            source: function(request, response) { // values to be suggested to user

                var results = [];

                if(self.id === 'resourceName') results = self.getSourceResName(request.term, value, prefix);
                else if (self.id.match(/resourceAttr/)) results = self.getSourceResAttribute(request.term, value, prefix);
                else if(self.id === 'relation') results = self.getSourceLinkRelation(request.term, value, prefix);
                else if(self.id.match(/operation/)) results = self.getSourceOperation(request.term);

                response(results);
            },

            focus: function(event, ui) {
                self.displayTermDescription(event, ui);
            },

            select: function(event, ui) {
                var prefix = sugSource.getPrefixFromLabel(ui.item.label);

                // refresh input fields for resources attributes (suggest only properties for selected resource name)
                if(this.id === 'resourceName') self.trigger('resourceNameSelected', {value: ui.item.value, prefix: prefix});

                // uncheck 'custom term'-checkbox and hide customTermDescription
                self.removeInputCustomTermDescription(this);

                // display complete IRI next to autocomplete field
                self.fillInputFieldIri(ui.item.label, ui.item.value);

                // save prefix in hidden input field
                self.writePrefixToHiddenInputField(prefix);

            },

            close: function() {
                $('#termDesc').hide().empty();
            }

        }).element.attr({ type: 'text', id: this.id})
            .appendTo('#'+this.id+'InputField');

        this.createHiddenFieldForPrefix('#'+this.id+'InputField');
        this.registerAutocompleteInputChangeEvent();

    },

    createInputFielResAttr: function(value, prefix) {

        console.log('createInputFielResAttr: ' + value + ', ' + prefix);

        var self = this;
        new autocomplete({
            minLength: 2,

            source: function(request, response) {

                var results = [];
                var regEx = new RegExp(request.term, 'i');


                if(value && prefix) { // get RDF properties only for entered resource name and its super types

                    var prefixIRI = sugSource.getPrefixIRIFromPrefix(prefix);

                    var typesAsIri = self.getRDFSuperClasses(prefixIRI+value);
                    //console.log('TYPES AS IRI: ' + JSON.stringify(typesAsIri));

                    typesAsIri.forEach(function (typeIri) {

                        sugSource.rdfStore.forSubjectsByIRI(function (subject) {
                            var val = sugSource.getTermFromIRI(subject);
                            if(val.match(regEx)) {
                                results.push({
                                    value: val,
                                    label: prefix + ': ' + val
                                });
                            }
                        }, 'http://schema.org/domainIncludes', typeIri);

                    });

                    response(results);


                } else { // get all RDF properties that match entered characters

                    sugSource.rdfStore.forSubjectsByIRI(function (subject) {
                        var val = sugSource.getTermFromIRI(subject);

                        if(val.match(regEx)) {
                            results.push({
                                value: val,
                                label: sugSource.getLabelFromIRI(subject)
                            });
                        }
                    }, null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property');

                    response(results.slice(0, 15)); // max. 15 results
                }
            },

            focus: function(event, ui) {
                self.displayTermDescription(event, ui);
            },

            select: function(event, ui) {
                // uncheck checkbox and hide customTermDescription
                self.removeInputCustomTermDescription(this);

                // display complete IRI next to autocomplete field
                self.fillInputFieldIri(ui.item.label, ui.item.value);

                // save prefix in hidden input field
                var prefix = sugSource.getPrefixFromLabel(ui.item.label);
                self.writePrefixToHiddenInputField(prefix);
            },

            close: function () {
                $('#termDesc').hide().empty();
            }

        }).element.attr({ type: 'text', id: this.id})
            .appendTo('#'+this.id+'InputField');

        this.createHiddenFieldForPrefix('#'+this.id+'InputField');
        this.registerAutocompleteInputChangeEvent();

    },


    displayTermDescription: function(event, ui) {
        var position = {top: event.pageY + 15, left: event.pageX + 25};

        if(ui.item.descr) {
            $('#termDesc').html(ui.item.descr).css(position).show();
        } else {
            var prefixIRI = sugSource.getPrefixIRIFromLabel(ui.item.label);
            var rdfComment = sugSource.rdfStore.getObjectsByIRI(prefixIRI+ui.item.value, 'http://www.w3.org/2000/01/rdf-schema#comment');

            if(rdfComment) { //TODO what if no RDF comment available?
                $('#termDesc').html(rdfComment[0].substr(1, rdfComment[0].length-2)).css(position).show();
            }
        }
    },

    createHiddenFieldForPrefix: function(appendToEl) {
        $(appendToEl).append('<input type="hidden" id="'+this.id+'Prefix'+'" class="prefixInput" value="">');
    },

    writePrefixToHiddenInputField: function(prefix) {
        //console.log('writePrefixToHiddenInputField called on: ' +  this.id);
        //console.log('writePrefixToHiddenInputField prefix: ' +  prefix);
        $('#'+this.id+'Prefix').val(prefix);
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

    displayInputCustomTermDescr: function(evt) {
        if($(evt.target).prop('checked')) {
            $(evt.target).parent().parent().next().show();
            // update IRI
            this.setCustomIRI(this.id);
        } else {
            $(evt.target).parent().parent().next().hide();
            // reset IRI
            this.resetCustomIRI();
        }
        //$(evt.target).parent().parent().next().toggle(); --> bug
    },

    removeInputCustomTermDescription: function (inputElem) {
        $('#'+this.id+'CheckCustomTerm').prop('checked', false);
        $(inputElem).parent().parent().next().next().next().hide();
        $('#'+this.id+'CustomTermDescr').val('');
    },

    fillInputFieldIri: function(label, value) {
        var prefixIRI = sugSource.getPrefixIRIFromLabel(label);
        if(prefixIRI) {
            $('#'+this.id+'Iri').val(prefixIRI + value);
        } else {
            $('#'+this.id+'Iri').val('');
        }
    },

    setCustomIRI: function(targetId) {
        if($('#'+this.id+'CheckCustomTerm').prop('checked')) {
            $('#'+targetId+'Iri').val('{myURL}/vocab#' + $('#'+targetId).val());
        }
    },

    resetCustomIRI: function() {
        $('#'+this.id+'Iri').val('');
    },

    registerAutocompleteInputChangeEvent: function () {
        // register change events for autocomplete input fields
        //console.log('registered AutocompleteInputChangeEvent on: ' + this.id);
        var self = this;
        $('.ui-autocomplete-input').bind('change',function(evt) {
            self.setCustomIRI(evt.target.id);
        });
    }


});

module.exports = AutocompleteView;
