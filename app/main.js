/**
 * Created by Julian Richter on 31 Aug 2017
 */
'use strict';

var Backbone = require('backbone');
var $ = require('jquery');
Backbone.$ = $;
var joint = require('jointjs');
var SidePanel = require('./views/sidePanel');

var Paper = require('./views/paper');
var NavigationBar = require('./views/navigationBar');


$(document).ready(function() {
    console.log('start application');

    var graph = new joint.dia.Graph;
    var paper = new Paper({ model: graph });
    var navBar = new NavigationBar({model: graph});
    new SidePanel({page: 'welcome'});

    paper.listenTo(navBar, 'fileUploaded', paper.setNewGraph);


    //console.log(JSON.stringify(graph.toJSON()));
});
