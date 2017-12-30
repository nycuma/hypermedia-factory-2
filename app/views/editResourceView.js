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

        var sivResName = new SuggestionItemView({el: '#resourceNameInputWrapper',
                                                id: 'resourceName',
                                                label: 'Name'});
        this.listenTo(sivResName, 'resourceNameSelected', this.refreshAttrField);

        new SuggestionItemView({el: '#resourceAttrInputWrapper',
                                id: 'resourceAttr0',
                                label: 'Attributes'});


        this.fillInputFields();
        this.$el.show();
        return this;
    },

    fillInputFields: function () {
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

        var resourceNameValue = $(evt.target).attr('term-value');
        var resourceNamePrefix = $(evt.target).attr('term-prefix');

        console.log('data-value: ' + resourceNameValue);
        console.log('data-prefix: ' + resourceNamePrefix);

        var attrID = this.getNextAttrID();

        new SuggestionItemView({el: '#resourceAttrInputWrapper',
                                id: 'resourceAttr' + attrID,
                                label: attrID == 0 ? 'Attributes':'',
                                resourceNameValue: resourceNameValue,
                                resourceNamePrefix: resourceNamePrefix });
    },

    getNextAttrID: function() {
        return this.$('#resourceAttrInputWrapper').children().length;
    },

    refreshAttrField: function(data) {
        console.log('refresh attr fields');
        // remove all existing input fields for resource attributes
        $('#resourceAttrInputWrapper').empty();

        // add input field that suggests only properties for entered resource name

        new SuggestionItemView({el: '#resourceAttrInputWrapper',
                                id: 'resourceAttr0',
                                label: 'Attributes',
                                resourceNameValue: data.value,
                                resourceNamePrefix: data.prefix});


        // refresh PLUS button
        // TODO change from CSS class to ID
        $('.addFieldBtn').attr({'term-value': data.value, 'term-prefix': data.prefix});
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