/**
 * Created by Julian Richter on 11 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;

var InstructionView = Backbone.View.extend({
    tagName: 'div',
    template: _.template('<h3><%= title %></h3>\
                          <p><%= explanation %></p>'),

    render: function(){
        this.$el.html(this.template(this.model.toJSON()));
        //this.detail = this.$('.instruction-detail');
        return this;
    }

    /*
    events: {
        'click .instruction-title' : 'showInstrDetail'
    },
    showInstrDetail: function () {
        this.detail.toggle();
    }
    */
});

module.exports = InstructionView;
