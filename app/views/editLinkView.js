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

var EditLinkView = Backbone.View.extend({
    el: '#editLink',
    template:  _.template($('#edit-link-template').html()),
    operationCount: 0,

    initialize: function(options){
        this.options = options;
        $('#paper').css('pointer-events', 'none');
        this.render();
    },

    events: {
        'click .submitBtn': 'submit',
        'click .cancelBtn' : 'close',
        'click .addFieldBtn' : 'addOperationFieldSet',
        'click input[name=collItemLinkCheckBox]' : 'toggleStrucTypeOptionsCheckbox',
        'click input[name=embedItemsCheckBox]' : 'toggleDisableEditView'
    },

    render: function () {
        this.$el.html(this.template);

        var modelDataFound = this.fillInputFields();
        console.log('editLinkView render: found model data: ' + modelDataFound);
        if(!modelDataFound) this.addOperationFieldSet();
        if(this.options.isSelfReferencing === true || this.model.getSourceNode().get('type') == 'custom.StartNode')
            $('#linkOptions').hide();
        this.$el.show();
        return this;
    },

    getResNameIRISourceNode: function () {
        var sourceNode = this.model.getSourceNode();
        if(sourceNode.get('type') === 'html.Node') {
            return sourceNode.getResourceNameIri();
        }
    },

    getNextOperationID: function() {
        return this.$el.find('#operationFieldSetsWrapper').children('div').length;
    },

    // returns false if operations were found in model data
    fillInputFields: function () {
        this.setCheckMarksForLinkOptions();
        this.toggleStrucTypeOptionsCheckbox();
        this.toggleDisableEditView();
        return this.setInputFieldsOperations();
    },

    setCheckMarksForLinkOptions: function () {
        // set check mark if link connects collection and item
        if(this.model.prop('isCollItemLink') === true) {
            this.$el.find('input[name=collItemLinkCheckBox]').prop('checked', true);
            if(this.model.prop('allowFilter') === true) {
                this.$el.find('input[name=allowFilterCheckBox]').prop('checked', true);
                this.$el.find('input[name=allowFilterParams]').val(this.model.prop('allowFilterParams'));
            }
            if(this.model.prop('embedItems') === true) {
                this.$el.find('input[name=embedItemsCheckBox]').prop('checked', true);
            }
        }
    },

    // returns false if operations were found in model data
    setInputFieldsOperations: function () {
        var operations = this.model.prop('operations');
        if (!operations || operations.length === 0) {
            console.log('setInputFieldsOperations: no model data found');
            return false;
        } else {

            operations.forEach(_.bind(function (elem, i) {

                var autocompleteRel = this.addOperationFieldSet();

                var $relField = $('#relation' + i);
                // set fields for relation
                $relField.val(elem.value);
                $('#relation' + i + 'Iri').val(elem.iri);


                if (elem.isCustom) {
                    $relField.attr('isCustom', true);
                    // set custom description
                    $('#relation' + i + 'TermDescr').val(elem.customDescr);
                    // update IRI field
                    $('#relation' + i + 'Iri').val('{myURL}/vocab#' + elem.value);
                } else {
                    // get description from vocab
                    if (elem.iri === sugSource.prefixes.hydra + 'member') {
                        // quick fix: hard coded term description. TODO: parse Hydra vocabulary and get descripton from there
                        $('#relation' + i + 'TermDescr').val('A member of the collection');
                    } else {
                        var vocabDescription = sugSource.getDescriptionFromVocab(elem.iri, elem.prefix, elem.value);
                        $('#relation' + i + 'TermDescr').val(vocabDescription);
                    }
                    $relField.attr({'isCustom': false, 'term-prefix': elem.prefix});
                    autocompleteRel.unregisterTermValueChangeEvent();
                }

                // method dropdown
                $('#methodDropdown' + i).val(elem.method);
                // fields for action


                if (elem.prefix == 'iana') {

                } else {
                    var actionValue = sugSource.getTermFromIRI(elem.actionIri);
                    $('#action' + i).val(actionValue).attr('term-prefix', elem.prefix);
                    $('#action' + i + 'Iri').val(elem.actionIri);
                    $('#action' + i + 'TermDescr').val(sugSource.getDescriptionFromVocab(elem.actionIri));

                    $('#actionInputWrapper' + i).show();
                }
            }, this));

            return true;
        }


    },

    addOperationFieldSet: function (evt) {
        if(evt) evt.preventDefault();

        var operationCount = this.getNextOperationID();
        console.log('editLinkView addOperatioNFielSet count: ' + operationCount);


        var operationTemplate =_.template($('#operation-template').html());
        $('#operationFieldSetsWrapper').append(operationTemplate({idSet: operationCount}));

        var resNameSource = this.getResNameIRISourceNode();
        var acRelation = new AutocompleteView({
            el: this.$el.find('.relationInputWrapper').last(),
            id: 'relation'+operationCount,
            label: 'Relation:',
            resourceNameIri: resNameSource ? resNameSource : undefined
        });

        new AutocompleteView({
            el: this.$el.find('.actionInputWrapper').last(),
            id: 'action'+operationCount,
            label: 'Action:'
        });

        $('#action'+operationCount+'TermDescr').attr({'readonly': 'readonly', 'placeholder': ''});
        this.operationCount = operationCount;
        return acRelation;
    },

    submit: function (evt) {
        if(evt) evt.preventDefault();

        this.saveStateCollItemCheckBox();
        this.saveDataOperations();

        this.close();
    },

    saveStateCollItemCheckBox: function () {
        var linkModel = this.model;

        if(this.$el.find('input[name=collItemLinkCheckBox]').prop('checked')) {
            linkModel.setStructuralTypeAtNodes();
            linkModel.prop('isCollItemLink', true);
            if(this.$el.find('input[name=allowFilterCheckBox]').prop('checked')) {
                linkModel.prop('allowFilter', true);
                linkModel.prop('allowFilterParams', this.$el.find('input[name=allowFilterParams]').val());
            }
            if(this.$el.find('input[name=embedItemsCheckBox]').prop('checked')) {
                linkModel.prop('embedItems', true);
            }
        } else {
            linkModel.unsetStructuralTypeAtNodes();
            linkModel.prop('isCollItemLink', false);
            linkModel.prop('allowFilter', false);
            linkModel.prop('embedItems', false);
        }
    },

    saveDataOperations: function() {
        var linkModel = this.model;
        linkModel.prop('operations', []);

        var self = this;

        if(!this.$el.find('input[name=embedItemsCheckBox]').prop('checked')) {

            $('#operationFieldSetsWrapper').children('div').each(function() {

                var relCustomDescr, relIri;
                // save relation
                var $relWrapper = $(this).find('.relationInputWrapper').first();

                var relVal = $relWrapper.find('.ui-autocomplete-input').val().trim();
                var relIsCustom = Utils.checkIfCustom($relWrapper.find('.ui-autocomplete-input'));


                if(relIsCustom === true) {
                    relCustomDescr = $relWrapper.find('textarea[name=termDescr]').val().trim();
                } else {
                    relIri = $relWrapper.find('input[name=inputFieldIri]').val();
                    var relPrefix = $relWrapper.find('.ui-autocomplete-input').attr('term-prefix');
                }

                // save action
                var $actionWrapper = $(this).find('.actionInputWrapper').first();

                var actionVal = $actionWrapper.find('.ui-autocomplete-input').val().trim();
                var actionIri = $actionWrapper.find('input[name=inputFieldIri]').val();
                var actionPrefix = $actionWrapper.find('.ui-autocomplete-input').attr('term-prefix');

                // save method
                var method = $(this).find('select[name=methodDropdown]').val();

                console.log('saving operation... found input fields: '
                    + '\n\tRel value: ' + relVal
                    + '\n\tRel prefix: ' + relPrefix
                    + '\n\tRel IRI: ' + relIri
                    + '\n\tRel is custom: ' + relIsCustom
                    + '\n\tRel custom description: ' + relCustomDescr
                    + '\n\tAction value: ' + actionVal
                    + '\n\tAction prefix: ' + actionPrefix
                    + '\n\tAction IRI: ' + actionIri
                    + '\n\tMethod: ' + method);

                if((relVal && relIri) || (relVal && relIsCustom)) {
                    linkModel.saveLink(method, relVal, relPrefix, relIri, relIsCustom, relCustomDescr, actionVal, actionPrefix, actionIri)
                } else {
                    //TODO show error msg to user
                }
            });
        } else {
            linkModel.setLabelAsEmbedded();
        }
    },

    toggleStrucTypeOptionsCheckbox: function(evt) {
        if(this.$el.find('input[name=collItemLinkCheckBox]').prop('checked')) {
            this.$el.find('input[name=allowFilterCheckBox], input[name=embedItemsCheckBox], ' +
                'input[name=allowFilterParams]').attr('disabled', false);
            this.$el.find('.collItemLinkOptionText').css('color', '');

            // adds a new or updates an existing RETRIEVE operation and sets link relation to 'hydra:member'
            if(evt) this.setRetrieveOperationToMember();

        } else {
            this.$el.find('input[name=allowFilterCheckBox], input[name=embedItemsCheckBox], ' +
                'input[name=allowFilterParams]').attr('disabled', true);
            this.$el.find('.collItemLinkOptionText').css('color', '#b6afaf');
        }
    },

    toggleDisableEditView: function () {

        if(this.$el.find('input[name=embedItemsCheckBox]').prop('checked')) {
            this.$el.find('#operationFieldSetsWrapper input, select, .addFieldBtn').each(function () {
                $(this).attr('disabled', true);
            });
        } else {
            this.$el.find('#operationFieldSetsWrapper input, select, .addFieldBtn').each(function () {
                $(this).attr('disabled', false);
            });
        }
    },

    setRetrieveOperationToMember: function () {
        // check in view if a RETRIEVE operation has already been set
        var count = this.getNumOfFirstRetrieveMethod();
        if(!count) count = this.operationCount;

        // update exisiting RETRIEVE operation or set values in new field set
        $('#relation'+count).val('member').attr({'term-prefix': 'hydra', 'isCustom': false});
        $('#relation'+count+'Iri').val(sugSource.prefixes.hydra + 'member');
        $('#relation'+count+'TermDescr').val('A member of the collection');

        $('#action'+count).val('ReadAction').attr({'term-prefix': 'schema', 'isCustom': false});
        $('#action'+count+'Iri').val(sugSource.prefixes.schema + 'ReadAction');
        $('#action'+count+'TermDescr').val(sugSource.getDescriptionFromVocab(sugSource.prefixes.schema + 'ReadAction'));
    },

    getNumOfFirstRetrieveMethod: function () {
        var $methods = this.$el.find('select[name=methodDropdown]');
        var count;
        if($methods) {
            $methods.each(function () {
                if($(this).val() == 'RETRIEVE') {
                    count =  $(this).attr('count');
                    return false;
                }
            });
        }
        return count;
    },

    close: function (evt) {
        if(evt) evt.preventDefault();
        this.remove();
        $('#paper').css('pointer-events', '');
        $('body').append('<div id="editLink" class="editGraphElement"></div>');
    }

});

module.exports = EditLinkView;
