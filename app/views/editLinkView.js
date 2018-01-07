/**
 * Created by Julian Richter on 04 Oct 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var SuggestionItemViewLink = require('./suggestionInputViewLink');

var EditLinkView = Backbone.View.extend({
    el: '#editLink',
    template:  _.template($('#edit-link-template').html()),

    initialize: function(){
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

        new SuggestionItemViewLink({
            el: '#relationInputWrapper',
            id: 'relation',
            label: 'Relation',
            resourceNameValue: resNameSource[0],
            resourceNamePrefix: resNameSource[1]
        });

        //TODO remove ID attributes when not needed
        this.addOperationFieldSet();
        //this.fillInputFields();
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
            this.$el.find('input[name=collItemLinkCheckBox]').prop('checked', true);
        }

        var stateTransisions = this.model.prop('stateTransitions');

        if(!stateTransisions) return;
        stateTransisions.forEach(_.bind(function(el, i) {
            if (i !== 0) this.addFields();

            var method = this.model.prop('stateTransitions/' + i + '/method');
            if(method) $('#methodDropdown' + i + ' option[value=' + method + ']').prop('selected', true);
            $('#url' + i).val(this.model.prop('stateTransitions/' + i + '/url'));
            $('#relation' + i).val(this.model.prop('stateTransitions/' + i + '/relation'));
        }, this));
    },


    addOperationFieldSet: function (evt) {
        if(evt) evt.preventDefault();

        var operationCount = this.getNextOperationID();
        console.log('editLinkView addOperatioNFielSet count: ' + operationCount);


        var operationTemplate =_.template($('#operation-template').html());
        $('#operationFieldSetsWrapper').append(operationTemplate({idSet: operationCount}));

        new SuggestionItemViewLink({
            el: this.$el.find('.operationInputWrapper').last(),
            id: 'operation'+operationCount,
            label: 'Descriptor'
        });

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
        var isCustom = false;
        var customDescr;

        if($('#relationCheckCustomTerm').prop('checked')) {
            isCustom = true;
            customDescr = $('#relationCustomTermDescr').val();
            relVal  = relVal.replace(/\s/g, ''); // TODO get camel CAse
            relVal  = relVal.charAt(0).toLowerCase() + relVal.slice(1);
        } else {
            var prefix = $('#relationPrefix').val();
        }

        console.log('saveDataLinkRelation: ' +relVal + ', '
            + prefix + ', ' + isCustom +', ' + customDescr);



        if((relVal && prefix) || (relVal && isCustom && customDescr)) {
            this.model.saveRelation(relVal, prefix, isCustom, customDescr);
        } else {
            //TODO show error msg to user
        }


    },

    saveDataOperations: function() {
        var linkModel = this.model;

        $('#operationFieldSetsWrapper').children('div').each(function() {

            var method = $(this).find('select[name=methodDropdown]').val();
            var descriptorVal = $(this).find('.ui-autocomplete-input').val().trim();
            var isCustom = false;
            var customDescr;

            if($(this).find('input[name=customTermCheck]').prop('checked')) {
                isCustom = true;
                customDescr = $(this).find('input[name=customTermDescr]').val().trim();
                //console.log('#resourceNameCheckCustomAttr was checked, val: ' + customDescr);
                // TODO (see if it works) reset hidden prefix field
                $(this).find('.prefixInput').val('');
                descriptorVal = descriptorVal.replace(/\s/g, ''); // remove white spaces TODO get Camelcase
                descriptorVal = descriptorVal.charAt(0).toLowerCase() + descriptorVal.slice(1);
            } else {
                var descriptorPrefix = $(this).find('.prefixInput').val();
            }

            console.log('saveDataOperations: ' + method + ', '+ descriptorVal + ', '
                + descriptorPrefix + ', ' + isCustom +', ' + customDescr);

            if((method) && (!isCustom || (isCustom && descriptorVal && customDescr))) {
                linkModel.saveOperation(method, descriptorVal, descriptorPrefix, isCustom, customDescr);
            } else {
                //TODO show error msg to user
            }
        });
    },

    close: function (evt) {
        if(evt) evt.preventDefault();
        this.remove();
        $('body').append('<div id="editLink" class="editGraphElement"></div>');
    }
});

module.exports = EditLinkView;
