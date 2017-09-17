/**
 * Created by Julian Richter on 13 Sep 2017
 */

'use strict';

var Backbone  = require('backbone');

var SingleInstruction = Backbone.Model.extend({
    defaults: {
        title: '',
        explanation: 'This feature is coming soon...'
    }
});

module.exports = SingleInstruction;
