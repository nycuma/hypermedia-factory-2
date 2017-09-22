/**
 * Created by Julian Richter on 08 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var $ = require('jquery');
Backbone.$ = $;
var joint = require('jointjs');
var _ = require('underscore');
var Node = require('../models/node');

joint.shapes.html = {};

joint.shapes.html.Node = Node;

joint.shapes.html.NodeView = joint.dia.ElementView.extend({

    template: [
        '<div class="html-element">',
        '<button class="newLink">link</button>',
        '<button class="delete">x</button>',
        '<label></label>',
        '<input type="text" class="nodeInput" maxlength="30"/>',
        '</div>'
    ].join(''),

    initialize: function() {
        _.bindAll(this, 'updateBox');
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

        this.$box = $(_.template(this.template)());

        // Prevent paper from handling pointerdown.
        this.$box.find('input').on('mousedown click', function(evt) {
            evt.stopPropagation();
        });

        // update label when user hits Enter on input
        this.$box.find('input').on('keypress', _.bind(this.checkKeyAndUpdateLabel, this));
        this.$box.find('input').on('blur', _.bind(this.updateLabel, this));

        // Display input field on double-clicks on label
        this.$box.find('label').on('dblclick', _.bind(this.displayInputField, this));

        // Delete node
        this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model));

        // Display 'link' on mouse-over and add link on double-click
        this.$box.find('.newLink').mouseover(function () {
           $(this).css('color', '#6a4848');
        });
        this.$box.find('.newLink').mouseleave(function () {
            $(this).css('color', 'transparent');
        });
        this.$box.find('.newLink').on('dblclick', _.bind(this.addLink, this));

        // Update the box position whenever the underlying model changes.
        this.model.on('change', this.updateBox, this);
        // Remove the box when the model gets removed from the graph.
        this.model.on('remove', this.removeBox, this);

        this.updateBox();
    },
    render: function() {
        joint.dia.ElementView.prototype.render.apply(this, arguments);
        this.paper.$el.prepend(this.$box);
        this.updateBox();
        return this;
    },

    updateBox: function() {
        // Set the position and dimension of the box so that it covers the JointJS element.
        var bbox = this.model.getBBox();
        // Example of updating the HTML with a data stored in the cell model.
        this.$box.find('label').text(this.model.get('label'));
        this.$box.css({
            width: bbox.width,
            height: bbox.height,
            left: bbox.x,
            top: bbox.y,
            transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)'
        });
    },
    displayInputField: function () {
        var label = this.model.get('label');
        this.$box.find('input').val(label);
        this.$box.find('input').show();
        this.$box.find('label').hide();
    },
    checkKeyAndUpdateLabel: function (evt) {
        if(evt.which == 13){ // Enter key
            this.updateLabel(evt);
        }
    },
    updateLabel: function (evt) {
        var newLabel = $(evt.target).val().trim();

        if(newLabel) {
            if(newLabel.length > 30) {
                newLabel = newLabel.substring(0, 30);
            }
            this.$box.find('input').hide();
            this.model.set('label', newLabel);
            this.$box.find('label').show();
        } else { // display old label if string is empty
            this.$box.find('input').hide();
            this.$box.find('label').show();
        }
    },
    removeBox: function() {
        this.$box.remove();
    },

    showLinkIncon: function () {

    },

    addLink: function () {
        var sourceID = this.model.get('id');
        var posCorner = [ this.model.prop('position/x') + this.model.prop('size/width'),
                            this.model.prop('position/y') ];
        console.log('posCorner: ' + posCorner[0] + ' ' + posCorner[1]);
        this.paper.addLink(sourceID, posCorner);
    }
});

module.exports = joint.shapes.html;
