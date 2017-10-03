/**
 * Created by Julian Richter on 21 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var HelpView = require('./helpView');
var ExportView = require('./exportView');
var AboutView = require('./aboutView');

var PopUpView = Backbone.View.extend({
    el: '#popUpView',
    template:  _.template($('#popUpView-template').html()),

    initialize: function(options){
        this.options = options;
        this.render();
    },

    events: {
        'click .close' : 'close'
    },

    render: function () {
        this.$el.html(this.template());

        if(this.options.subview === 'help') {
            new HelpView({});
        } else if(this.options.subview === 'export'){
            new ExportView({});
        } else if(this.options.subview === 'about'){
            new AboutView({});
        }


        $('#sidePanel, #paper').fadeTo(400, 0.4).css('pointer-events', 'none');
        this.$el.fadeIn(400);
        return this;
    },

    assign : function (view, selector) {
        view.setElement(this.$(selector)).render();
    },

    submit: function (evt) {
        evt.preventDefault();
        this.close();
    },

    close: function () {
        this.$el.fadeOut(300);
        this.$el.empty();
        $('#sidePanel, #paper').fadeTo(400, 1).css('pointer-events', '');
    }
});

module.exports = PopUpView;

