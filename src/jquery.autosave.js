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

var handlers,
    classNames = [ "change" ],
    handlerTypes = [ "trigger", "scope", "data", "condition", "store" ],
    handlerTypesLength = handlerTypes.length,
    inputChangeEvents = [ "change", "keyup" ],
    namespace = "kf",
    uuid = 0,
    widgetName = "autosave";

// Used to normalize function arguments that can be either
// an array of values or a single value
var arr = function( obj ) {
    return $.isArray( obj ) ? obj : [ obj ];
};

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

var isHandler = function( object ) {
    return getType( object ) == "handler";
};

var whenArray = function( deferreds ) {
    return $.when.apply( null, deferreds );
};

$.widget( namespace + "." + widgetName, {
    version: "2.0.0-rc1",

    options: {
        ignore: ":hidden",

        // Handlers
        trigger: "interval",
        scope: "all",
        data: "serialize",
        condition: "changed",
        store: "ajax",

        // Callbacks
        change: $.noop,
        save: $.noop,
        ready: $.noop
    },

    handlers: {},
    handlersByName: {},
    handlersByType: (function() {
        var handlerType,
            handlersByType = {},
            i = handlerTypesLength;

        while ( ( handlerType = handlerTypes[ --i ] ) ) {
            handlersByType[ handlerType ] = {};
        }

        return handlersByType;
    })(),

    _classNames: {},

    _create: function() {
        var form,
            self = this,
            deferreds = [],
            element = self.element;

        if ( element.is( "form" ) ) {
            form = element;

        } else if ( !( form = element.find( "form" ) ).length ) {
            form = element.closest( "form" );
        }

        if ( !( self.form = form ).length ) {
            self._error( "Unable to locate form" );
        }

        $.each( classNames, function( i, className ) {
            self._classNames[ className ] = self.widgetFullName + "-" + className;
        });

        $.each( inputChangeEvents, function( i, eventName ) {
            element.on( eventName + self.eventNamespace, ":input", $.proxy( self._change, self ) );
        });

        $.each( handlerTypes, function( i, type ) {
            deferreds.push( self.addHandler( type, self.options[ type ] ) );
        });

        whenArray( deferreds ).done( self.options.ready );
    },

    // FIXME: https://github.com/nervetattoo/jquery-autosave/issues/18
    _change: function( event ) {
        var target = $( event.target );

        if ( !target.hasClass( this.options.ignore ) ) {
            target.addClass( this._classNames.change );
            this.element._trigger( "change", event );
        }
    },

    _error: function( message ) {
        throw new Error( "(" + widgetName + ") " + message );
    },

    _resolveHandler: function( type, handler ) {
        var typeOf,
            resolved = [],
            self = this;

        if ( !handler ) {
            return resolved;
        }

        $.each( arr( handler ), function( i, handler ) {
            typeOf = typeof handler;

            if ( typeOf == "function" ) {
                handler = { run: handler };

            } else if ( typeOf == "string" ) {
                handler = handlers[ handler ];
            }

            if ( typeof handler != "object" ) {
                self._error( "Unable to resolve Handler" );

            } else {
                handler.type = handler.type || type;

                if ( $.inArray( handler.type, handlerTypes ) < 0 ) {
                    self._error( "Invalid Handler type: " + handler.type );
                }
            }

            if ( !isHandler( handler ) ) {
                handler = new Handler( handler );
            }

            resolved.push( handler );
        });

        return resolved;
    },

    _setOption: function( key, value ) {
        if ( $.inArray( key, handlerTypes ) >= 0 ) {
            this._updateHandler( key, value );
        }

        $.Widget.prototype._setOption.apply( this, arguments );
    },

    _updateHandler: function( type, handler ) {
        // TODO: remove all previous handlers of same type
        // TODO: add all new handlers for same type
    },

    addHandler: function( type, handler ) {
        var handlers,
            deferreds = [],
            self = this;

        // args: handler
        if ( arguments.length == 1 ) {
            success = handler;
            handler = type;
            type = undefined;
        }

        // TODO: handle namespaced types (like "my.trigger")
        $.each( this._resolveHandler( type, handler ), function( i, handler ) {
            deferreds.push( handler.setup.call( self, handler.options ) );
            self.handlers[ handler.uuid ] = handler;
            self.handlersByType[ handler.type ][ handler.uuid ] = handler;
        });

        return whenArray( deferreds );
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

    save: function( event, inputs, caller ) {
        var args, argsLength, chain, deferred, handler, handlers,
            deferreds = [],
            index = 1,
            lastIndex = 0,
            self = this;

        inputs = inputs ? $( inputs ).filter( ":input" ) : self.inputs();

        // inputs, data, caller
        args = [ inputs, {}, caller ];

        (function next() {
            deferred = new $.Deferred();
            handlers = self.handlersByType[ handlerTypes[ index ] ];

            for ( handler in handlers ) {
                handler = handlers[ handler ];
                chain = ( chain ? chain : deferred ).pipe(function() {
                    return handler.run.apply( null, [ handler.options || {} ].concat( args.slice( 0, index ) ) );
                });
            }

            chain.done(function( result ) {
                if ( result === false ) {
                    return;

                } else if ( result !== undefined ) {
                    args[ lastIndex ] = result;
                }

                lastIndex = index;

                if ( ++index < handlerTypesLength ) {
                    next();

                } else {
                    self._trigger( "save", event, arguments );
                    self.inputs().removeClass( self._classNames.change );
                }
            });

            deferred.resolve( args.slice( lastIndex, index ) );
        })();
    }
});

// Public handlers
$[ namespace ][ widgetName ][ "handlers" ] = handlers = {};

// Handler Class
function Handler( settings ) {

    // Allow calling without the 'new' operator
    if ( !isHandler( this ) ) {
        return new Handler( settings );
    }

    $.extend( this, settings );

    this.uuid = uuid++;
}

Handler.prototype = {
    constructor: Handler,
    options: {},
    run: $.noop,
    setup: $.noop,
    teardown: $.noop
};

})( jQuery );