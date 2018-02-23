/**
 * Created by Julian Richter on 23 Feb 2018
 */

'use strict';

var Backbone = require('backbone');
var MethodSuggestionVocab = require('../models/methodSuggestionVocab');

var MethodSuggestions = Backbone.Collection.extend({
    model: MethodSuggestionVocab,
    // PRODUCTION: url: '../modelData/methodSuggestions.json',
    // DEV:
    url: '../app/modelData/methodSuggestions.json',

    initialize: function () {
        this.fetch({parse: true});

    },

    parse: function (data) {
        console.log('parsing method suggestions');

        data.vocabularies.forEach(_.bind(function(vocab) {
            var vocabKey = Object.keys(vocab)[0];
            this.add(new MethodSuggestionVocab({
                vocabPrefix: vocabKey,
                methods: vocab[vocabKey]
            }));
        }, this));

        return this.models;
    },


    getMethodSuggestion: function(value, prefix) {
        var model = this.findWhere({vocabPrefix: prefix});
        //console.log('getMethodSuggestions val: ' + model.get('methods')[value]);
        return model.get('methods')[value];
    }
});

module.exports = new MethodSuggestions();
