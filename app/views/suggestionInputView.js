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
            //this.createInputField(JSON.parse(JSON.stringify(sugSource.getRDFClasses())));
            //this.createInputField(sugSource.getRDFClasses());
            this.createInputField();
        } else if (this.id.startsWith('resourceAttr')) {

            if(this.options.resourceNameValue && this.options.resourceNamePrefix) {

                console.log('SIV attr: shipped with resource name val & prefix: '
                    + this.options.resourceNameValue + ', ' + this.options.resourceNamePrefix);

                this.createAttrInputFieldWithPropsForResourceName(this.options.resourceNameValue, this.options.resourceNamePrefix);

            } else {
                console.log('SIV attr: shipped w/o');
                this.createInputField(sugSource.getRDFProps());

            }


        }

        return this;
    },

    setInputFieldID: function () {
        this.$('.autocompleteInputField').last().attr('id', this.id+'InputField');
    },

    // TODO: wenn nicht alle Terms geladen werden sollen: source ist eine function, die das rdf store parsed
    // TODO smaller font-seize for prefix, font for suggestions
    createInputField: function (source) {
        var self = this;
        new autocomplete({
            minLength: 2,
            source: function(request, response) {

                var results = [];

                if(source) {
                    results = $.ui.autocomplete.filter(source, request.term);
                    response(results.slice(0, 15)); // limit suggestions to 15 terms

                } else {
                    //get all RDF classes
                    var regEx = new RegExp(request.term, "i");
                    sugSource.rdfStore.forSubjectsByIRI(function (subject) {
                        var label = 'schema: ' + subject.substr(18);
                        if(label.match(regEx)) {
                            results.push({
                                value: subject.substr(18),
                                label: label
                            });
                        }
                    }, null, 'http://www.w3.org/2000/01/rdf-schema#Class');

                    //results = $.ui.autocomplete.filter(source, request.term);
                    response(results.slice(0, 15));


                }
            },

            focus: function(event, ui) {
                self.displayTermDescription(event, ui);
            },

            select: function (event, ui) {
                if(this.id === 'resourceName') {
                    self.trigger('resourceNameSelected', {value: ui.item.value, prefix: ui.item.prefix});
                }
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
    },

    createAttrInputFieldWithPropsForResourceName: function(value, prefix) {

        console.log('createAttrInputFieldWithPropsForResourceName: ' + value + ', ' + prefix);

        var self = this;
        new autocomplete({
            minLength: 2,

            source: function(request, response) {

                // need schemaorg store
                // getURLFromPrefix
                var url = 'http://schema.org/Person';
                var predicatesForSubject = sugSource.rdfStore.getSubjects('http://schema.org/domainIncludes', url);

                var results = $.ui.autocomplete.filter(predicatesForSubject, request.term);
                results = results.map(function(prop) {
                    return { value: prop.substr(18),
                        prefix: 'schema',
                        label: 'schema: ' + prop.substr(18) };
                });

                console.log('results: ' + JSON.stringify(results));

                response(results.slice(0, 15)); // limit suggestions to 15 terms
            },

            focus: function(event, ui) {
                self.displayTermDescription(event, ui);
            }

        }).element.attr({ type: 'text', id: this.id})
            .appendTo('#'+this.id+'InputField');

    },
    // TODO: do not save rdf comments while parsing
    // TODO: do not save RDF in BB models, only parse triples and save them in RDF store
    displayTermDescription: function(event, ui) {
        if(ui.item.descr) {
            $('#termDesc').html(ui.item.descr).css({top: event.pageY + 10, left: event.pageX + 25}).show();
        } else {
            var prefixUrl = 'http://schema.org/'; // TODO save prefixes and URLs somewhere centrally
            var rdfComment = sugSource.rdfStore.getObjectsByIRI(prefixUrl+ui.item.value, 'http://www.w3.org/2000/01/rdf-schema#comment')[0];

            $('#termDesc').html(rdfComment.substr(1, rdfComment.length-2)).css({top: event.pageY + 10, left: event.pageX + 25}).show();
        }

        $(document).click(function () {
            $('#termDesc').hide().empty();
        });
    }


});

module.exports = SuggestionItemView;
