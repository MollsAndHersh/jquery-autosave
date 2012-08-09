/*
jQuery.autosave v2.0.0-rc1
https://github.com/kflorence/jquery-autosave/
Periodically saves form data based on a set of critera.

Inspired by the jQuery.autosave plugin written by Raymond Julin,
Mads Erik Forberg and Simen Graaten.

Dual licensed under the MIT and BSD Licenses.
*/

(function( $, undefined ) {

var handlerTypes = [ "trigger", "scope", "data", "condition", "store" ],
    inputChangeEvents = [ "change", "keyup" ],
    uuid = 0;

function Handler( settings ) {
    $.extend( this, settings );
    this.uuid = ++uuid;
}

Handler.prototype = {
    options: {},
    setup: function() {},
    run: function() {},
    teardown: function() {}
};

$.widget( "kf.autosave", {
    version: "2.0.0-rc1",

    options: {
        ignore: ":hidden",

        // Triggers
        trigger: "interval",
        scope: "all",
        data: "serialize",
        condition: "changed",
        store: "ajax",

        // Callbacks
        change: null,
        complete: null
    },

    _create: function() {
        var form,
            element = this.element;

        if ( element.is( "form" ) ) {
            form = element;

        } else if ( !( form = element.find( "form" ) ).length ) {
            form = element.closest( "form" );
        }

        if ( !( this.form = form ).length ) {
            throw "Unable to locate form!";
        }

        $.each( inputChangeEvents, $.proxy(function( i, eventName ) {
            element.on( eventName + this.eventNamespace, ":input", $.proxy( this._change, this ) );
        }, this ));

        // Internal handlers cache
        this._handlers = {};
    },

    // FIXME: https://github.com/nervetattoo/jquery-autosave/issues/18
    _change: function( event ) {
        var target = $( event.target );

        if ( !target.hasClass( this.options.ignore ) ) {
            target.addClass( this.widgetFullName + "-changed" );
            this.element._trigger( "change", event );
        }
    },

    destroy: function() {
        this.interval();

        this.element
            .off( this.eventNamespace )
            .find( ":input" ).removeClass( this.widgetFullName + "-changed" );

        $.Widget.prototype.destroy.call( this );
    },

    // { name: "name", type: "type", options: {}, setup: function(){}, teardown: function(){} }
    // [ handlers ]
    _resolveHandler: function( handler ) {
        var handler = {},
            type = typeof handler;

        // TODO
    },

    _save: function() {
        // TODO
    },

    _setOption: function( key, value ) {
        var handler;

        if ( $.inArray( key, handlerTypes ) ) {

            // TODO: promise pattern?
            this.removeHandler( this.handlers[ key ] );
            this.addHandler( value );
        }

        $.Widget.prototype._setOption.apply( this, arguments );
    },

    // TODO: promise pattern?
    addHandler: function( handler ) {
        $.each( this._resolveHandler( handler ), $.proxy(function( i, handler ) {
            handler.setup.call( this, handler.options );
            this._handlers[ handler.uuid ] = handler;
        }, this ));
    },

    interval: function( interval, callback ) {
        if ( this.timer ) {
            clearTimeout( this.timer );
            this.timer = null;
        }

        if ( !isNaN( parseInt( interval ) ) &&  $.isFunction( callback ) ) {
            this.timer = setTimeout( $.proxy( callback, this ), interval );
        }
    },

    // TODO: promise pattern?
    removeHandler: function( handler ) {
        $.each( this._resolveHandler( handler ), $.proxy(function( i, handler ) {
            handler.teardown.call( this, handler.options );
            delete this._handlers[ handler.uuid ];
        }, this ));
    }
});

// Public handler cache
$.kf.handlers = {};

})( jQuery );
