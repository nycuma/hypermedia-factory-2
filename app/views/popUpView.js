/**
 * Created by Julian Richter on 21 Sep 2017
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
Backbone.$ = $;

var ImportView = Backbone.View.extend({
    el: '#popUpView',
    template: '<div class="close">x</div>\
               <h2 class ="headline-foregroundBox">Import from API specification</h2>\
            <form>\
                <select>\
                    <option value="spec1">OpenAPI</option>\
                    <option value="spec2">API Spec 2</option>\
                </select>\
                <button class="submit">Submit</button>\
                <textarea>Paste API specification here...</textarea>\
            </form>',

    initialize: function(){
        this.render();
    },

    events: {
        'click .close' : 'close'
    },

    render: function () {
        this.$el.addClass('foregroundBox');
        this.$el.html(this.template);
        return this;
    },

    submit: function () {

    },

    close: function () {
        this.$el.removeClass('foregroundBox');
        this.$el.empty();
        $('#sidePanel, #paper').css({'pointer-events': '', 'opacity': ''});
    }
});

module.exports = ImportView;

