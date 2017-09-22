/**
 * Created by Julian Richter on 03 Sep 2017
 */

var joint = require('jointjs');
var V = require('jointjs').V;
var $ = require('jquery');
var Node = require('../views/nodeView').Node;
var StartNode = require('../models/startNode').StartNode;
var Link = require('../views/linkView').RelationLink;

joint.dia.CustomPaper = joint.dia.Paper.extend({

    el: $('#paper'),
    width: 600,
    height: 400,
    gridSize: 1,

    initialize: function() {
        joint.dia.Paper.prototype.initialize.apply(this, arguments);
        this.setEvents();
        this.initializeGraph();
        this.calculatePaperSize();
    },

    initializeGraph: function() {

        var start = new StartNode();

        var elCollection = new Node({
            position: { x: 15, y: 90 },
            label: 'CD Collection'
        });
        var elAlbum = new Node({
            position: { x: 230, y: 90 },
            label: 'Album'
        });
        var elTrack = new Node({
            position: { x: 480, y: 90 },
            label: 'Track'
        });
        var elArtist = new Node({
            position: { x: 230, y: 220 },
            label: 'Artist'
        });

        // Link from START to first resource
        var l1 = new joint.dia.Link({
            source: { id: start.id },
            target: { id: elCollection.id },
            attrs: { '.connection': { stroke: '#6a4848', 'stroke-width': 2 },
                '.marker-target': { fill: '#6a4848', d: 'M 10 0 L 0 5 L 10 10 z' }
            }
        });

        var l2 = new Link({
            source: { id: elCollection.id },
            target: { id: elAlbum.id }
        });
        l2.prop('labels/0/attrs/text/text', 'GET, POST');

        var l3 = new Link({
            source: { id: elAlbum.id },
            target: { id: elAlbum.id }
        });
        l3.set('vertices', [{ x: 240, y: 45 }, { x: 315, y: 45 }]);
        l3.prop('labels/0/attrs/text/text', 'PUT, DELETE');

        var l4 = new Link({
            source: { id: elAlbum.id },
            target: { id: elTrack.id }
        });
        l4.prop('labels/0/attrs/text/text', 'GET, POST');

        var l5 = new Link({
            source: { id: elAlbum.id },
            target: { id: elArtist.id }
        });
        l5.prop('labels/0/attrs/text/text', 'GET');

        var l6 = new Link({
            source: { id: elTrack.id },
            target: { id: elTrack.id }
        });
        l6.set('vertices', [{ x: 485, y: 45 }, { x: 565, y: 45 }]);
        l6.prop('labels/0/attrs/text/text', 'PUT, DELETE');

        var l7 = new Link({
            source: { id: elTrack.id },
            target: { id: elArtist.id }
        });
        l7.prop('labels/0/attrs/text/text', 'GET');

        this.model.addCells([start, elCollection, elAlbum, elTrack, elArtist, l1, l2, l3, l4, l5, l6, l7]);
    },

    calculatePaperSize: function () {
        // default: paper is as large as the viewport next to side panel
        var viewportX = $(window).width() - 235;
        var viewportY = $(window).height() - 20;

        var minSize = this.getPaperMinSize();
        this.setDimensions(Math.max(minSize[0], viewportX), Math.max(minSize[1], viewportY));
    },

    // calculates minimum size: the size required for all nodes and links to fit onto paper
    // checks position of all nodes and vertices on links
    // TODO: cache min/max values and update them when new nodes/Links are added (to avoid iterating over all nodes/links)
    getPaperMinSize: function() {
        var maxX = 0, maxY = 0;
        var cells = this.model.getCells();
        if(cells) {
            cells.forEach(function (cell) {
                if(cell.isLink()) {
                    if(cell.prop('vertices')) {
                        cell.prop('vertices').forEach(function (vertice) {
                            if(vertice.x > maxX) {
                                maxX = vertice.x;
                            }
                            if(vertice.y > maxY) {
                                maxY = vertice.y;
                            }
                        });
                    }
                } else { // Cell is a node
                    if(cell.prop('position/x') > maxX) {
                        maxX = cell.prop('position/x') + cell.prop('size/width');
                    }
                    if(cell.prop('position/y') > maxY) {
                        maxY = cell.prop('position/y') + cell.prop('size/height');
                    }
                }
            });
        }

        return [maxX+5, maxY+5];
    },

    setEvents: function () {
        this.on('blank:pointerdblclick', this.addNode);
        
        this.on('blank:pointerclick', function (evt, x, y) {
            console.log('point [' + x + ', ' + y + ']');
            //console.log(JSON.stringify(this.model.toJSON()));
        });

        $('#linkLabelId').dblclick(function () {
           console.log('double click on a label');

        });
    },

    addNode: function (evt, x, y) {
        var node = new Node({position: {x: x, y: y}});
        this.model.addCell(node);
        console.log('node added in position ' + x + ', ' + y);

        var svgEl = V('<defs id="v-4"></defs>');
        svgEl.append('<rect width="100" height="100" fill="black" />');
    },

    addLink: function (source, target) {
        var link = new Link({
            source: { id: source },
            target: { x: target[0]+50, y: target[1]-50 }
        });
        this.model.addCell(link);
        console.log('link added to node ' + source);
    }
});

module.exports = joint.dia.CustomPaper;

