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
var EditResourceView = require('../views/editResourceView');

joint.shapes.html = {};

joint.shapes.html.Node = Node;

joint.shapes.html.NodeView = joint.dia.ElementView.extend({

    template: [
        '<div class="html-element">',
        '<button class="newLink">link</button>',
        '<button class="delete">x</button>',
        '<label></label>',
        '</div>'
    ].join(''),

    initialize: function() {
        this.startListeners();
        
        _.bindAll(this, 'updateBox');
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

        this.$box = $(_.template(this.template)());


        /**
        // Prevent paper from handling pointerdown.
        this.$box.find('input').on('mousedown click', function(evt) {
            evt.stopPropagation();
        });
         */

        // Open dialog box to edit properties
        this.$box.find('label').on('dblclick', _.bind(this.openEditBox, this.model));

        // Delete node
        this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model));

        // Display 'link' on mouse-over and add link on double-click
        this.$box.find('.newLink').mouseover(function () {
           $(this).css('color', '#265959');
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

    openEditBox: function () {
        new EditResourceView({ model: this });
    },

    removeBox: function() {
        this.$box.remove();
    },

    showLinkIncon: function () {

    },

    addLink: function () {
        this.setColorStructuralType('collection');

        var sourceID = this.model.get('id'); // ID of this node
        var posCorner = [ this.model.prop('position/x') + this.model.prop('size/width'),
                            this.model.prop('position/y') ];
        console.log('posCorner: ' + posCorner[0] + ' ' + posCorner[1]);
        this.paper.addLink(sourceID, posCorner);
    },

    // sets the background color of the node according to its
    // structural type ('collection' or 'item')
    setColorStructuralType: function(data) {
        console.log('entered node view setColorStructuralType');

        if(data.type == null) {
            $(this.$box).removeClass('item');
            $(this.$box).removeClass('collection');
        } else {
            $(this.$box).addClass(data.type); // add CSS class
        }

    },

    startListeners: function () {
        console.log('start listening');
        var model = this.model;
        //this.listenTo(model, 'change:position', this.onPositionCanged);
        this.listenTo(model, 'strucTypeChanged', this.setColorStructuralType);

    }
});

module.exports = joint.shapes.html;
