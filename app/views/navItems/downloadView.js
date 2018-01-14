/**
 * Created by Julian Richter on 22 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var JSZip = require("jszip");
var FileSaver = require('file-saver');

var DownloadView = Backbone.View.extend({
    el: '#sidePanelContent',
    template:  _.template($('#download-template').html()),

    initialize: function(){
        this.render();
    },

    events: {
        'click .submitBtn': 'submit',
        'click #btnTestZipFile' : 'downloadZip'
    },

    render: function () {
        this.$el.html(this.template);
        return this;
    },

    submit: function (evt) {
        evt.preventDefault();
    },

    downloadZip: function () {
        console.log('downloadZip called');

        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n\tA tab\n\t\ttwo tabs");
        zip.file("folder/Hello2.txt", "Hello 2");
        zip.generateAsync({type:"blob"})
            .then(function(content) {
                FileSaver.saveAs(content, "example2.zip");
            });
    }
});

module.exports = DownloadView;