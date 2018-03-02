/**
 * Created by Julian Richter on 03 Sep 2017
 */

'use strict';

var $ = require('jquery');
var joint = require('jointjs');
var Utils = require('../util/utils');

var RelationLink = joint.dia.Link.extend({

    defaults: joint.util.deepSupplement({
        type: 'link.RelationLink',
        attrs: {
            '.connection': { stroke: '#404040', 'stroke-width': 2 },
            '.marker-target': { fill: '#404040', d: 'M 10 0 L 0 5 L 10 10 z' }
        },

        labelMarkup: '<g class="label"><rect/><text /></g>',
        labels: [{
            position: .3,
            attrs: {
                rect: { fill: '#f5f5ef', 'fill-opacity': .8 },
                text: {
                    text: '', 'color': '#404040', 'font-family': 'Verdana, Geneva, sans-serif',
                    'font-weight': 'bold', 'font-size': '10px',
                    'transform': 'matrix(1,0,0,1,0,-8)'
                }
            }
        },
            {
                position: .6,
                attrs: {
                    rect: { fill: '#f5f5ef', 'fill-opacity': .8 },
                    text: {
                        text: '',
                        'color': '#404040', 'font-family': 'Verdana, Geneva, sans-serif',
                        'font-weight': 'normal', 'font-size': '10px',
                        'transform': 'matrix(1,0,0,1,0,7)'
                    }
                }
            }
        ]
    }, joint.dia.Link.prototype.defaults),

    initialize: function () {
        joint.dia.Link.prototype.initialize.apply(this, arguments);
        //this.on('change:source', _.bind(this.changedSourceHandler, this));
    },
    changedSourceHandler: function (evt) {
        var newSourceNode = this.graph.getCell(this.get('source').id);
        if(newSourceNode && newSourceNode.get('type') === 'custom.StartNode') {
            this.prop('labels', []);
        }
    },

    renderLabelRelations: function () {

        if(this.prop('operations')) {
            var relationLabel = this.prop('operations').reduce(function (a,b) {
                if(!a) return b.value;
                if(!b.value) return a;
                return a + ', ' + b.value;
            }, '');
            this.prop('labels/1/attrs/text/text', relationLabel);
        }
    },

    renderLabelOperations: function () {
        var methodLabel = this.prop('operations').reduce(function (a,b) {
            if(!a) return b.method;
            if(!b.method) return a;
            return a + ', ' + b.method;
        }, '');

        this.prop('labels/0/attrs/text/text', methodLabel);
    },

    setLabelAsEmbedded: function () {
        this.prop('labels/0/attrs/text/text', '');
        this.prop('labels/1/attrs/text/text', 'embedded');
    },

    // TODO merge setStructuralTypeAtNodes and unsetStructuralTypeAtNodes
    setStructuralTypeAtNodes: function() {

        var sourceNode = this.getSourceNode();
        var targetNode = this.getTargetNode();

        if(sourceNode && targetNode && (sourceNode != targetNode)) {
            sourceNode.setStructuralType('collection');

            if(targetNode.getStructuralType() !== 'collection') {
                targetNode.setStructuralType('item');
            }
        }
    },
    unsetStructuralTypeAtNodes: function() {

        var sourceNode = this.getSourceNode();
        var targetNode = this.getTargetNode();

        if(sourceNode && targetNode) {
            sourceNode.setStructuralType(null);
            targetNode.setStructuralType(null);
        }
    },

    getSourceNode: function () {
        return this.graph.getCell(this.get('source').id);
    },

    getTargetNode: function () {
        return this.graph.getCell(this.get('target').id);
    },

    saveLink: function(method, value, prefix, iri, isCustom, customDescr, actionValue, actionPrefix, actionIri) {
        var operations = this.prop('operations') || [];

        value = isCustom ? Utils.getCamelCase(value) : value;

        operations.push({
            method: method,
            value: value, // relation value
            iri: iri, // relation IRI
            prefix: prefix, // relation prefix
            isCustom: isCustom, // applies to relation
            customDescr: customDescr, // applies to relation
            actionValue: actionValue,
            actionPrefix: actionPrefix,
            actionIri: actionIri
        });
        this.prop('operations', operations);

        this.renderLabelOperations();
        this.renderLabelRelations();

    },

    retrieveOperationExists: function () {
        var operations = this.prop('operations');

        if(operations) {
            operations.forEach(function(op) {
                if(op.method === 'RETRIEVE') return op;
            });
        }
        return false;
    },

    addOperation: function(operation) {
        var operations = this.prop('operations') || [];
        operations.push(operation);
    }
});


module.exports = RelationLink;

