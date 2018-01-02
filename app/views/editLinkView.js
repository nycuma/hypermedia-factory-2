/**
 * Created by Julian Richter on 04 Oct 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;

var EditLinkView = Backbone.View.extend({
    el: '#editLink',
    template:  _.template($('#edit-link-template').html()),

    initialize: function(){
        this.render();
    },

    events: {
        'click .submitBtn': 'submit',
        'click .cancelBtn' : 'close',
        'click .addFieldBtn' : 'addFields'
    },

    render: function () {
        this.$el.html(this.template);
        this.fillInputFields();
        this.$el.show();
        return this;
    },

    fillInputFields: function () {

        if(this.model.prop('isCollItemLink') === true) {
            // set check mark
            $('#editLink [name=collItemLinkCheckBox]').prop('checked', true);
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


    addFields: function (evt) {
        if(evt) evt.preventDefault();

        var fieldSetCount = $('#editLinkFieldSets > div').length;

        $('#editLinkFieldSets')
            .append('<hr>\
                    <div id="editLinkFieldSet'+fieldSetCount+'">\
                        <table>\
                            <tr>\
                                <td><label id="methodDropdown'+fieldSetCount+'">Method:</label></td>\
                                <td>\
                                    <select name="methodDropdown" id="methodDropdown'+fieldSetCount+'">\
                                        <option></option>\
                                        <option value="GET">GET</option>\
                                        <option value="POST">POST</option>\
                                        <option value="PUT">PUT</option>\
                                        <option value="DELETE">DELETE</option>\
                                    </select>\
                                </td>\
                            </tr>\
                            <tr>\
                                <td><label for="url'+fieldSetCount+'">URL:</label></td>\
                                <td><input type="text" name="url" id="url'+fieldSetCount+'"></td>\
                            </tr>\
                            <tr>\
                                <td><label for="relation'+fieldSetCount+'">Relation:</label></td>\
                            <td><input type="text" name="relation" id="relation'+fieldSetCount+'"></td>\
                            </tr>\
                        </table>\
                    </div>');

    },

    submit: function (evt) {
        evt.preventDefault();

        this.model.prop('stateTransitions', []);

        var linkModel = this.model;

        if($('#editLink [name=collItemLinkCheckBox]').prop('checked')) {
            linkModel.setStructuralTypeAtNodes();
            linkModel.prop('isCollItemLink', true);

        } else {
            linkModel.unsetStructuralTypeAtNodes();
            linkModel.prop('isCollItemLink', false);
        }


        $('#editLinkFieldSets > div').each(function() {
            var method = $(this).find('select[name=methodDropdown]').val();
            var url = $(this).find('input[name=url]').val();
            var rel = $(this).find('input[name=relation]').val();

            if(method || url || rel) linkModel.addPropersties(method, url, rel);
        });

        this.close();
    },

    close: function (evt) {
        if(evt) evt.preventDefault();
        this.remove();
        $('body').append('<div id="editLink" class="editGraphElement"></div>');
    }
});

module.exports = EditLinkView;
