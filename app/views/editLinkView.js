/**
 * Created by Julian Richter on 04 Oct 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var AutocompleteView = require('./autocompleteView');

var EditLinkView = Backbone.View.extend({
    el: '#editLink',
    template:  _.template($('#edit-link-template').html()),

    initialize: function(options){
        this.render();
    },

    events: {
        'click .submitBtn': 'submit',
        'click .cancelBtn' : 'close',
        'click .addFieldBtn' : 'addOperationFieldSet'
    },

    render: function () {
        this.$el.html(this.template);

        var resNameSource = this.getResNameSourceNode();

        new AutocompleteView({
            el: '#relationInputWrapper',
            id: 'relation',
            label: 'Relation',
            resourceNameValue: resNameSource[0],
            resourceNamePrefix: resNameSource[1]
        });

        //TODO remove ID attributes when not needed
        this.addOperationFieldSet();
        this.fillInputFields();
        this.$el.show();
        return this;
    },

    getResNameSourceNode: function () {
        var sourceNode = this.model.getSourceNode();
        return [sourceNode.getResourceNameVal(), sourceNode.getResourceNamePrefix()];
    },

    getNextOperationID: function() {
        return this.$el.find('#operationFieldSetsWrapper').children('div').length;
    },

    fillInputFields: function () {

        if(this.model.prop('isCollItemLink') === true) {
            // set check mark
            console.log('fillInputFields isCollItemLink: true');
            this.$el.find('input[name=collItemLinkCheckBox]').prop('checked', true);
        }

        this.setInputFieldRelation();
        this.setInputFieldsOperations();
    },

    setInputFieldRelation: function() {
        var relation = this.model.prop('relation');
        if(relation) {
            $('#relation').val(relation.value);
            $('#relationIri').val(relation.iri);

            if(relation.isCustom) {
                $('#relationCheckCustomTerm').prop('checked', true);
                $('#relationCustomTermDescr').val(relation.customDescr).parent().parent().show();

            } else {
                $('#relationPrefix').val(relation.prefix);
            }
        }
    },

    setInputFieldsOperations: function () {
        var operations = this.model.prop('operations');
        if(!operations) return;

        operations.forEach(_.bind(function(elem, i) {
            if (i !== 0) this.addOperationFieldSet();

            //console.log('fillInputFields: ' + relation + ', ' + el.method);
            $('#methodDropdown' + i).val(elem.method);
            $('#operation' + i).val(elem.value);
            $('#operation' + i + 'Iri').val(elem.iri);
            this.updateSettingsIcon(null, i);

            if(elem.isCustom) {
                $('#operation' + i + 'CheckCustomTerm').prop('checked', true);
                $('#operation' + i + 'CustomTermDescr').val(elem.customDescr).parent().parent().show();

            } else {
                $('#operation' + i + 'Prefix').val(elem.prefix);
            }

        }, this));
    },


    addOperationFieldSet: function (evt) {
        if(evt) evt.preventDefault();

        var operationCount = this.getNextOperationID();
        console.log('editLinkView addOperatioNFielSet count: ' + operationCount);


        var operationTemplate =_.template($('#operation-template').html());
        $('#operationFieldSetsWrapper').append(operationTemplate({idSet: operationCount}));

        new AutocompleteView({
            el: this.$el.find('.operationInputWrapper').last(),
            id: 'operation'+operationCount,
            label: 'Descriptor'
        });

        this.registerDropdownChangeEvent(operationCount);

    },

    submit: function (evt) {
        if(evt) evt.preventDefault();

        this.saveStateCollItemCheckBox();
        this.saveDataLinkRelation();
        this.saveDataOperations();

        this.close();
    },

    saveStateCollItemCheckBox: function () {
        var linkModel = this.model;

        if(this.$el.find('input[name=collItemLinkCheckBox]').prop('checked')) {
            linkModel.setStructuralTypeAtNodes();
            linkModel.prop('isCollItemLink', true);

        } else {
            linkModel.unsetStructuralTypeAtNodes();
            linkModel.prop('isCollItemLink', false);
        }
    },

    saveDataLinkRelation: function() {
        var relVal = $('#relation').val().trim();
        var iri = $('#relationIri').val();
        var isCustom = false;
        var customDescr;

        if($('#relationCheckCustomTerm').prop('checked')) {
            isCustom = true;
            customDescr = $('#relationCustomTermDescr').val();
        } else {
            var prefix = $('#relationPrefix').val();
        }

        console.log('saving link relation... found input fields: '
            + '\n\tValue: ' + relVal
            + '\n\tPrefix: ' + prefix
            + '\n\tIRI: ' + iri
            + '\n\tisCustom: ' + isCustom
            + '\n\tCustom description: ' + customDescr);

        if((relVal && prefix) || (relVal && isCustom && customDescr)) {
            this.model.saveRelation(relVal, prefix, iri, isCustom, customDescr);
        } else {
            //TODO show msg to user
        }
    },

    saveDataOperations: function() {
        var linkModel = this.model;
        linkModel.prop('operations', []);

        $('#operationFieldSetsWrapper').children('div').each(function() {

            var method = $(this).find('select[name=methodDropdown]').val();
            var descriptorVal = $(this).find('.ui-autocomplete-input').val().trim();
            var iri = $(this).find('input[name=inputFieldIri]').val();
            var isCustom = false;
            var customDescr;

            if($(this).find('input[name=customTermCheck]').prop('checked')) {
                isCustom = true;
                customDescr = $(this).find('input[name=customTermDescr]').val().trim();
                // TODO (see if it works) reset hidden prefix field
                $(this).find('.prefixInput').val('');
            } else {
                var descriptorPrefix = $(this).find('.prefixInput').val();
            }

            console.log('saving operation... found input fields: '
                + '\n\tMethod: ' + method
                + '\n\tDescriptor value: ' + descriptorVal
                + '\n\tDescriptor prefix: ' + descriptorPrefix
                + '\n\tDescriptor IRI: ' + iri
                + '\n\tDescriptor is custom: ' + isCustom
                + '\n\tDescriptor custom description: ' + customDescr);

            if((method) && (!isCustom || (isCustom && descriptorVal && customDescr))) {
                linkModel.saveOperation(method, descriptorVal, descriptorPrefix, iri, isCustom, customDescr);
            } else {
                //TODO show error msg to user
            }
        });
    },

    updateSettingsIcon: function (evt, count) {

        var dropdown, dropdownCount;

        if(evt) {
            dropdown = $(evt.target);
            dropdownCount = dropdown.attr('count');
        } else {
            dropdown = $('#methodDropdown'+count);
            dropdownCount = count;
        }

        if(dropdown.val() === 'REPLACE' || dropdown.val() === 'CREATE') {
            dropdown.parent().next().find('.settingsIcon')
                .attr({src: 'static/img/icon_settings.png', title: '(TODO) Options for request parameters', count: dropdownCount})
                .addClass('displayIcon');
        } else {
            dropdown.parent().next().find('.settingsIcon')
                .attr({src: 'static/img/icon_no_settings.png', title: '', count: ''})
                .removeClass('displayIcon');
        }
    },

    //TODO displayOptionsRequestParams
    toggleOptionsRequestParams: function(evt) {

        var optionsOnDisplay = $(evt.target).parent().parent().parent().parent().find('.requestParamsOptionsWrapper');

        console.log('displayOptionsRequestParams size: ' + optionsOnDisplay.length);

        if(optionsOnDisplay.length > 0) {
            optionsOnDisplay.remove();
        } else {
            if($(evt.target).hasClass('displayIcon')) {
                var count = $(evt.target).attr('count');
                var attrs = this.model.getSourceNode().getResourceAttrsValues();

                attrs.forEach(function(attr) {
                    var paramTemplate =_.template($('#request-param-template').html());
                    var tbody = $(paramTemplate({attrVal: attr})).wrap('<tbody></tbody>').addClass('requestParamsOptionsWrapper');
                    $('#operationFieldSet'+count+' table').append(tbody);

                });

            }
        }


    },

    close: function (evt) {
        if(evt) evt.preventDefault();
        this.remove();
        $('body').append('<div id="editLink" class="editGraphElement"></div>');
    },

    registerDropdownChangeEvent: function (count) {
        $('#methodDropdown'+count).change(_.bind(function(evt) {
            this.updateSettingsIcon(evt);
        }, this));

        $('#methodDropdown'+count).parent().next().find('.settingsIcon').click(_.bind(function(evt) {
            this.toggleOptionsRequestParams(evt);
        }, this));
    }
});

module.exports = EditLinkView;
