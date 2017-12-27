/**
 * Created by Julian Richter on 17 Dec 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var suggestionSource;
suggestionSource = require('../collections/suggestionSource');
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
        this.createInputField(suggestionSource);


        /*
        if(this.id === 'resourceName') {
            // TODO solution https://stackoverflow.com/questions/7728746/how-do-i-convert-a-filtered-collection-to-json-with-backbone-js
            console.log('called resourceName: ' + JSON.stringify(suggestionSource.getRDFClasses()));
            console.log('typeof: ' + typeof suggestionSource.getRDFClasses());
            this.createInputField(suggestionSource.getRDFClasses());
        } else if (this.id.startsWith('resourceAttr')) {
            console.log('called resourceAttr: ' + this.id);
            //this.createInputField(suggestionSource.getRDFProps());
        }
        */


        return this;
    },

    setInputFieldID: function () {
        this.$('.autocompleteInputField').last().attr('id', this.id+'InputField');
    },

    // TODO: wenn nicht alle Terms geladen werden sollen: source ist eine function, die das rdf store parsed
    // TODO CSS font of suggestions
    createInputField: function (source) {
        new autocomplete({
            minLength: 3,
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(source.toJSON(), request.term);
                response(results.slice(0, 40)); // limit suggestions to 40 terms
            },
            focus: function( event, ui ) {
                $('#termDesc').html(ui.item.descr).css({top: event.pageY, left: event.pageX}).show();
                $(document).click(function () {
                    $('#termDesc').hide().empty();
                });

            }
        }).element.attr({ type: 'text', id: this.id})
            .appendTo('#'+this.id+'InputField');

    }
});

module.exports = SuggestionItemView;
