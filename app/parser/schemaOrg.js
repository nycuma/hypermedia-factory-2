/**
 * Created by Julian Richter on 10 Dec 2017
 */

'use strict';

var $ = require('jquery');
var N3 = require('n3');



function countTriples(store) {
    var count = store.countTriples('http://schema.org/ComicIssue', 'http://www.w3.org/2000/01/rdf-schema#subClassOf', null);
    console.log('COUNT: ' + count);
}


function parseTurtleFile(turtle) {

    var store = N3.Store();
    var parser = N3.Parser({ format: 'Turtle' });
    var countInCB = 0;


    // synchron
    var triples = parser.parse(turtle);
    triples.forEach(function (triple) {
        store.addTriple(triple.subject, triple.predicate, triple.object);
    });

    //var predicatesForSubject = store.getSubjects('http://schema.org/domainIncludes', 'http://schema.org/Person');
    //var superClassOfSubject = store.getObjects('http://schema.org/Person', 'http://www.w3.org/2000/01/rdf-schema#subClassOf');
    //var subjectsForPredicate = store.getObjects('http://schema.org/alumniOf', 'http://schema.org/domainIncludes');
    //var objectsForPredicate = store.getObjects('http://schema.org/alumniOf','http://schema.org/rangeIncludes');


    var subject = 'http://schema.org/MiddleSchool';

    function getTypeHierachy(type) {

        var superType1 = store.getObjects(type, 'http://www.w3.org/2000/01/rdf-schema#subClassOf');
        console.log('supertype: ' + superType1[0]);

        var superType2 = store.getObjects(superType1[0], 'http://www.w3.org/2000/01/rdf-schema#subClassOf');
        console.log('supertype: ' + superType2[0])
    }

    getTypeHierachy(subject);





    //var array = store.getTriples(null,'http://schema.org/domainIncludes','http://schema.org/Person');
/*
    array.forEach(function (triple) {
        console.log(triple.subject , triple.predicate, triple.object);
    });
*/
/*
    objectsForPredicate.forEach(function (elem) {
        console.log(elem);
    });
*/

    //Parse Turtle file asynchronously
    /*
    parser.parse(turtle,
        function (error, triple, prefixes) {
            if (triple) {

                store.addTriple(triple.subject, triple.predicate, triple.object);


                if (triple.subject == 'http://schema.org/Person' &&
                    triple.predicate == 'http://www.w3.org/2000/01/rdf-schema#subClassOf') {

                    console.log(triple.subject, triple.predicate, triple.object, '.');
                    countInCB++;
                    console.log('current count: ' + countInCB);
                }
            }
        });
        */
}



var getRDFTriples = function() {
//function getRDFTriples() {
    $.ajax({
        url: '../app/static/vocabs/schema.ttl',
        method: 'GET',
        dataType: 'text',
        success: function (data, textStatus, jqXHR) {
            console.log('sucessfully received Schema.org turtle file');

            parseTurtleFile(jqXHR.responseText);
        },
        error: function () {
            console.log('error while requesting Schema.org turtle file');

        }

    });
};




var getSubjects = function(property) {

    if(property) {
        //getSubjectsForProperty(property)
    } else {
        // get all subjects
    }


};

var getProperties = function(subject) {

    if(subject) {
        // getProperstiesForSubject(subject)

        // get props for a subject
        // get all props with domainIncludes <subject>
    } else {
        // get all props
    }


    
};

var getObjects = function(property) {
    
};





module.exports = {
    getRDFTriples: getRDFTriples
};


