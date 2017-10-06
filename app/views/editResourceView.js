/**
 * Created by Julian Richter on 04 Oct 2017
 */


'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;

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
        this.$el.html(this.template);
        this.fillInputFields();
        this.$el.show();
        return this;
    },

    fillInputFields: function () {
        $('#inputResourceId').val(this.model.id);
        $('#resourceName').val(this.model.get('label'));

        var resourceAttrs = this.model.prop('resourceAttr');
        if(!resourceAttrs) return;

        resourceAttrs.forEach(_.bind(function(el, i) {
            if (i !== 0) this.addAttrField();
            $('#attr' + i).val(this.model.prop('resourceAttr/' + i));
        }, this));
    },

    addAttrField: function(evt) {
        if(evt) evt.preventDefault();

        var attrCount = $("#editResourceAttributes tbody > tr").length - 2;

        $('#editResourceAttributes tbody')
            .append('<tr>\
                        <td><label for="attr'+attrCount+'">Attribut:</label></td>\
                        <td><input type="text" name="attr" id="attr'+attrCount+'"></td>\
                    </tr>');

    },

    submit: function (evt) {
        //TODO Button, um einzelne oder alle Attribute zu löschen
        evt.preventDefault();

        var newLabel = $('#resourceName').val().trim();
        if(newLabel) this.model.set('label', newLabel);

        this.model.prop('resourceAttr', []);
        var resourceModel = this.model;

        $('#editResourceAttributes input[name=attr]').each(function() {
            var newAttr = $(this).val();
            if(newAttr) resourceModel.addAttribute(newAttr);
        });

        this.close();
    },

    close: function (evt) {
        if(evt) evt.preventDefault();
        this.$el.remove();
        $('body').append('<div id="editResource" class="editBox"></div>');
    }
});

module.exports = EditResourceView;