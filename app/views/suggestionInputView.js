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

    render: function () {
        this.$el.append(this.template({label: this.options.label}));

        this.setInputFieldID();

        if(this.id === 'resourceName') {
            this.createInputFieldResName();

        } else if (this.id.match(/resourceAttr/)) {

            if(this.options.resourceNameValue && this.options.resourceNamePrefix) {

                console.log('SIV attr: shipped with resource name val & prefix: '
                    + this.options.resourceNameValue + ', ' + this.options.resourceNamePrefix);

                this.createAttrInputFielResAttr(this.options.resourceNameValue, this.options.resourceNamePrefix);

            } else {
                console.log('SIV attr: shipped w/o val & prefix');
                this.createAttrInputFielResAttr();

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
                    // TODO BUG !!! get all props from superclasses, too !!!

                    var prefixIRI = sugSource.getPrefixIRIFromPrefix(propPrefix);

                    sugSource.rdfStore.forObjectsByIRI(function(object) {

                        var val = sugSource.getTermFromIRI(object);
                        var label = propPrefix+': ' + val;

                        if(label.match(regEx)) {
                            results.push({
                                value: val,
                                label: label // TODO get class hierachy
                            });
                        }

                    }, prefixIRI+propValue,'http://schema.org/rangeIncludes'); //TODO RDF IRI for rangeIncludes?
                    response(results);

                } else {
                    //get all RDF classes matching entered characters
                    sugSource.rdfStore.forSubjectsByIRI(function (subject) {

                        var label = sugSource.getLabelFromIRI(subject);
                        if(label.match(regEx)) {
                            results.push({
                                value: sugSource.getTermFromIRI(subject),
                                label: label // TODO get class hierachy
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
            /*
            open: function(event,ui) {
                var acData = $(this).data('ui-autocomplete');
                acData
                    .menu
                    .element
                    .find('li')
                    .each(function () {
                        var keywords = acData.term.split(' ').join('|');
                        $(this).html($(this).text().replace(new RegExp('(' + keywords + ')', 'gi'), '<span class="termDescHighlight">$1</span>'));
                    });
            }
            */

        }).element.attr({ type: 'text', id: this.id})
            .appendTo('#'+this.id+'InputField');

        this.createHiddenFieldForPrefix('#'+this.id+'InputField');
    },

    createAttrInputFielResAttr: function(value, prefix) {

        console.log('createAttrInputFielResAttr: ' + value + ', ' + prefix);

        var self = this;
        new autocomplete({
            minLength: 2,

            source: function(request, response) {

                var results = [];
                var regEx = new RegExp(request.term, 'i');


                if(value && prefix) { // get only RDF properties for entered resource name

                    var prefixIRI = sugSource.getPrefixIRIFromPrefix(prefix);


                    sugSource.rdfStore.forSubjectsByIRI(function (subject) {
                        var val = sugSource.getTermFromIRI(subject);
                        var label = prefix + ': ' + val;
                        if(label.match(regEx)) {
                            results.push({
                                value: val,
                                label: label // TODO get class hierachy
                            });
                        }
                    }, 'http://schema.org/domainIncludes', prefixIRI+value);

                    response(results);


                } else { // get all RDF properties that match entered characters

                    sugSource.rdfStore.forSubjectsByIRI(function (subject) {
                        var label = sugSource.getLabelFromIRI(subject);
                        if(label.match(regEx)) {
                            results.push({
                                value: sugSource.getTermFromIRI(subject),
                                label: label // TODO get class hierachy
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
    }


});

module.exports = SuggestionItemView;
