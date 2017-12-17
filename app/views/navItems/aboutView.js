/**
 * Created by Julian Richter on 22 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;

var AboutView = Backbone.View.extend({
    el: '#content',
    template:  _.template($('#about-template').html()),

    initialize: function(){
        this.render();
    },

    render: function () {
        this.$el.html(this.template);
        return this;
    }
});

module.exports = AboutView;
