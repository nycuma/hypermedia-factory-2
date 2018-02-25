/**
 * Created by Julian Richter on 04 Oct 2017
 */


'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var AutocompleteView = require('./autocompleteView');
var sugSource;
sugSource = require('../collections/suggestionSource');
var Utils = require('../util/utils');



var EditResourceView = Backbone.View.extend({
    el: '#editResource',
    template:  _.template($('#edit-resource-template').html()),

    initialize: function(){
        $('#paper').css('pointer-events', 'none');
        this.render();
    },

    events: {
        'click .submitBtn': 'submit',
        'click .cancelBtn' : 'close',
        'click .addFieldBtn' : 'addAttrFieldSet'
    },

    render: function () {

        this.$el.html(this.template());

        // add autocomplete input field for resource name
        var avResName = new AutocompleteView({
            el: '#resourceNameInputWrapper',
            id: 'resourceName',
            label: ''
        });
        this.listenTo(avResName, 'resourceNameSelected', this.refreshAttrField);

        if(this.model.get('label') == 'new resource') {
            this.addAttrFieldSet();
        } else {
            this.fillInputFields();
        }

        this.$el.show();
        return this;
    },

    addAttrFieldSet: function(evt, nameVal, namePrefix) {

        var resourceNameValue, resourceNamePrefix;

        if(evt) { // case if PLUS button is clicked by user
            evt.preventDefault();

            var $resName = $('#resourceName');
            if(!$resName.attr('isCustom')) {
                resourceNameValue = $resName.val();
                resourceNamePrefix = $resName.attr('term-prefix');
            }

            console.log('addAttrFieldSet via PLUS button ' +
                    '\n\tterm-value: ' + resourceNameValue +
                    '\n\tterm-prefix: ' + resourceNamePrefix);

        } else if(nameVal && namePrefix) {
            resourceNameValue = nameVal;
            resourceNamePrefix = namePrefix;
        }

        var attrCount = this.getNextAttrID();

        console.log('editResourceView addAttrFieldSet attrCount: ' + attrCount);

        var attrTemplate =_.template($('#resource-attribute-template').html());
        $('#resourceAttrsWrapper').append(attrTemplate({idSet: attrCount}));

        new AutocompleteView({
            //el: '#resourceAttrInputWrapper',
            el: this.$el.find('.resourceAttrInputWrapper').last(),
            id: 'resourceAttr' + attrCount,
            label: '',
            resourceNameValue: resourceNameValue,
            resourceNamePrefix: resourceNamePrefix });
    },

    getNextAttrID: function() {
        return this.$('#resourceAttrsWrapper').find('.autocompleteInputField').length;
    },

    fillInputFields: function () {
        var resName = this.model.prop('resourceName');
        this.fillInputFieldResName(resName);
        this.fillInputFieldsResAttrs(resName.value, resName.prefix);
        console.log('fillInputFields: resourceName: ' + resName.value + ', ' + resName.prefix);
    },

    fillInputFieldResName: function(resNameData) {
        var modelData = resNameData ? resNameData : this.model.get('resourceName');

        /*
        console.log('loading resource name... found model data: '
            + '\n\tAttr value: ' + modelData.value
            + '\n\tAttr prefix: ' + modelData.prefix
            + '\n\tIRI: ' + modelData.iri
            + '\n\tisCustom: ' + modelData.isCustom
            + '\n\tCustom description: ' + modelData.customDescr);
            */

        var $resField = $('#resourceName');
        $resField.val(modelData.value);

        if(modelData.isCustom) {
            $('#resourceNameIri').val('{myURL}/vocab#' + modelData.value);
            $('#resourceNameTermDescr').val(modelData.customDescr);
            $resField.attr('isCustom', true);
        } else {
            $('#resourceNameIri').val(modelData.iri);
            $('#resourceNameTermDescr').val(sugSource.getDescriptionFromVocab(modelData.iri, modelData.prefix, modelData.value));
            $resField.attr({'isCustom': false, 'term-prefix': modelData.prefix});
        }
    },

    fillInputFieldsResAttrs: function(resNameVal, resNamePrefix) {
        var attrsData = this.model.prop('resourceAttrs');

        /*
        var resNameVal, resNamePrefix, $resName = $('#resourceName');
        if(!$resName.attr('isCustom')) {
            resNameVal = $resName.val();
            resNamePrefix = $resName.attr('term-prefix');
        }
        */

        if(!attrsData || attrsData.length === 0) {
            // show empty field set if no attributes are found in model data
            console.log('not attr data found');
            this.addAttrFieldSet(null, resNameVal, resNamePrefix);
            return;
        }

        attrsData.forEach(_.bind(function(modelData, i) {
            this.addAttrFieldSet(null, resNameVal, resNamePrefix);
            /*
            console.log('loading resource attribute... found model data: '
                + '\n\tAttr value: ' + modelData.value
                + '\n\tAttr prefix: ' + modelData.prefix
                + '\n\tIRI: ' + modelData.iri
                + '\n\tisCustom: ' + modelData.isCustom
                + '\n\tCustom description: ' + modelData.customDescr);
                */

            var $attrField = $('#resourceAttr' + i);
            $attrField.val(modelData.value);

            if(modelData.isCustom) {
                $('#resourceAttr'+i+'Iri').val('{myURL}/vocab#' + modelData.value);
                $('#resourceAttr'+i+'TermDescr').val(modelData.customDescr);
                $attrField.attr('isCustom', true);
            } else {
                $('#resourceAttr'+i+'Iri').val(modelData.iri);
                $('#resourceAttr'+i+'TermDescr').val(sugSource.getDescriptionFromVocab(modelData.iri, modelData.prefix, modelData.value));
                $attrField.attr({'isCustom': false, 'term-prefix': modelData.prefix});
            }

            $('#datatypeDropdown'+i).val(modelData.dataType);
            if(modelData.isReadonly) $('#readonlyCheckBox'+i).prop('checked', true);


        }, this));
    },

    /**
     * When user selects a new resource name (= new RDF class), all previously
     * selected resource attributes (RDF properties) are deleted. A new autocomplete
     * input field is generated which suggests only properties whose domain include the new
     * resource name
     * @param data : prefix and value of the RDF class of resource name
     */
    refreshAttrField: function(data) {
        console.log('refresh attr fields');
        // remove all existing input fields for resource attributes
        $('#resourceAttrsWrapper').empty();

        // add input field that suggests only properties for entered resource name
        this.addAttrFieldSet(null, data.value, data.prefix);

        /*
        // add input field that suggests only properties for entered resource name
        new AutocompleteView({el: '#resourceAttrInputWrapper',
                                id: 'resourceAttr0',
                                label: 'Attributes',
                                resourceNameValue: data.value,
                                resourceNamePrefix: data.prefix});
                                */


        // refresh PLUS button that adds new attr fields
        //$('.addFieldBtn').attr({'term-value': data.value, 'term-prefix': data.prefix});
    },

    submit: function (evt) {
        evt.preventDefault();

        this.saveDataResourceName();
        this.saveDataResourceAttrs();

        this.close();
    },

    saveDataResourceName: function() {

        var $resName = $('#resourceName');

        var nameVal = $resName.val().trim();
        var iri = $('#resourceNameIri').val();
        var isCustom = Utils.checkIfCustom($resName);
        var customDescr;

        if(isCustom) {
            customDescr = $('#resourceNameTermDescr').val();
        } else {
            var namePrefix = $resName.attr('term-prefix');
        }

        console.log('saving resource name... found input fields: '
            + '\n\tValue: ' + nameVal
            + '\n\tPrefix: ' + namePrefix
            + '\n\tIRI: ' + iri
            + '\n\tisCustom: ' + isCustom
            + '\n\tCustom description: ' + customDescr);

        if((nameVal && namePrefix) || (nameVal && isCustom)) {
            this.model.saveName(nameVal, namePrefix, iri, isCustom, customDescr);
            return true;
        } else {
            return false;
        }
    },

    saveDataResourceAttrs: function() {
        this.model.prop('resourceAttrs', []);
        var self = this;


        $('#resourceAttrsWrapper .resourceAttrSet').each(function() {

            // save attribute
            var $resAttr = $(this).find('.ui-autocomplete-input');
            var attrVal = $resAttr.val().trim();
            var iri = $(this).find('input[name=inputFieldIri]').val();

            if(attrVal && iri) {
                var isCustom = Utils.checkIfCustom($resAttr);
                var customDescr = '';

                if (isCustom) {
                    customDescr = $(this).find('textarea[name=termDescr]').val().trim();
                } else {
                    var attrPrefix = $resAttr.attr('term-prefix');
                }

                var dataType = $(this).find('select[name=datatypeDropdown]').val();
                var readonly = $(this).find('input[name=readonlyCheckBox]').prop('checked');

                console.log('saving resource attributes... found input fields: '
                    + '\n\tAttr value: ' + attrVal
                    + '\n\tAttr prefix: ' + attrPrefix
                    + '\n\tIRI: ' + iri
                    + '\n\tisCustom: ' + isCustom
                    + '\n\tCustom description: ' + customDescr
                    + '\n\tData type: ' + dataType
                    + '\n\tReadonly: ' + readonly
                );

                if ((attrVal && attrPrefix) || (attrVal && isCustom)) {
                    self.model.saveAttribute(attrVal, attrPrefix, iri, isCustom, customDescr, dataType, readonly);
                    return true;
                } else {
                    return false;
                }
            }

        });
    },

    close: function (evt) {
        if(evt) evt.preventDefault();

        this.remove();
        $('#paper').css('pointer-events', '');
        $('body').append('<div id="editResource" class="editGraphElement"></div>');
    }
});

module.exports = EditResourceView;