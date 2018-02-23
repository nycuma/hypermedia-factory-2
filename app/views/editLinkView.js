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

        this.addOperationFieldSet();
        this.fillInputFields();
        //this.setPrefixForAddButton();
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

        // set check mark if link connects collection and item
        if(this.model.prop('isCollItemLink') === true) {
            this.$el.find('input[name=collItemLinkCheckBox]').prop('checked', true);
        }

        this.setInputFieldsOperations();

    },

    /*
    setPrefixForAddButton: function() {
        var prefix = this.getResNameSourceNode()[1];
        $('.addFieldBtn').attr('term-prefix', prefix);
        console.log('editResourceView: updatePrefixForAddButton. Prefix: ' + prefix);
    },
    */

    setInputFieldsOperations: function () {
        var operations = this.model.prop('operations');
        if(!operations) return;

        operations.forEach(_.bind(function(elem, i) {
            if (i !== 0) this.addOperationFieldSet();

            // set fields for relation
            $('#relation' + i).val(elem.value);
            $('#relation' + i).attr('term-prefix', elem.prefix);
            $('#relation' + i + 'Iri').val(elem.iri);


            if(elem.isCustom) {
                $('#relation' + i).attr('isCustom', true);
                // set custom description
                $('#relation' + i +'TermDesc').val(elem.customDescr);
                // update IRI field
                $('#relation' + i + 'Iri').val('{myURL}/vocab#' + elem.value);
            } else {
                $('#relation' + i).attr('isCustom', false);
                // get description from vocab
                var vocabDescription = this.getDescriptionFromVocab(elem.iri, elem.prefix, elem.value);
                $('#relation' + i +'TermDescr').val(vocabDescription);
                $('#operation' + i + 'Prefix').val(elem.prefix);
            }


            // set fields for action and method
            $('#action' + i).val(elem.actionValue);
            $('#action' + i + 'Iri').val(elem.actionIri);
            $('#action' + i +'TermDescr').val(this.getDescriptionFromVocab(elem.actionIri));
            $('#methodDropdown' + i).val(elem.method);

        }, this));
    },

    getDescriptionFromVocab: function(iri, prefix, value) {
        var descr = '';
        if(iri) {
            var rdfComment = sugSource.rdfStore.getObjectsByIRI(iri, 'http://www.w3.org/2000/01/rdf-schema#comment');
            if(rdfComment) descr = rdfComment[0].substr(1, rdfComment[0].length-2);
        }
        else if(prefix && value) {
            descr = sugSource.getDescriptionForNonRDFTerm(prefix, value);
        }
        return descr;
    },

    addOperationFieldSet: function (evt) {
        if(evt) evt.preventDefault();

        var operationCount = this.getNextOperationID();
        console.log('editLinkView addOperatioNFielSet count: ' + operationCount);


        var operationTemplate =_.template($('#operation-template').html());
        $('#operationFieldSetsWrapper').append(operationTemplate({idSet: operationCount}));

        var resNameSource = this.getResNameSourceNode();
        new AutocompleteView({
            el: this.$el.find('.relationInputWrapper').last(),
            id: 'relation'+operationCount,
            label: 'Relation:',
            resourceNameValue: resNameSource[0],
            resourceNamePrefix: resNameSource[1]
        });

        new AutocompleteView({
            el: this.$el.find('.actionInputWrapper').last(),
            id: 'action'+operationCount,
            label: 'Action:'
        });

        $('#action'+operationCount+'TermDescr').attr({'readonly': true, 'placeholder': ''});
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

        } else {
            linkModel.unsetStructuralTypeAtNodes();
            linkModel.prop('isCollItemLink', false);
        }
    },

    saveDataOperations: function() {
        var linkModel = this.model;
        linkModel.prop('operations', []);

        var self = this;

        $('#operationFieldSetsWrapper').children('div').each(function() {

            // save relation
            var relWrapper = $(this).find('.relationInputWrapper').first();

            var relVal = relWrapper.find('.ui-autocomplete-input').val().trim();
            var relIri = relWrapper.find('input[name=inputFieldIri]').val();
            var relPrefix = relWrapper.find('.ui-autocomplete-input').attr('term-prefix');
            var relIsCustom = self.checkIfCustom(relWrapper.find('.ui-autocomplete-input'));
            var relCustomDescr;

            if(relIsCustom) {
                console.log('SaveDataOp: relIsCustom');
                relCustomDescr = relWrapper.find('textarea[name=termDescr]').val().trim();
            }

            // save action
            var actionWrapper = $(this).find('.actionInputWrapper').first();

            var actionVal = actionWrapper.find('.ui-autocomplete-input').val().trim();
            var actionIri = actionWrapper.find('input[name=inputFieldIri]').val();
            var actionPrefix = actionWrapper.find('.prefixInput').val(); // TODO !!!

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

            if(relVal) {
                linkModel.saveLink(method, relVal, relPrefix, relIri, relIsCustom, relCustomDescr, actionVal, actionPrefix, actionIri)
            } else {
                //TODO show error msg to user
            }
        });
    },

    checkIfCustom: function (element) {
        if($(element).attr('isCustom') == 'true') {
            return true;
        }
        return false;
    },

    /*
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
                .attr({src: 'static/img/icon_settings.png', title: 'Options for request parameters', count: dropdownCount})
                .addClass('displayIcon');
        } else {
            dropdown.parent().next().find('.settingsIcon')
                .attr({src: 'static/img/icon_no_settings.png', title: '', count: ''})
                .removeClass('displayIcon');
        }
    },


    toggleOptionsRequestParams: function(evt) {

        var optionsOnDisplay = $(evt.target).parent().parent().parent().parent().find('.requestParamsOptionsWrapper');

        console.log('displayOptionsRequestParams size: ' + optionsOnDisplay.length);

        if(optionsOnDisplay.length > 0) {
            optionsOnDisplay.remove();
        } else {
            if($(evt.target).hasClass('displayIcon')) {
                var count = $(evt.target).attr('count');
                var attrs = this.model.getTargetNode().getResourceAttrsValues();

                attrs.forEach(function(attr) {
                    var paramTemplate =_.template($('#request-param-template').html());
                    var tbody = $(paramTemplate({attrVal: attr})).wrap('<tbody></tbody>').addClass('requestParamsOptionsWrapper');
                    $('#operationFieldSet'+count+' table').append(tbody);

                });

            }
        }


    },
    */

    close: function (evt) {
        if(evt) evt.preventDefault();
        this.remove();
        $('body').append('<div id="editLink" class="editGraphElement"></div>');
    }

    /*
    registerDropdownChangeEvent: function (count) {
        $('#methodDropdown'+count).change(_.bind(function(evt) {
            this.updateSettingsIcon(evt);
        }, this));

        $('#methodDropdown'+count).parent().next().find('.settingsIcon').click(_.bind(function(evt) {
            this.toggleOptionsRequestParams(evt);
        }, this));
    }
    */
});

module.exports = EditLinkView;
