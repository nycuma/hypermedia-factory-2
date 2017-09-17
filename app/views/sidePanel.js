/**
 * Created by Julian Richter on 12 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var InstructionView = require('./instructionView');
var SingleInstruction = require('../models/singleInstruction');
var instructionsList;
instructionsList = require('../collections/instructionsList');

var SidePanelView = Backbone.View.extend({
    el: '#sidePanel',
    template: '<img alt="Hypermedia Factory" title="Hypermedia Factory Logo" src="static/img/logo.png" width="199" height="96"/>\
                <nav>\
                    <button id="importBtn">Import</button>\
                    <button id="exportBtn">Export</button>\
                    <button id="aboutBtn">About</button>\
                </nav>\
                <div id="welcome">\
                    <span class="headQuickIntro">A Hypermedia Code-Template Factory for RESTful Web APIs</span>\
                    <br>Hello there! Welcome to the Hypermedia Factory! Some welcome text. This is a \
                    <a href="#" title="go somewhere">link</a>. Some more welcome text. \
                    <a href="#" title="go somewhere">Another</a> link.\
                </div>\
                <div id="instructions">\
                    <span class="headQuickIntro">Quick Instructions</span>\
                </div>',



    initialize: function(){
        this.render();
        this.loadInstructions();
    },

    render: function () {
        this.$el.html(this.template);
        return this;
    },

    loadInstructions: function () {
        $.getJSON('../app/modelData/instructionsData.json', function(data) {
            data.items.forEach(function(item) {
                console.log('loading instruction item: ' + JSON.stringify(item));

                var newInstrModel = new SingleInstruction(item); // create new model
                instructionsList.create(newInstrModel); // add model to collection
                var view = new InstructionView({ model: newInstrModel }); // create new view for model
                $('#instructions').append(view.render().el); // render view
            });
        });
    }
    /**
    addInstrModel: function(item) {
        console.log('loading instruction item: ' + JSON.stringify(item));

        var newInstrModel = new SingleInstruction(item);
        instructionsList.create(newInstrModel);
        this.renderInstrView(newInstrModel);
    },

    renderInstrView: function(instr){
        var view = new InstructionView({ model: instr });
        $('#instructions').append(view.render().el);
    }
    */
});

module.exports = SidePanelView;
