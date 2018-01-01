/**
 * Created by Julian Richter on 01 Jan 2018
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;

var WelcomeView = Backbone.View.extend({
    el: '#sidePanelContent',
    template:  _.template($('#welcome-template').html()),

    initialize: function(){
        this.render();
    },

    render: function () {
        this.$el.html(this.template);
        return this;
    }
});

module.exports = WelcomeView;

