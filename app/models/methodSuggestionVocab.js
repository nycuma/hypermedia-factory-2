/**
 * Created by Julian Richter on 23 Feb 2018
 */

'use strict';

var Backbone  = require('backbone');

/**
 * Saves the method suggestions for a single vocabulary
 */
var MethodSuggestionVocab = Backbone.Model.extend({
    defaults: {
        vocabPrefix: '',
        vocabPrefixIri: '',
        methods: {} // an object carrying the available and default methods for each relation or action
    }
});

module.exports = MethodSuggestionVocab;

