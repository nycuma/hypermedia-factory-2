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

    addPropersties: function (newMethod, newUrl, newRel) {

        //console.log('adding props: ' + newMethod + ', ' + newUrl + ', ' + newRel);

        var stateTransisions = this.prop('stateTransitions') || [];

        stateTransisions.push({
            method: newMethod,
            url: newUrl,
            relation: newRel
        });

        this.prop('stateTransitions', stateTransisions);
        this.renderLinkLabels();
    },

    renderLinkLabels: function () {

        var stateTransisions = this.prop('stateTransitions');

        var methodLabel = stateTransisions.reduce(function (a,b) {
            if(!a) return b.method;
            if(!b.method) return a;
            return a + ', ' + b.method;
        }, '');

        var relLabel = stateTransisions.reduce(function (a,b) {
            if(!a) return b.relation;
            if(!b.relation) return a;
            return a + ', ' + b.relation;
        }, '');

        this.prop('labels/0/attrs/text/text', methodLabel);
        this.prop('labels/1/attrs/text/text', relLabel);
    },

    setStructuralTypeAtNodes: function() {

        var sourceNode = this.graph.getCell(this.get('source').id);
        sourceNode.setStructuralType('collection');

        var targetNode = this.graph.getCell(this.get('target').id);
        if(targetNode.getStructuralType() !== 'collection') {
            targetNode.setStructuralType('item');
        }


    },
    unsetStructuralTypeAtNodes: function() {

        var sourceNode = this.graph.getCell(this.get('source').id);
        sourceNode.setStructuralType(null);

        var targetNode = this.graph.getCell(this.get('target').id);
        targetNode.setStructuralType(null);

    }
});


module.exports = RelationLink;

