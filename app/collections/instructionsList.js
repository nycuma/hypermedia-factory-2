/**
 * Created by Julian Richter on 13 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var Instruction = require('../models/singleInstruction');

var InstructionsList = Backbone.Collection.extend({
    model: Instruction,
    // PRODUCTION: url: '../static/modelData/instructionsData.json',
    // DEV:
    url: '../hypermedia-factory-2/app/static/modelData/instructionsData.json',
    parse: function (data) {
        return data.items;
    }
});

module.exports = InstructionsList;
