/**
 * Created by Julian Richter on 03 Sep 2017
 */

'use strict';

var joint = require('jointjs');

var RelationLink = joint.dia.Link.extend({

    defaults: joint.util.deepSupplement({
        type: 'link.RelationLink',
        attrs: {
            '.connection': { stroke: '#6a4848', 'stroke-width': 2 },
            '.marker-target': { fill: '#6a4848', d: 'M 10 0 L 0 5 L 10 10 z' }
        },

        labelMarkup: '<g class="label"><rect class="labelRect" /><text /></g>',
        labels: [{
            position: .4,
            attrs: {
                rect: { fill: '#f5f5ef', 'fill-opacity': .8 },
                text: {
                    text: 'GET', 'color': '#6a4848', 'font-family': 'Verdana, Geneva, sans-serif',
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
                        text: 'relation',
                        'color': '#6a4848', 'font-family': 'Verdana, Geneva, sans-serif',
                        'font-weight': 'normal', 'font-size': '10px',
                        'transform': 'matrix(1,0,0,1,0,7)'
                    }
                }
            }
        ]
    }, joint.dia.Link.prototype.defaults)
});


module.exports = RelationLink;

