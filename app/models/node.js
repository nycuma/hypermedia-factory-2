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
    }, joint.shapes.basic.Rect.prototype.defaults),

    saveName: function(nameVal, namePrefix,isCustomName, customDescr) {
        this.prop('resourceName', {
            value: nameVal,
            prefix: namePrefix,
            isCustomName: isCustomName,
            customDescr: customDescr
        });
    },

    saveAttribute: function(attrVal, attrPrefix, isCustomAttr, customDescr) {
        var resourceAttrs = this.prop('resourceAttrs') || [];
        resourceAttrs.push({
            value: attrVal,
            prefix: attrPrefix,
            isCustomAttr: isCustomAttr,
            customDescr: customDescr
        });
        this.prop('resourceAttrs', resourceAttrs);
    },

    getStructuralType: function () {
        return this.prop('structuralType');
    },

    // the structural type is either 'collection', 'item' or null/undefined
    setStructuralType: function (structuralType) {
        this.prop('structuralType', structuralType);
        console.log('structural type set to: ' + this.prop('structuralType'));

        this.trigger('strucTypeChanged', {type: structuralType});
    }
});

module.exports = Node;
