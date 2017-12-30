/**
 * Created by Julian Richter on 17 Dec 2017
 */


'use strict';

var Backbone  = require('backbone');

// TODO all links in descriptions should open in new tab/window
var Term = Backbone.Model.extend({
    defaults: {
        value: '',
        prefix: '',
        label: '',
        descr: '',
        //superClasses: [],
        isRdfClass: false,
        isRdfProperty: false,
        isAction: false
    },

    initialize: function () {
        this.setLabel();
    },

    setLabel: function () {
        this.set('label', this.get('prefix') + ': ' + this.get('value'));
    }
});




module.exports = Term;
