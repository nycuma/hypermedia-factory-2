/**
 * Created by Julian Richter on 17 Dec 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var SuggestionSource = require('../collections/suggestionSource');
var autocomplete = require('jquery-ui/ui/widgets/autocomplete');

var SuggestionItemView = Backbone.View.extend({
    template: _.template($('#autocomplete-input-template').html()),

    initialize: function(options){
        //_.bindAll(this, 'render');



        this.options = options;
        this.render();
    },

    render: function () {
        console.log('suggestionItemView: render called');

        this.$el.append(this.template({label: this.options.label}));

        this.setInputFieldID();
        this.createInputField(this.getSuggestionSource());

        return this;
    },

    setInputFieldID: function () {
        this.$('.autocompleteInputField').last().attr('id', this.id+'InputField');
    },

    getSuggestionSource: function () {
        var suggestionSource = new SuggestionSource();
        suggestionSource.fetch({async: false, parse: true});
        console.log('suggestions I: ' + JSON.stringify(suggestionSource));
        return suggestionSource.pluck('name');
    },



    createInputField: function (suggestionSource) {
        // TODO set source later? (on keypress / keydown)
        // acInput.source = newSource;
        var acInput = new autocomplete({
            source: suggestionSource,
            focus: function( event, ui ) {
                //$('#termDesc').empty();
                console.log('focus called on ' + JSON.stringify(ui.item));
                console.log(event.pageX + ', ' + event.pageY);
                // get term
                // serch in term in suggestioNSource
                // display term description

                $('#termDesc').css({top: event.pageY, left: event.pageX}).show();
                $(document).click(function () {
                    $('#termDesc').hide().empty();
                });

            }
        }).element.attr({ type: 'text', id: this.id})
            .appendTo('#'+this.id+'InputField');

    }
});

module.exports = SuggestionItemView;
