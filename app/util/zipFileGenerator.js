/**
 * Created by Julian Richter on 04 Feb 2018
 */

'use strict';

var JSZip = require('jszip');
var FileSaver = require('file-saver');


var downloadZip = function(profileDocs) {
    console.log('downloadZip called');
    var zip = new JSZip();

    profileDocs.forEach(function(item){
        zip.file(item[0], item[1]);
    });

    zip.generateAsync({type:'blob'})
        .then(function(content) {
            FileSaver.saveAs(content, 'profiles.zip');
        });
};

var downloadZipTest = function(fileName, content) {
    var zip = new JSZip();
    zip.file(fileName, content);
    zip.generateAsync({type:'blob'})
        .then(function(content) {
            FileSaver.saveAs(content, 'profiles.zip');
        });
};


module.exports = {
    downloadZip: downloadZip,
    downloadZipTest: downloadZipTest
};