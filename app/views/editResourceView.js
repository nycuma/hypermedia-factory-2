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

    attrCount: -1,

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
        this.listenTo(acResName, 'resourceNameSelected', this.refreshAttrFields);
        if(this.model.prop('resourceName') && !this.model.prop('resourceName').isCustom) acResName.unregisterTermValueChangeEvent();

        if(this.model.get('label') == 'new resource') {
            this.addAttrFieldSet();
        } else {
            this.fillInputFields();
        }

        this.$el.show();
        return this;
    },

    /**
     * @param evt
     * @param nameIri IRI of the resource name
     */
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

        this.attrCount = attrCount;
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
            var acView = this.addAttrFieldSet(null, resNameIri);
            /*
            console.log('loading resource attribute... found model data: '
                + '\n\tAttr value: ' + modelData.value
                + '\n\tAttr prefix: ' + modelData.prefix
                + '\n\tIRI: ' + modelData.iri
                + '\n\tisCustom: ' + modelData.isCustom
                + '\n\tCustom description: ' + modelData.customDescr);
                */

            var $attrField = acView.$el.find('.ui-autocomplete-input');
            $attrField.val(modelData.value);

            if(modelData.isCustom) {
                acView.$el.find('input[name=inputFieldIri]').val('{myURL}/vocab#' + modelData.value);
                acView.$el.find('textarea[name=termDescr]').val(modelData.customDescr);
                $attrField.attr('isCustom', true);
            } else {
                acView.$el.find('input[name=inputFieldIri]').val(modelData.iri);
                acView.$el.find('textarea[name=termDescr]').val(sugSource.getDescriptionFromVocab(modelData.iri, modelData.prefix, modelData.value));
                $attrField.attr({'isCustom': false, 'term-prefix': modelData.prefix});
                acView.unregisterTermValueChangeEvent();
            }

            $('#datatypeDropdown'+i).val(modelData.dataType);
            if(modelData.isReadonly) $('#readonlyCheckBox'+i).prop('checked', true);


        }, this));
    },

    /**
     * When the user selects a new resource name (= new RDF class), the terms that are supposed
     * to be suggested in the attributes fields below change (depending on the associated domain of
     * the RDF property). Since the Autocomplete widget is imported via 'required', I was not
     * able yet to figure out how to change the source (= possible values to be suggested) of an
     * autocomplete input field AFTER the field was created. That is why the values from the
     * attribute input fields are temporarily saved, the old autocomplete input fields are removed,
     * and new ones are appended with the updated source. Finally the temporarily saved attribute data
     * is filled into the new fields, but only if the attribute is custom or if the new resource name
     * (or any of its super classes) is still in the domain of that attribute. Other attributes are discarded.
     *
     * @param data : object with IRI of the resource name
     */
    refreshAttrFields: function(data) {
        var attributes = [];
        // get current attribute input values
        $('#resourceAttrsWrapper .resourceAttrSet').each(function() {

            var $resAttr = $(this).find('.ui-autocomplete-input');
            var isCustom = Utils.checkIfCustom($resAttr);
            var iri = $(this).find('input[name=inputFieldIri]').val();

            // add attribute only if it is custom or if the new RDF class is in the attribute's domain
            if(isCustom || (!isCustom && sugSource.checkIfClassInDomainOfProp(data.iri, iri))) {
                attributes.push({
                    value: $resAttr.val().trim(),
                    prefix: $resAttr.attr('term-prefix'),
                    iri: iri,
                    isCustom: isCustom,
                    descr: $(this).find('textarea[name=termDescr]').val().trim(),
                    dataType: $(this).find('select[name=datatypeDropdown]').val(),
                    isReadonly: $(this).find('input[name=readonlyCheckBox]').prop('checked')
                });
            }
        });
        // remove all existing input fields for resource attributes
        $('#resourceAttrsWrapper').empty();
        this.attrCount = -1;

        attributes.forEach(_.bind(function (attr, i) {
            // add updated autocomplete input field and fill with data
            var acView = this.addAttrFieldSet(null, data.iri);
            var $acField = acView.$el.find('.ui-autocomplete-input');
            $acField.val(attr.value).attr({'term-prefix': attr.prefix, 'isCustom': attr.isCustom});
            acView.$el.find('input[name=inputFieldIri]').val(attr.iri);
            acView.$el.find('textarea[name=termDescr]').val(attr.descr);
            $('#datatypeDropdown' + i).val(attr.dataType);
            if (attr.isReadonly) $('#readonlyCheckBox' + i).prop('checked', true);

            if(!attr.isCustom) acView.unregisterTermValueChangeEvent();

        }, this));

        if(this.attrCount < 0) this.addAttrFieldSet(null, data.iri);
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