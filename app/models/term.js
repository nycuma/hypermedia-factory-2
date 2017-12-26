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
        superClasses: [],
        isRdfClass: false,
        isRdfProperty: false,
        isAction: false
    }
});

     /*,
var RdfClass = Term.extend({
    prefix: '',
    superClasses: []

});

var RdfProperty = Term.extend({

});

var Action = Term.extend({

});

var NonRdfTerm = Term.extend({

});
*/


module.exports = Term;
