/**
 * Created by Julian Richter on 31 Aug 2017
 */
'use strict';

var Backbone = require('backbone');
var $ = require('jquery');
Backbone.$ = $;
var joint = require('jointjs');

//var Router = require('./routers/router');
var Paper;
Paper = require('./views/paper');
var SidePanel = require('./views/sidePanel');


$(document).ready(function() {
    console.log('start application');

    new SidePanel({});
    var graph = new joint.dia.Graph;
    new Paper({ model: graph });

/**
    var router = new Router();
    Backbone.history.start({
        pushState: true,
        root: '/'
    });
 */

});
