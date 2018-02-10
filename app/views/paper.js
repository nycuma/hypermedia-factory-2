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
        var elCollection = this.createNodeForDemo(15, 90, 'RecordCollection', undefined, '{myURL}/vocab#RecordCollection', true, 'A collection of music records');
        var elAlbum = this.createNodeForDemo(230, 90, 'MusicAlbum', 'schema', 'http://schema.org/MusicAlbum');
        var elTrack = this.createNodeForDemo(480, 90, 'MusicRecording', 'schema', 'http://schema.org/MusicRecording');
        var elArtist = this.createNodeForDemo(230, 220, 'MusicGroup', 'schema', 'http://schema.org/MusicGroup');

        // Links
        var l1 = this.createStartLink(start.id, elCollection.id);

        var l2 = this.createLinkForDemo(elCollection.id, elAlbum.id, 'item', 'IANA');
        l2.saveOperation('RETRIEVE', 'ReadAction', 'schema', 'http://schema.org/ReadAction');
        l2.saveOperation('CREATE', 'AddAction', 'schema', 'http://schema.org/AddAction');

        var l3 = this.createLinkForDemo(elAlbum.id, elAlbum.id);
        l3.set('vertices', [{ x: 240, y: 45 }, { x: 315, y: 45 }]);
        l3.saveOperation('REPLACE', 'UpdateAction', 'schema', 'http://schema.org/UpdateAction');
        l3.saveOperation('DELETE', 'DeleteAction', 'schema', 'http://schema.org/DeleteAction');

        var l4 = this.createLinkForDemo(elAlbum.id, elTrack.id, 'track', 'schema', 'http://schema.org/track');
        l4.saveOperation('RETRIEVE', 'ReadAction', 'schema', 'http://schema.org/ReadAction');
        l4.saveOperation('CREATE', 'AddAction', 'schema', 'http://schema.org/AddAction');

        var l5 = this.createLinkForDemo(elAlbum.id, elArtist.id, 'byArtist', 'schema', 'http://schema.org/byArtist');
        l5.saveOperation('RETRIEVE', 'ReadAction', 'schema', 'http://schema.org/ReadAction');

        var l6 = this.createLinkForDemo(elTrack.id, elTrack.id);
        l6.set('vertices', [{ x: 485, y: 45 }, { x: 565, y: 45 }]);
        l6.saveOperation('REPLACE', 'UpdateAction', 'schema', 'http://schema.org/UpdateAction');
        l6.saveOperation('DELETE', 'DeleteAction', 'schema', 'http://schema.org/DeleteAction');

        var l7 = this.createLinkForDemo(elTrack.id, elArtist.id, 'byArtist', 'schema', 'http://schema.org/byArtist');
        l7.saveOperation('RETRIEVE', 'ReadAction', 'schema', 'http://schema.org/ReadAction');

        this.model.addCells([start, elCollection, elAlbum, elTrack, elArtist, l1, l2, l3, l4, l5, l6, l7]);

        elCollection.setStructuralType('collection');
        elAlbum.setStructuralType('collection');
        l2.prop('isCollItemLink', true);
        l4.prop('isCollItemLink', true);
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
                if(cellView.model.isLink()) {
                    // TODO: don't display collItemLinkCheckBox if soure node == target node
                    //var isSelfReference = cellView.model.get('source').id == cellView.model.get('target').id;
                    // inform link model
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
        link.saveOperation('RETRIEVE', 'ReadAction', 'schema', 'http://schema.org/ReadAction');
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

    createNodeForDemo: function (x, y, label, prefix, iri, isCustom, customDescr) {
        var node = new Node({
            position: { x: x, y: y },
            label: label
        });
        node.saveName(label, prefix, iri, isCustom, customDescr);
        return node;
    },

    createLinkForDemo: function (sourceId, targetId, value, prefix, iri, isCustom, customDescr) {
        var link = new Link({
            source: { id: sourceId },
            target: { id: targetId }
        });
        link.saveRelation(value, prefix, iri, isCustom, customDescr);
        return link;
    }
});

module.exports = joint.dia.CustomPaper;

