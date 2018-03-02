/**
 * Created by Julian Richter on 22 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var HydraDocs = require('../../util/hydraGenerator');

var DownloadView = Backbone.View.extend({
    el: '#sidePanelContent',
    template:  _.template($('#download-template').html()),

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

        var namespace = 'http://myapi.com/vocab#';
        var baseUrl = 'http://myapi.com/';
        var descr = 'This is my demo API';
        var title = 'Demo API';
        var docs = new HydraDocs(this.model, namespace, baseUrl, title, descr);
        docs.downloadHydraAPIDocs();

        //TODO info for user: place docs in root folder
    }
});

module.exports = DownloadView;