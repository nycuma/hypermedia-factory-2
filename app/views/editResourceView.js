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


        if(this.model.get('label') !== 'new resource') {
            this.fillInputFields();
        }

        this.$el.show();
        return this;
    },

    fillInputFields: function () {
        console.log('fillInputFields: resourceName: ' + this.model.prop('resourceName').value + ', ' + this.model.prop('resourceName').prefix);

        $('#resourceName').val(this.model.get('resourceName').value);
        $('#resourceNamePrefix').val(this.model.get('resourceName').prefix);

        var resourceAttrs = this.model.prop('resourceAttrs');
        if(!resourceAttrs) { return; }

        resourceAttrs.forEach(_.bind(function(el, i) {
            if (i !== 0) { this.addAttrField(); }

            console.log('fillInputFields: resourceAttr: ' + this.model.prop('resourceAttrs/' + i).value + ', ' + this.model.prop('resourceAttrs/' + i).prefix);

            $('#resourceAttr' + i).val(this.model.prop('resourceAttrs/' + i).value);
            $('#resourceAttr' + i + 'Prefix').val(this.model.prop('resourceAttrs/' + i).prefix);
        }, this));

    },

    addAttrField: function(evt) {

        var resourceNameValue, resourceNamePrefix;

        if(evt) { // case if PLUS button is clicked by user
            evt.preventDefault();

            resourceNameValue = $(evt.target).attr('term-value');
            resourceNamePrefix = $(evt.target).attr('term-prefix');

            console.log('addAttrField term-value: ' + resourceNameValue);
            console.log('addAttrField term-prefix: ' + resourceNamePrefix);

        } else { // case if editResourceView is initialised for the > 1 time and attributes might be retrieved from node model
            var termVal = this.model.get('resourceName').value;
            var termPrefix = this.model.get('resourceName').prefix;
            if(termVal && termPrefix) {
                $('.addFieldBtn').attr({'term-value': termVal, 'term-prefix': termPrefix});
            }

        }

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


        // refresh PLUS button that adds new attr fields
        $('.addFieldBtn').attr({'term-value': data.value, 'term-prefix': data.prefix});
    },

    submit: function (evt) {
        evt.preventDefault();

        var nameVal = $('#resourceName').val().trim();
        var namePrefix = $('#resourceNamePrefix').val().trim();
        if(nameVal && namePrefix) {
            this.model.set('label', nameVal);
            this.model.saveName(nameVal, namePrefix);
        }

        this.model.prop('resourceAttr', []);
        var model = this.model;

        $('#resourceAttrInputWrapper .autocompleteInputField').each(function() {

            var attrVal = $(this).children('.ui-autocomplete-input').val().trim();
            var attrPrefix = $(this).children('.prefixInput').val().trim();

            console.log('found input fields: ' + attrVal + ', ' + attrPrefix);
            if(attrVal && attrPrefix) { model.saveAttribute(attrVal, attrPrefix); }
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