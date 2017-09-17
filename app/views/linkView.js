/**
 * Created by Julian Richter on 08 Sep 2017
 */

'use strict';

var joint = require('jointjs');
var V = require('jointjs').V;
var RelationLink = require('../models/link');

joint.shapes.link = {};

joint.shapes.link.RelationLink = RelationLink;

joint.shapes.link.RelationLinkView = joint.dia.LinkView.extend({
    pointerdblclick: function(evt, x, y) {

        if(V(evt.target).hasClass('labelRect')) {
            console.log(' doubleclick on link label ');

            // get text of the label --> from cellview.model.label
            // on paper: cell:pointerdblclick: func(cellView, evt, x, y)

            // mimic a prompt and put it on top of current window
            // opacity: 0.95
            // with X to close window
            // on enter: close window
            // append div child element, remove it after closing
            // position: fixed
            // embedd in a BB view



            //var inputElement = V('<foreignObject width="100" height="50" requiredExtensions="http://www.w3.org/1999/xhtml"><body xmlns="http://www.w3.org/1999/xhtml"><input style="z-index: 20;" type="text" value="a value" /></body></foreignObject>');
            //V(evt.target).append(inputElement);
        }

    }
});


module.exports = joint.shapes.link;
