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

        } else if(this.id.match(/relation/)) {

            console.log('new suggestionInputView relation: value and prefix: '
                + this.options.resourceNameValue + ', ' + this.options.resourceNamePrefix);

            this.createInputField(this.options.resourceNameValue, this.options.resourceNamePrefix);
        } else if(this.id.match(/action/)) {
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
                else if(self.id.match(/relation/)) results = self.getSourceLinkRelation(request.term, value, prefix);
                else if(self.id.match(/action/)) results = self.getSourceOperation(request.term);

                response(results);
            },

            focus: function(event, ui) {
                self.displayTermDescription(event, ui);
            },

            select: function(event, ui) {
                var prefix = sugSource.getPrefixFromLabel(ui.item.label);

                // update method suggestions depending on selected relation and action
                if(self.id.match(/action/) || self.id.match(/relation/)) self.updateMethodSuggestions(event.target.id, ui.item.value, prefix);

                // refresh input fields for resources attributes (suggest only properties for selected resource name)
                if(self.id === 'resourceName') self.trigger('resourceNameSelected', {value: ui.item.value, prefix: prefix});

                // display complete IRI below autocomplete field
                self.fillInputFieldIri(ui.item.label, ui.item.value);

                // display complete description next to autocomplete field
                self.fillInputFieldTermDescr(ui);

                // save prefix as atribute of input field
                self.updateCurrentPrefix(prefix);

            },

            close: function() {
                $('#termDesc').hide().empty();
            }

        }).element.attr({ type: 'text', id: this.id})
            .appendTo('#'+this.id+'InputField');

        if(!this.id.match(/action/)) {
            this.registerInputChangeEvent();
        }
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

            if(rdfComment) { //TODO what if no RDF comment available?
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

    updateMethodSuggestions: function(targetId, value, prefix) {
        // get options suggestions
        //.val('DELETE');
        var $dropdown = $('#methodDropdown' + targetId.substring(targetId.length-1));

        $dropdown.empty();

        var methods = methodsSugs.getMethodSuggestion(value, prefix);

        console.log('updateMethodSuggs: methods: ' + JSON.stringify(methods));

        /*
        $.when(methodsSugs.fetch({parse: true})).then(function() {
            JSON.stringify('updateMethodSuggestions')
        });
        */

        /*
         $.each(newOptions, function(key,value) {
         $el.append($("<option></option>")
         .attr("value", value).text(key));
         });
         */

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
        $('#'+this.id+'TermDescr').val(this.getStringFromHTML(descrHTML));
    },

    getStringFromHTML: function(html) {
        var text = $('<p>'+html+'</p>').text();
        text = text.replace(/\r?\n|\r|\t/g, ' '); // remove linebreaks and tabs
        return text;
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

    registerInputChangeEvent: function () {
        $('#'+this.id).bind('change',_.bind(function(evt) {
            this.setCustomIRI(evt.target.id);
            this.setAsCustom(evt.target.id);
        }, this));

        $('#'+this.id+'TermDescr').bind('change',_.bind(function(evt) {
            var targetId = evt.target.id;
            var firstPart = targetId.substr(0, targetId.indexOf('TermDescr'));
            this.setCustomIRI(firstPart);
            this.setAsCustom(firstPart);
        }, this));
    }
});

module.exports = AutocompleteView;
