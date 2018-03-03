/**
 * Created by Julian Richter on 12 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;

var WelcomeView = require('./navItems/welcomeView');
var AboutView = require('./navItems/aboutView');
var DownloadView = require('./navItems/downloadView');
var HelpView = require('./navItems/helpView');

var SidePanelView = Backbone.View.extend({
    el: '#sidePanel',
    template: _.template($('#sidePanel-template').html()),

    initialize: function(options){
        //_.bindAll(this, 'render');
        this.options = options;
        this.render();
    },

    render: function () {
        this.$el.html(this.template);

        switch (this.options.page) {
            case 'welcome' : new WelcomeView({}); break;
            case 'aboutBtn' : new AboutView({}); break;
            case 'downloadBtn' : new DownloadView({model: this.model}); break;
            case 'helpBtn' : new HelpView({}); break;
        }
        this.$el.fadeIn(200);
    },

    events: {
        'click #sidePanelCloseBtn': 'close'
    },

    close: function () {
        this.$el.fadeOut(200);
        this.$el.empty();
    }


});

module.exports = SidePanelView;
