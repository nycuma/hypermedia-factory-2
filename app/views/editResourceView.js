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
        var acResName = new AutocompleteView({
            el: '#resourceNameInputWrapper',
            id: 'resourceName',
            label: ''
        });
        this.listenTo(acResName, 'resourceNameSelected', this.refreshAttrField);
        if(this.model.prop('resourceName') && !this.model.prop('resourceName').isCustom) acResName.unregisterTermValueChangeEvent();

        if(this.model.get('label') == 'new resource') {
            this.addAttrFieldSet();
        } else {
            this.fillInputFields();
        }

        this.$el.show();
        return this;
    },

    addAttrFieldSet: function(evt, nameIri) {

        if(evt) evt.preventDefault();

        var iriVal = $('#resourceNameIri').val();
        var resourceNameIri = nameIri ? nameIri : (iriVal.indexOf('{myURL}/vocab#') === 0 ? undefined : iriVal);
        var attrCount = this.getNextAttrID();

        console.log('editResourceView addAttrFieldSet attrCount: ' + attrCount);

        var attrTemplate =_.template($('#resource-attribute-template').html());
        $('#resourceAttrsWrapper').append(attrTemplate({idSet: attrCount}));

        var acAttr = new AutocompleteView({
            el: this.$el.find('.resourceAttrInputWrapper').last(),
            id: 'resourceAttr' + attrCount,
            label: '',
            resourceNameIri: resourceNameIri
        });

        return acAttr;
    },

    getNextAttrID: function() {
        return this.$('#resourceAttrsWrapper').find('.autocompleteInputField').length;
    },

    fillInputFields: function () {
        var resName = this.model.prop('resourceName');
        this.fillInputFieldResName(resName);
        this.fillInputFieldsResAttrs(resName.iri);
        console.log('fillInputFields: resourceName: ' + resName.iri);
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

    fillInputFieldsResAttrs: function(resNameIri) {
        var acAttr, attrsData = this.model.prop('resourceAttrs');

        if(!attrsData || attrsData.length === 0) {
            // show empty field set if no attributes are found in model data
            console.log('not attr data found');
            this.addAttrFieldSet(null, resNameIri);
            return;
        }

        attrsData.forEach(_.bind(function(modelData, i) {
            acAttr = this.addAttrFieldSet(null, resNameIri);
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
                acAttr.unregisterTermValueChangeEvent();
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
        this.addAttrFieldSet(null, data.iri);
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
        var isCustom = Utils.checkIfCustom($resName);
        var customDescr, iri;

        if(isCustom === true) {
            customDescr = $('#resourceNameTermDescr').val();
        } else {
            iri = $('#resourceNameIri').val();
            var namePrefix = $resName.attr('term-prefix');
        }

        console.log('saving resource name... found input fields: '
            + '\n\tValue: ' + nameVal
            + '\n\tPrefix: ' + namePrefix
            + '\n\tIRI: ' + iri
            + '\n\tisCustom: ' + isCustom
            + '\n\tCustom description: ' + customDescr);

        if((nameVal && iri) || (nameVal && isCustom)) {
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
            var iri, customDescr,
                $resAttr = $(this).find('.ui-autocomplete-input'),
                attrVal = $resAttr.val().trim();

            if(attrVal) {
                var isCustom = Utils.checkIfCustom($resAttr);

                if (isCustom) {
                    customDescr = $(this).find('textarea[name=termDescr]').val().trim();
                } else {
                    var attrPrefix = $resAttr.attr('term-prefix');
                    iri = $(this).find('input[name=inputFieldIri]').val();
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

                if ((attrVal && iri) || (attrVal && isCustom)) {
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