/**
 * Created by Julian Richter on 17 Dec 2017
 */


'use strict';

var Backbone  = require('backbone');

//TODO create submodel extending supermodel
var Term = Backbone.Model.extend({
    defaults: {
        value: '',
        prefix: '',
        label: '',
        descr: '',
        rdfClass: false,
        rdfProperty: false,
        action: false,
        superClasses: []
    },

    initialize: function () {
        //this.set({label: this.prefix + ':' + this.value});
        //console.log('set label: ' + this.label);
    }


    /*,


    parse: function (response) {
        if (response.data) {
            return response.data;
        }
        return response;
    }*/

});

module.exports = Term;
