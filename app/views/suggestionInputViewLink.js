/**
 * Created by Julian Richter on 31 Dec 2017
 */

'use strict';
var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var sugSource;
sugSource = require('../collections/suggestionSource');
var autocomplete = require('jquery-ui/ui/widgets/autocomplete');

// TODO !!! merge SuggestionItemView and SuggestionItemViewLink and write a single createInputField() function
var SuggestionItemViewLink = Backbone.View.extend({
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

        if(this.id === 'relation') {
            this.createInputFieldRelation(this.options.resourceNameValue, this.options.resourceNamePrefix);
        } else if(this.id.match(/operation/)) {
            this.createInputFieldOperation();
        }

        return this;
    },

    createInputFieldRelation: function(value, prefix) {

        console.log('createInputFielRelation: ' + value + ', ' + prefix);

        var self = this;
        new autocomplete({
            minLength: 2,

            source: function(request, response) {

                var results = [];
                var regEx = new RegExp(request.term, 'i');


                if(value && prefix) { // get RDF properties only for entered resource name of source node and its super types
                                      // plus: suggest IANA link relations

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

                    // add IANA link relations to suggestion list
                    var ianaRels = $.ui.autocomplete.filter(sugSource.getAllTermsFromVocab('IANA'), request.term);

                    response(results.concat(ianaRels));


                } else { // get all RDF properties and IANA link relations that match entered characters

                    sugSource.rdfStore.forSubjectsByIRI(function (subject) {
                        var val = sugSource.getTermFromIRI(subject);

                        if(val.match(regEx)) {
                            results.push({
                                value: val,
                                label: sugSource.getLabelFromIRI(subject)
                            });
                        }
                    }, null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property');

                    var ianaRels = $.ui.autocomplete.filter(sugSource.getAllTermsFromVocab('IANA'), request.term);
                    results = results.concat(ianaRels);

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

    createInputFieldOperation: function() {

        var self = this;
        new autocomplete({
            minLength: 2,

            source: function(request, response) {

                var results = [];
                var regEx = new RegExp(request.term, 'i');

                //get all RDF classes describing actions
                sugSource.rdfStore.forSubjectsByIRI(function (subject) {

                    var val = sugSource.getTermFromIRI(subject);
                    if(val.match(regEx) && val.match(/Action/)) {
                        results.push({
                            value: val,
                            label: sugSource.getPrefixFromIRI(subject)+': '+self.getRDFTypeHierarchyAsString(subject, 'http://schema.org/Action')
                        });
                    }
                }, null, 'http://www.w3.org/2000/01/rdf-schema#Class');

                response(results.slice(0, 15)); // max. 15 results

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
        console.log('registered AutocompleteInputChangeEvent on: ' + this.id);
        var self = this;
        $('.ui-autocomplete-input').bind('change',function(evt) {
            self.setCustomIRI(evt.target.id);
        });
    }


});

module.exports = SuggestionItemViewLink;

