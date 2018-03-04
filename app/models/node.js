/**
 * Created by Julian Richter on 03 Sep 2017
 */

'use strict';

var joint = require('jointjs');
var Utils = require('../util/utils');

var Node = joint.shapes.basic.Rect.extend({
    defaults: joint.util.deepSupplement({
        type: 'html.Node',
        size: { width: 100, height: 60 },
        label: 'new resource',
        attrs: {
            rect: { stroke: 'none', 'fill-opacity': 0 }
        }
    }, joint.shapes.basic.Rect.prototype.defaults),

    saveName: function(nameVal, namePrefix, iri, isCustom, customDescr) {

        nameVal = isCustom ? Utils.getCamelCaseFirstLetterUp(nameVal) : nameVal;

        this.prop('resourceName', {
            value: nameVal,
            prefix: namePrefix,
            iri: iri,
            isCustom: isCustom,
            customDescr: customDescr
        });

        // update label on node
        this.set('label', Utils.getLabelWithLineBreaks(nameVal));
    },

    //TODO add custom identifier for value
    saveAttribute: function(attrVal, attrPrefix, iri, isCustom, customDescr, dataType, isReadonly) {

        attrVal = isCustom ? Utils.getCamelCase(attrVal) : attrVal;

        var resourceAttrs = this.prop('resourceAttrs') || [];
        resourceAttrs.push({
            value: attrVal,
            prefix: attrPrefix,
            iri: iri,
            isCustom: isCustom,
            customDescr: customDescr,
            dataType: dataType,
            isReadonly: isReadonly
        });
        this.prop('resourceAttrs', resourceAttrs);
    },

    getStructuralType: function () {
        return this.prop('structuralType');
    },

    // the structural type is either 'collection', 'item' or null/undefined
    setStructuralType: function (structuralType) {
        this.prop('structuralType', structuralType);
        console.log('structural type of node ' + this.prop('resourceName').value + ' set to: ' + this.prop('structuralType'));
        // trigger event to change view of source node
        this.trigger('strucTypeChanged', {type: structuralType});
    },

    getResourceNameVal: function () {
        if(this.prop('resourceName')) {
            return this.prop('resourceName').value;
        }
    },

    getResourceNamePrefix: function () {
        if(this.prop('resourceName')) {
            return this.prop('resourceName').prefix;
        }

    },

    getResourceNameIri: function () {
        if(this.prop('resourceName')) {
            return this.prop('resourceName').iri;
        }

    },

    getResourceAttrsValues: function() {
        if(this.prop('resourceAttrs')) {
            return this.prop('resourceAttrs').map(function(attr) {
                return attr.value;
            });
        }
    }
});

module.exports = Node;
