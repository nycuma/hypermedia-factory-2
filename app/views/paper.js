/**
 * Created by Julian Richter on 03 Sep 2017
 */

var joint = require('jointjs');
var V = require('jointjs').V;
var $ = require('jquery');
var Node = require('../views/nodeView').Node;
var StartNode = require('../models/startNode').StartNode;
var Link = require('../views/linkView').RelationLink;
var EditLinkView = require('../views/editLinkView');
var EditResourceView = require('../views/editResourceView');

joint.dia.CustomPaper = joint.dia.Paper.extend({

    el: $('#paper'),
    width: 600,
    height: 400,
    gridSize: 1,

    initialize: function() {
        joint.dia.Paper.prototype.initialize.apply(this, arguments);
        this.setEvents();
        this.initializeGraph(); // Demo graph
        this.calculatePaperSize();
    },

    initializeGraph: function() {

        // Nodes
        var start = new StartNode();
        var elCollection = this.createNodeForDemo(15, 90, 'Record Collection');
        var elAlbum = this.createNodeForDemo(230, 90, 'MusicAlbum', 'schema');
        var elTrack = this.createNodeForDemo(480, 90, 'MusicRecording', 'schema');
        var elArtist = this.createNodeForDemo(230, 220, 'MusicGroup', 'schema');

        // Links
        var l1 = this.createStartLink(start.id, elCollection.id);

        var l2 = this.createLinkForDemo(elCollection.id, elAlbum.id);
        //l2.addPropersties('GET', '/test/1', 'relation1');
        //l2.addPropersties('POST', '/test/2', 'relation2');

        var l3 = this.createLinkForDemo(elAlbum.id, elAlbum.id);
        l3.set('vertices', [{ x: 240, y: 45 }, { x: 315, y: 45 }]);
        //l3.addPropersties('PUT', 'test/1', 'relation1');
        //l3.addPropersties('DELETE', 'test/2', 'relation2');

        var l4 = this.createLinkForDemo(elAlbum.id, elTrack.id);
        //l4.addPropersties('GET', '/test/1', 'relation1');
        //l4.addPropersties('POST', '/test/2', 'relation2');

        var l5 = this.createLinkForDemo(elAlbum.id, elArtist.id);
        //l5.addPropersties('GET', '/test/1', 'relation1');

        var l6 = this.createLinkForDemo(elTrack.id, elTrack.id);
        //l6.set('vertices', [{ x: 485, y: 45 }, { x: 565, y: 45 }]);
        //l6.addPropersties('PUT', 'test/1', 'relation1');
        //l6.addPropersties('DELETE', 'test/2', 'relation2');

        var l7 = this.createLinkForDemo(elTrack.id, elArtist.id);
        //l7.addPropersties('GET', '/test/1', 'relation1');

        this.model.addCells([start, elCollection, elAlbum, elTrack, elArtist, l1, l2, l3, l4, l5, l6, l7]);
    },

    calculatePaperSize: function () {
        // default: paper is as large as the viewport next to side panel
        var viewportX = $(window).width() - 15;
        var viewportY = $(window).height() - 70;

        var minSize = this.getPaperMinSize();
        this.setDimensions(Math.max(minSize[0], viewportX), Math.max(minSize[1], viewportY));
    },

    // calculates minimum size: the size required for all nodes and links to fit onto paper
    // checks position of all nodes and vertices on links
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

        this.on('cell:pointerdblclick',
            function(cellView, evt, x, y) {
                if(cellView.model.isLink() /* && cellView.model.id != l1.model.id */) {
                    new EditLinkView({ model: cellView.model });
                }
                if(cellView.model.isElement()) {
                    new EditResourceView({ model: cellView.model });
                }
            }
        );

        $('#linkLabelId').dblclick(function () {
           console.log('double click on a label');

        });
    },

    addNode: function (evt, x, y) {
        var node = new Node({position: {x: x, y: y}});
        this.model.addCell(node);
        console.log('node added in position ' + x + ', ' + y);
    },

    addLink: function (source, target) {
        var link = new Link({
            source: { id: source },
            target: { x: target[0]+50, y: target[1]+50 }
        });
        this.model.addCell(link);
        console.log('link added to node ' + source);
    },

    createStartLink: function (sourceId, targetId) {
        return new joint.dia.Link({
            source: { id: sourceId },
            target: { id: targetId },
            attrs: { '.connection': { stroke: '#404040', 'stroke-width': 2 },
                '.marker-target': { fill: '#404040', d: 'M 10 0 L 0 5 L 10 10 z' }
            }
        });

    },

    createNodeForDemo: function (x, y, label, prefix) {
        var node = new Node({
            position: { x: x, y: y },
            label: label
        });
        node.saveName(label, prefix);
        return node;
    },

    createLinkForDemo: function (sourceId, targetId) {
       return new Link({
            source: { id: sourceId },
            target: { id: targetId }
        });
    }
});

module.exports = joint.dia.CustomPaper;

