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

        var baseUrl = $('#exportBaseUrl').val().trim();
        var namespace = $('#exportNamespace').val().trim();
        var title = $('#exportApiTitle').val().trim();
        var descr = $('#exportApiDescr').val().trim();

        namespace = namespace ? namespace : 'http://mysite.org/api/vocab#';
        baseUrl = baseUrl ? baseUrl : 'http://mysite.org/api';

        var docs = new HydraDocs(this.model, namespace, baseUrl, title, descr);
        docs.downloadHydraAPIDocs();

        //TODO info for user in Download View: place docs in root folder and add link to HTTP header
    }
});

module.exports = DownloadView;