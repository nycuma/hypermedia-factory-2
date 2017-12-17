/**
 * Created by Julian Richter on 12 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var InstructionView = require('./instructionView');
var PopUpView = require('./popUpView');
var SingleInstruction = require('../models/singleInstruction');
var instructionsList;
instructionsList = require('../collections/instructionsList');

var IanaLinkRelParser = require('../parser/ianaLinkRels');
var SchemaOrgParser = require('../parser/schemaOrg');

var SidePanelView = Backbone.View.extend({
    el: '#sidePanel',
    template: _.template($('#sidePanel-template').html()),

    initialize: function(){
        //_.bindAll(this, 'render');
        this.render();
        //this.loadInstructions();
    },

    render: function () {
        //$(this.el).html($("#sidePanel-template").html());
        this.$el.html(this.template);
        this.$el.fadeIn(400);
    },

    events: {
        'click #parseXmlBtn': 'parseXML',
        'click #parseJsonldBtn': 'parseRDF',
        'click #getSuggestionsBtn': 'getSuggestions'


    },
/*
    loadInstructions: function () {
        $.getJSON('../app/modelData/instructionsData.json', function(data) {
            data.items.forEach(function(item) {
                var newInstrModel = new SingleInstruction(item); // create new model
                instructionsList.create(newInstrModel); // add model to collection
                var view = new InstructionView({ model: newInstrModel }); // create new view for model
                $('#instructions').append(view.render().el); // render view
            });
        });
    },
    */
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

    openPopUpView: function (evt) {
        var end = evt.target.id.length - 3;
        new PopUpView({ subview : evt.target.id.substr(0, end) });
    }

    /*

    //testing parser
    parseXML: function () {

        IanaLinkRelParser.getIanaLinkRelations();
        
    },
    
    parseRDF: function () {
        SchemaOrgParser.getRDFTriples();
    },

    getSuggestions: function () {
        
    }
    */
});

module.exports = SidePanelView;
