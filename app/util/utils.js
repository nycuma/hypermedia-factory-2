/**
 * Created by Julian Richter on 25 Feb 2018
 */

'use strict';

var $ = require('jquery');

var Utils = {

    getStringFromHTML: function(html) {
        var text = $('<p>'+html+'</p>').text(); // wrap as jQuery HTML and convert to text
        return text.replace(/\r?\n|\r|\t/g, ' '); // remove linebreaks and tabs
    },

    // insert line-break after 11 characters
    getLabelWithLineBreaks: function(label) {
        var i = 11;
        while(i < label.length) {
            label = label.substr(0, i) + ' ' + label.substr(i, label.length);
            i += 11;
        }
        return label;
    },

    // camelcase, 1st letter lowercase
    getCamelCase: function (value) {
        value = value.charAt(0).toLowerCase() + value.slice(1);
        return value.replace(/\s(.)/g, function(match, p1) {
            return p1.toUpperCase();
        });
    },

    // camelcase, 1st letter uppercase
    getCamelCaseFirstLetterUp: function (value) {
        value = this.getCamelCase(value);
        return value.charAt(0).toUpperCase() + value.slice(1);
    },

    // checks if a DOM elment has an 'isCutsom' attribute
    checkIfCustom: function (element) {
        //console.log('checkIfCustom called. result: ' + $(element).attr('isCustom'));
        return $(element).attr('isCustom');
    }
};

module.exports = Utils;
