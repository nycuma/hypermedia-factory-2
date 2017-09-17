/**
 * Created by Julian Richter on 03 Sep 2017
 */

'use strict';

var joint = require('jointjs');

var Node = joint.shapes.basic.Rect.extend({
    defaults: joint.util.deepSupplement({
        type: 'html.Node',
        size: { width: 100, height: 60 },
        label: 'new resource',
        attrs: {
            rect: { stroke: 'none', 'fill-opacity': 0 }
        }
    }, joint.shapes.basic.Rect.prototype.defaults)
});

module.exports = Node;
