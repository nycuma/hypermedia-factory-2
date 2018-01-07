/**
 * Created by Julian Richter on 03 Sep 2017
 */

'use strict';

var joint = require('jointjs');

joint.shapes.custom = {};

joint.shapes.custom.StartNode = joint.shapes.basic.Rect.extend({
    defaults: joint.util.deepSupplement({
        type: 'custom.StartNode',
        size: { width: 50, height: 30 },
        position: { x: 40, y: 15 },
        attrs: {
            rect: { fill: '#6a4848', 'stroke-width': 0 },
            text: {
                text: 'START', fill: '#f5f5ef',
                'font-size': 12,
                'font-weight': 'bold',
                'font-family': 'Menlo, Monaco, Consolas, "Courier New", monospace'
            }
        }
    }, joint.shapes.basic.Rect.prototype.defaults)
});

module.exports = joint.shapes.custom;
