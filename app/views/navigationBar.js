/**
 * Created by Julian Richter on 09 Dec 2017
 */

/**
 * Created by Julian Richter on 12 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;
var SidePanel = require('./sidePanel');

var NavigationBarView = Backbone.View.extend({
    el: '#navigationBar',
    template: _.template($('#navigationBar-template').html()),

    initialize: function(){
        //_.bindAll(this, 'render');
        this.render();
    },

    render: function () {
        this.$el.html(this.template);
        return this;
    },

    events: {
        'click .navItem': 'openSidePanel'
    },

    openSidePanel: function (evt) {
        //var end = evt.target.id.length - 3;
        //new PopUpView({ subview : evt.target.id.substr(0, end) });
        new SidePanel({});
    }
});

module.exports = NavigationBarView;

