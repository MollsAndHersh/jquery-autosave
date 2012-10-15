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

var publicHandlers,
    classNames = [ "change" ],
    eventNames = [ "change", "keyup" ],
    namespace = "kf",
    uuid = 0,
    widgetName = "autosave";

// Used to normalize function arguments that can be either
// an array of values or a single value
var arr = function( obj ) {
    return $.isArray( obj ) ? obj : [ obj ];
};

$.widget( namespace + "." + widgetName, {
    version: "2.0.0-rc1",

    classNames: {},
    handlers: {},

    options: {
        handler: null,
        ignore: ":hidden",

        // Callbacks
        change: $.noop,
        save: $.noop,
        ready: $.noop
    },

    _create: function() {
        var className, form, i, length,
            element = this.element,
            handler = this.options.handler || this.options.handlers;

        // Try to find the form associated the given element
        if ( element.is( "form" ) ) {
            this.form = element;

        } else if ( !( this.form = element.find( "form" ) ).length ) {
            this.form = element.closest( "form" );
        }

        // Cache class names with widget full name
        for ( i = 0, length = classNames.length; i < length; i++ ) {
            className = classNames[ i ];
            this.classNames[ className ] = this.widgetFullName + "-" + className;
        }

        // Listen for changes to inputs inside of element
        for ( i = 0, length = eventNames.length; i < length; i++ ) {
            eventName = eventNames[ i ];
            element.on( eventName + this.eventNamespace, ":input", $.proxy( this._change, this ) );
        }

        this.addHandler( handler ).done( this.options.ready );
    },

    // FIXME: https://github.com/nervetattoo/jquery-autosave/issues/18
    _change: function( event ) {
        var target = $( event.target );

        if ( !target.hasClass( this.options.ignore ) ) {
            target.addClass( this.classNames.change );
            this.element._trigger( "change", event );
        }
    },

    _error: function( message ) {
        throw new Error( "(" + widgetName + ") " + message );
    },

    _resolveHandler: function( handler ) {
        var handlers, i, length, typeOf,
            resolved = [];

        if ( !handler ) {
            return resolved;
        }

        handlers = arr( handler );

        for ( i = 0, length = handlers.length; i < length; i++ ) {
            handler = handlers[ i ];
            typeOf = typeof handler;

            if ( typeOf == "function" ) {
                handler = { run: handler };

            } else if ( typeOf == "string" ) {
                handler = publicHandlers[ handler ];
            }

            if ( typeof handler != "object" ) {
                this._error( "Unable to resolve Handler" );

            } else if ( !Handler.isHandler( handler ) ) {
                handler = new Handler( handler );
            }

            resolved.push( handler );
        }

        return resolved;
    },

    _setOption: function( key, value ) {
        if ( $.inArray( key, handlerTypes ) >= 0 ) {
            this._updateHandler( key, value );
        }

        $.Widget.prototype._setOption.apply( this, arguments );
    },

    _updateHandler: function( handler ) {
        // TODO
    },

    addHandler: function( handler ) {
        var i, length,
            chain = new $.Deferred(),
            handlers = this._resolveHandler( handler ),
            promise = chain,
            self = this;

        for ( i = 0, length = handlers.length; i < length; i++ ) {
            handler = handlers[ i ];

            promise = promise.pipe(function() {
                return handler.setup( handler.options );

            }).done(function() {
                self.handlers[ handler.uuid ] = handler;
            });
        }

        chain.resolve();

        return promise;
    },

    destroy: function() {
        this.interval();

        this.element.off( this.eventNamespace );
        this.inputs().removeClass( this._classNames.change );

        $.Widget.prototype.destroy.call( this );
    },

    inputs: function() {
        return this.element.find( ":input" ).not( this.options.ignore );
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

    removeHandler: function( handler ) {
        // TODO
    },

    save: function( event, inputs ) {
        var handler,
            chain = new $.Deferred(),
            deferred = new $.Deferred(),
            promise = chain;

        // args: inputs
        if ( !( event instanceof $.Event ) ) {
            inputs = event;
            event = undefined;
        }

        for ( handler in this.handlers ) {
            handler = this.handlers[ handler ];

            promise = promise.pipe(function( data ) {
                return handler.run( handler.options, data ) || data;

            // If any promise fails, reject deferred
            }).fail(function( data ) {
                deferred.reject( data );
            });
        }

        // Resolve deferred when the last promise is done
        promise.done(function( data ) {
            deferred.resolve( data );
        });

        // Start the chain
        chain.resolve({
            data: {},
            event: event,
            inputs: inputs ? $( inputs ).filter( ":input" ) : this.inputs()
        });

        return deferred.promise();
    }
});

// Public handlers namespace
$[ namespace ][ widgetName ][ "handlers" ] = publicHandlers = {};

// TODO: move this to handler.js when there's a proper build script.
function Handler( settings ) {

    // Allow calling without the 'new' operator
    if ( !Handler.isHandler( this ) ) {
        return new Handler( settings );
    }

    $.extend( this, settings );

    this.uuid = uuid++;
}

Handler.isHandler = (function() {
    var matches,
        rFunctionName = /function ([^(]+)/;

    return function( object ) {
        return object != null && typeof object == "object" && object.constructor
            && ( matches = rFunctionName.exec( object.constructor.toString() ) )
            && matches[ 1 ] && matches[ 1 ].toLowerCase() == "handler";
    }
})();

Handler.prototype = {
    constructor: Handler,
    options: {},
    run: $.noop,
    setup: $.noop,
    teardown: $.noop
};

})( jQuery );