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

var SuggestionItemView = Backbone.View.extend({
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

        this.setInputFieldID();

        if(this.id === 'resourceName') {
            console.log('new suggestionInputView name');
            this.createInputFieldResName();

        } else if (this.id.match(/resourceAttr/)) {

            if(this.options.resourceNameValue && this.options.resourceNamePrefix) {

                console.log('new suggestionInputView attr, value and prefix: '
                    + this.options.resourceNameValue + ', ' + this.options.resourceNamePrefix);

                this.createInputFielResAttr(this.options.resourceNameValue, this.options.resourceNamePrefix);

            } else {
                console.log('new suggestionInputView attr: without value and prefix');
                this.createInputFielResAttr();
            }
        }

        return this;
    },

    setInputFieldID: function () {
        this.$('.autocompleteInputField').last().attr('id', this.id+'InputField');
    },

    createInputFieldResName: function (propValue, propPrefix) {
        var self = this;
        new autocomplete({
            minLength: 2,
            source: function(request, response) {

                var results = [];
                var regEx = new RegExp(request.term, 'i');



                if(propValue && propPrefix) {
                    // get RDF classes in the range of this property

                    var prefixIRI = sugSource.getPrefixIRIFromPrefix(propPrefix);

                    sugSource.rdfStore.forObjectsByIRI(function(object) {

                        var val = sugSource.getTermFromIRI(object);

                        if(val.match(regEx)) {
                            results.push({
                                value: val,
                                label: propPrefix+': '+self.getRDFTypeHierarchyAsString(object, 'http://schema.org/Thing')
                            });
                        }

                    }, prefixIRI+propValue,'http://schema.org/rangeIncludes'); //TODO RDF IRI for rangeIncludes?
                    response(results);

                } else {
                    //get all RDF classes matching entered characters
                    sugSource.rdfStore.forSubjectsByIRI(function (subject) {

                        var val = sugSource.getTermFromIRI(subject);
                        if(val.match(regEx)) {
                            results.push({
                                value: val,
                                label: sugSource.getPrefixFromIRI(subject)+': '+self.getRDFTypeHierarchyAsString(subject, 'http://schema.org/Thing') // TODO get class hierachy
                            });
                        }
                    }, null, 'http://www.w3.org/2000/01/rdf-schema#Class');

                    response(results.slice(0, 15)); // max. 15 results


                }
            },

            focus: function(event, ui) {
                self.displayTermDescription(event, ui);
            },

            select: function (event, ui) {
                var prefix = sugSource.getPrefixFromLabel(ui.item.label);
                // refresh input fields for resources attributes
                self.trigger('resourceNameSelected', {value: ui.item.value, prefix: prefix});
                // save prefix in hidden input field
                self.writePrefixToHiddenInputField(prefix);

            },

            close: function() {
                $('#termDesc').hide().empty();
            }

        }).element.attr({ type: 'text', id: this.id})
            .appendTo('#'+this.id+'InputField');

        this.createHiddenFieldForPrefix('#'+this.id+'InputField');
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
                var prefix = sugSource.getPrefixFromLabel(ui.item.label);
                // save prefix in hidden input field
                self.writePrefixToHiddenInputField(prefix);
            },

            close: function () {
                $('#termDesc').hide().empty();
            }

        }).element.attr({ type: 'text', id: this.id})
            .appendTo('#'+this.id+'InputField');

        this.createHiddenFieldForPrefix('#'+this.id+'InputField');

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
        $('#'+this.id+'Prefix').val(prefix);
    },

    // currently ignores schema.org/Thing
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

    displayInputCustomTermDescr: function() {
        $(event.target).parent().parent().next().toggle();
    }


});

module.exports = SuggestionItemView;
