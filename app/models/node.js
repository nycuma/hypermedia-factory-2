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

    saveName: function(nameVal, namePrefix, iri, isCustom, customDescr) {

        nameVal = isCustom ? this.getFormattedResName(nameVal) : nameVal;

        this.prop('resourceName', {
            value: nameVal,
            prefix: namePrefix,
            iri: iri,
            isCustom: isCustom,
            customDescr: customDescr
        });

        // update label on node
        this.set('label', this.getLabelWithLineBreaks(nameVal));
    },

    //TODO add custom identifier for value
    saveAttribute: function(attrVal, attrPrefix, iri, isCustom, customDescr) {

        attrVal = isCustom ? this.getFormattedAttr(attrVal) : attrVal;

        var resourceAttrs = this.prop('resourceAttrs') || [];
        resourceAttrs.push({
            value: attrVal,
            prefix: attrPrefix,
            iri: iri,
            isCustom: isCustom,
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

    // insert line-break after 11 characters
    getLabelWithLineBreaks: function(label) {
        var i = 11;
        while(i < label.length) {
            label = label.substr(0, i) + ' ' + label.substr(i, label.length);
            i += 11;
        }
        return label;
    },

    // 1st letter lowercase, camelcase
    getFormattedAttr: function (value) {
        value = value.charAt(0).toLowerCase() + value.slice(1);
        return this.getCamelCase(value);
    },

    // 1st letter uppercase, camelcase
    getFormattedResName: function (value) {
        value = value.charAt(0).toUpperCase() + value.slice(1);
        return this.getCamelCase(value);
    },

    getCamelCase: function (value) {
        //TODO get camel case
        // remove spaces
        value = value.replace(/\s/g, '');
        return value;
    }


});

module.exports = Node;
