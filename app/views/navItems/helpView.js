/**
 * Created by Julian Richter on 22 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;

var InstructionsList = require('../../collections/instructionsList');
var InstructionView = require('../instructionView');

var HelpView = Backbone.View.extend({
    el: '#sidePanelContent',
    template:  _.template($('#help-template').html()),

    initialize: function(){
        this.loadInstructions();
        this.render();
    },

    render: function () {
        this.$el.html(this.template);
        return this;
    },


    loadInstructions: function () {
        var instructions = new InstructionsList();

        $.when(instructions.fetch({parse: true})).then(function() {
            instructions.models.forEach(function(model) {
                var view = new InstructionView({model: model}); // create new view for model
                $('#instructions').append(view.render().el);
            });
        });
    }
});

module.exports = HelpView;
