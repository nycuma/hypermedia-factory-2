/**
 * Created by Julian Richter on 21 Dec 2017
 */

'use strict';

var Backbone  = require('backbone');

var Prefix = Backbone.Model.extend({
    defaults: {
        IRI: '',
        shortPrefix: ''
    }
});

module.exports = Prefix;
