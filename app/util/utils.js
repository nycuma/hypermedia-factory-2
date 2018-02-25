/**
 * Created by Julian Richter on 25 Feb 2018
 */

'use strict';

var $ = require('jquery');
var JSZip = require('jszip');
var FileSaver = require('file-saver');

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
        //console.log('checkIfCustom called. result: ' + typeof((element).attr('isCustom')));
        if($(element).attr('isCustom') === 'true') {
            return true;
        }
        return false;
    },

    // generates a text file, packages it in a zip file and let's the user download it
    downloadZip: function(fileName, content) {
        var zip = new JSZip();
        zip.file(fileName, content);
        zip.generateAsync({type:'blob'})
            .then(function(content) {
                FileSaver.saveAs(content, 'hydraAPI.zip');
            });
    }
};

module.exports = Utils;
