/**
 * Created by Julian Richter on 03 Sep 2017
 */

'use strict';

var joint = require('jointjs');

var RelationLink = joint.dia.Link.extend({

    defaults: joint.util.deepSupplement({
        type: 'link.RelationLink',
        attrs: {
            '.connection': { stroke: '#404040', 'stroke-width': 2 },
            '.marker-target': { fill: '#404040', d: 'M 10 0 L 0 5 L 10 10 z' }
        },

        labelMarkup: '<g class="label"><rect/><text /></g>',
        labels: [{
            position: .4,
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

    renderLabelRelation: function () {
        this.prop('labels/1/attrs/text/text', this.prop('relation').value);
    },

    renderLabelOperations: function () {
        var methodLabel = this.prop('operations').reduce(function (a,b) {
            if(!a) return b.method;
            if(!b.method) return a;
            return a + ', ' + b.method;
        }, '');

        this.prop('labels/0/attrs/text/text', methodLabel);
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


    saveRelation: function(value, prefix, isCustom, customDescr) {

        value = isCustom ? this.getFormattedRel(value) : value;

        this.prop('relation', {
            value: value,
            prefix: prefix,
            isCustom: isCustom,
            customDescr: customDescr
        });

        this.renderLabelRelation()
    },

    saveOperation: function(method, value, prefix, isCustom, customDescr) {
        var operations = this.prop('operations') || [];

        if(value) { value = isCustom ? this.getFormattedOperation(value) : value; }

        operations.push({
            method: method,
            value: value,
            prefix: prefix,
            isCustom: isCustom,
            customDescr: customDescr
        });
        this.prop('operations', operations);

        this.renderLabelOperations();
    },

    // 1st letter lowercase, camelcase
    getFormattedRel: function (value) {
        value = value.charAt(0).toLowerCase() + value.slice(1);
        return this.getCamelCase(value);
    },

    // 1st letter uppercase, camelcase
    getFormattedOperation: function (value) {
        value = value.charAt(0).toUpperCase() + value.slice(1);
        return this.getCamelCase(value);
    },

    getCamelCase: function (value) {
        //TODO get camel case
        // remove spaces
        return value.replace(/\s/g, '');
    }
});


module.exports = RelationLink;

