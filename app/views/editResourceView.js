/**
 * Created by Julian Richter on 04 Oct 2017
 */


'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
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
        
        this.fillInputFieldResName();
        this.fillInputFieldsResAttrs();
        console.log('fillInputFields: resourceName: ' + this.model.prop('resourceName').value + ', ' + this.model.prop('resourceName').prefix);
    },

    fillInputFieldResName: function() {
         var modelData = this.model.get('resourceName');

        $('#resourceName').val(modelData.value);

        console.log('fillInputFieldResName isCustom: ' + modelData.isCustom);

        if(modelData.isCustom) {
            $('#resourceNameCheckCustomTerm').prop('checked', true);
            $('#resourceNameCustomTermDescr').val(modelData.customDescr).parent().parent().show();
        } else {
            $('#resourceNamePrefix').val(modelData.prefix);
            // TODO (see if it works) set term-val and term-prefix PLUS button
            $('.addFieldBtn').attr({ 'term-value': modelData.value,
                                     'term-prefix': modelData.prefix });
        }
    },

    fillInputFieldsResAttrs: function() {
        var attrsData = this.model.prop('resourceAttrs');
        if(!attrsData) { return; }

        attrsData.forEach(_.bind(function(el, i) {
            if (i !== 0) { this.addAttrField(); }

            console.log('fillInputFields: resourceAttr: ' + this.model.prop('resourceAttrs/' + i).value + ', ' + this.model.prop('resourceAttrs/' + i).prefix);

            $('#resourceAttr' + i).val(this.model.prop('resourceAttrs/' + i).value);

            if(this.model.prop('resourceAttrs/' + i).isCustom) {
                $('#resourceAttr' + i + 'CheckCustomTerm').prop('checked', true);
                $('#resourceAttr' + i + 'CustomTermDescr').val(this.model.prop('resourceAttrs/' + i).customDescr).parent().parent().show();

            } else {
                $('#resourceAttr' + i + 'Prefix').val(this.model.prop('resourceAttrs/' + i).prefix);
            }




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
        return this.$('#resourceAttrInputWrapper').find('.autocompleteInputField').length;
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

        this.saveDataResourceName();
        this.saveDataResourceAttrs();

        // TODO user has to add namd and min. 1 attr before close
        this.close();
    },

    saveDataResourceName: function() {

        var nameVal = $('#resourceName').val().trim();
        var isCustom = false;
        var customDescr;

        if($('#resourceNameCheckCustomTerm').prop('checked')) {
            isCustom = true;
            customDescr = $('#resourceNameCustomTermDescr').val();
            nameVal  = nameVal.replace(/\s/g, ''); // TODO get camel CAse
            nameVal  = nameVal.charAt(0).toUpperCase() + nameVal.slice(1);
        } else {
            var namePrefix = $('#resourceNamePrefix').val();
        }



        if((nameVal && namePrefix) || (nameVal && isCustom && customDescr)) {
            this.model.set('label', nameVal);
            this.model.saveName(nameVal, namePrefix, isCustom, customDescr);
        } else {
            //TODO show error msg to user
        }



    },

    saveDataResourceAttrs: function() {

        this.model.prop('resourceAttr', []);
        var model = this.model;

        $('#resourceAttrInputWrapper .autocompleteInputField').each(function() {

            var attrVal = $(this).children('.ui-autocomplete-input').val().trim();
            var isCustom = false;
            var customDescr;

            if($(this).parent().next().find('input[name=customTermCheck]').prop('checked')) {
                isCustom = true;
                customDescr = $(this).parent().next().next().find('input[name=customTermDescr]').val();
                //console.log('#resourceNameCheckCustomAttr was checked, val: ' + customDescr);
                // TODO (see if it works) reset hidden prefix field
                $(this).children('.prefixInput').val('');
                attrVal = attrVal.replace(/\s/g, ''); // remove white spaces TODO get Camelcase
                attrVal = attrVal.charAt(0).toLowerCase() + attrVal.slice(1);
            } else {
                var attrPrefix = $(this).children('.prefixInput').val();
            }


            console.log('found input fields: ' + attrVal + ', ' + attrPrefix + ', ' + isCustom +', ' + customDescr);
            if((attrVal && attrPrefix) || (attrVal && isCustom && customDescr)) {
                model.saveAttribute(attrVal, attrPrefix, isCustom, customDescr);
            } else {
                //TODO show error msg to user
            }
        });


    },


    close: function (evt) {
        if(evt) evt.preventDefault();
        this.remove();
        $('body').append('<div id="editResource" class="editGraphElement"></div>');
    }
});

module.exports = EditResourceView;