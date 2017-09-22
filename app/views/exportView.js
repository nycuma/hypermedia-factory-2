/**
 * Created by Julian Richter on 22 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;

var ExportView = Backbone.View.extend({
    el: '#content',
    template:  _.template($('#export-template').html()),

    initialize: function(){
        this.render();
    },

    events: {
        'click .submitBtn': 'submit'
    },

    render: function () {
        this.$el.html(this.template);
        return this;
    },

    submit: function (evt) {
        evt.preventDefault();
    }
});

module.exports = ExportView;