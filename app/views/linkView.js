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

});


module.exports = joint.shapes.link;
