/*
jQuery.autosave v2.0.0-rc1
https://github.com/kflorence/jquery-autosave/
Periodically saves form data based on a set of critera.

Requires:
 - jQuery 1.7.0+
 - jQuery UI Widget 1.8.0+

Inspired by the jQuery.autosave plugin written by Raymond Julin,
Mads Erik Forberg and Simen Graaten.

Copyright (C) 2012 Kyle Florence
Dual licensed under the MIT and BSD licenses.
*/

(function( $, undefined ) {

var handlerTypes = [ "trigger", "scope", "data", "condition", "store" ],
    inputChangeEvents = [ "change", "keyup" ],
    namespace = "kf",
    uuid = 0,
    widgetName = "autosave";

// https://gist.github.com/3507025
var getType = (function() {
    var rFunctionName = /function ([^(]+)/;

    return function( object ) {
        var matches,
            type = $.type( object );

        if ( type == "object" ) {
            matches = rFunctionName.exec( object.constructor.toString() );

            if ( matches && matches.length > 1 ) {
                type = matches[ 1 ].toLowerCase();
            }
        }

        return type;
    }
}());

$.widget( namespace + "." + widgetName, {
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

    _error: function( message ) {
        throw new Error( "(" + widgetName + ") " + message );
    },

    _resolveHandler: function( handler ) {
        var resolved = {},
            type = typeof handler;

        // Shortcut for { run: function() {} }
        if ( type == "function" ) {
            resolved.run = handler;

        // The name of a public handler
        } else if ( type == "string" ) {
            resolved = _handlers[ handler ];

        // A Handler object or the settings for a new Handler object
        } else if ( type == "object" ) {
            resolved = handler;
        }

        if ( $.isPlainObject( resolved ) && $.isFunction( resolved.run ) ) {
            resolved = new Handler( resolved );

        } else if ( !resolved || !isHandler( resolved ) || !$.isFunction( resolved.run ) ) {
            this._error( "Invalid handler" );
        }

        return resolved;
    },

    _resolveHandlers: function( handlers ) {
        var resolved = [];

        if ( !$.isArray( handlers ) ) {
            handlers = [ handlers ];
        }

        $.each( handlers, $.proxy(function( i, handler ) {
            resolved.push( this._resolveHandler( handler ) );
        }, this ));

        return resolved;
    },

    _save: function() {
        // TODO
    },

    _setOption: function( key, value ) {
        var handler;

        if ( $.inArray( key, handlerTypes ) ) {

            // TODO: use promise pattern
            this.removeHandler( this.handlers[ key ] );
            this.addHandler( value );
        }

        $.Widget.prototype._setOption.apply( this, arguments );
    },

    // TODO: use promise pattern
    addHandler: function( handler ) {
        $.each( this._resolveHandlers( handler ), $.proxy(function( i, handler ) {
            if ( handler.setup.call( this, handler.options ) !== false ) {
                this._handlers[ handler.uuid = ++uuid ] = handler;
            }
        }, this ));
    },

    destroy: function() {
        this.interval();

        this.element
            .off( this.eventNamespace )
            .find( ":input" ).removeClass( this.widgetFullName + "-changed" );

        $.Widget.prototype.destroy.call( this );
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

    // TODO: use promise pattern
    removeHandler: function( handler ) {
        $.each( this._resolveHandler( handler ), $.proxy(function( i, handler ) {
            if ( handler.teardown.call( this, handler.options ) !== false ) {
                delete this._handlers[ handler.uuid ];
            }
        }, this ));
    }
});

// Public handler cache
var _handlers = $[ namespace ][ widgetName ][ "handlers" ] = {};

function isHandler( object ) {
    return getType( object ) == "handler";
}

function Handler( settings ) {

    // Allow calling without the 'new' operator
    if ( !isHandler( this ) ) {
        return new Handler( settings );
    }

    $.extend( this, settings );
}

Handler.prototype = {
    constructor: Handler,
    options: {},
    run: function() {},
    setup: function() {},
    teardown: function() {}
};

})( jQuery );