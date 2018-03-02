/**
 * Created by Julian Richter on 09 Dec 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var SidePanel = require('./sidePanel');
var Utils = require('../util/utils');

var NavigationBarView = Backbone.View.extend({
    el: '#navigationBar',
    template: _.template($('#navigationBar-template').html()),

    initialize: function () {
        //_.bindAll(this, 'render');
        this.render();
    },

    render: function () {
        this.$el.html(this.template);
        return this;
    },

    events: {
        'click .opensSidePanel': 'openSidePanel',
        'click #saveBtn': 'downloadGraphInFile',
        'click #openBtn': 'triggerClick',
        'change #uploadInput': 'openGraphFromFile'
    },

    openSidePanel: function (evt) {
        new SidePanel({model: this.model, page: evt.target.id});
    },

    downloadGraphInFile: function () {
        Utils.downloadFile(JSON.stringify(this.model.toJSON()), 'rest-graph.json');
    },

    triggerClick: function () {
        $('#uploadInput').trigger('click');
    },

    openGraphFromFile: function (event) {
        var self = this;
        var files = event.target.files;

        if(files) {
            var file = files[0];
            var reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = function (evt) {
                console.log('openGraphFromFile successful'); //: ' + evt.target.result);
                self.trigger('fileUploaded', {data: evt.target.result});
            };
            reader.onerror = function (evt) {
                console.log('error while reading uploaded file');
            }
        }
    }
});

module.exports = NavigationBarView;

