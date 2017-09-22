/**
 * Created by Julian Richter on 22 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;

var ImportView = Backbone.View.extend({
    el: '#popUpView',
    template:  _.template($('#about-template').html()),

    initialize: function(){
        this.render();
    },

    events: {
        'click .importSubmitBtn': 'submit'
    },

    render: function () {
        this.$el.html(this.template);
        return this;
    },

    submit: function (evt) {
        evt.preventDefault();
        this.close();
    }
});

module.exports = ImportView;
