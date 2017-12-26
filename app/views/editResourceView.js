/**
 * Created by Julian Richter on 04 Oct 2017
 */


'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var autocomplete = require('jquery-ui/ui/widgets/autocomplete');
var SuggestionItemView = require('./suggestionInputView');



var EditResourceView = Backbone.View.extend({
    el: '#editResource',
    template:  _.template($('#edit-resource-template').html()),

    initialize: function(){
        this.render();
    },

    events: {
        'click .submitBtn': 'submit',
        'click .cancelBtn' : 'close',
        'click .addFieldBtn' : 'addAttrField'
        //'focus #resourceName':    'startAutocomplete',
        //'keydown #resourceName':  'invokefetch'
    },

    render: function () {

        this.$el.html(this.template());

        new SuggestionItemView({el: '#resourceNameInputWrapper',
                                id: 'resourceName',
                                label: 'Name'});
        new SuggestionItemView({el: '#resourceAttrInputWrapper',
                                id: 'resourceAttr0',
                                label: 'Attributes'});


        this.fillInputFields();
        this.$el.show();
        return this;
    },

    fillInputFields: function (idAttrField) {
        $('#resourceName').val(this.model.get('label'));

        var resourceAttrs = this.model.prop('resourceAttr');
        if(!resourceAttrs) return;

        resourceAttrs.forEach(_.bind(function(el, i) {
            if (i !== 0) this.addAttrField();
            $('#resourceAttr' + i).val(this.model.prop('resourceAttr/' + i));
        }, this));

    },

    addAttrField: function(evt) {
        if(evt) evt.preventDefault();

        var attrID = this.getNextAttrID();

        new SuggestionItemView({el: '#resourceAttrInputWrapper',
                                id: 'resourceAttr' + attrID,
                                label: ''});
    },

    getNextAttrID: function() {
        return this.$('#resourceAttrInputWrapper').children().length;
    },

    submit: function (evt) {
        evt.preventDefault();

        var newLabel = $('#resourceName').val().trim();
        if(newLabel) this.model.set('label', newLabel);

        this.model.prop('resourceAttr', []);
        var resourceModel = this.model;

        $('#resourceAttrInputWrapper .autocompleteInputField input').each(function() {
            console.log('found input field: ' + $(this).val());
            var newAttr = $(this).val();
            if(newAttr) resourceModel.addAttribute(newAttr);
        });

        this.close();
    },


    close: function (evt) {
        if(evt) evt.preventDefault();
        this.remove();
        $('body').append('<div id="editResource" class="editGraphElement"></div>');
    }
});

module.exports = EditResourceView;