/*
jQuery.autosave v2.0.0-rc1
https://github.com/kflorence/jquery-autosave/
Periodically saves form data based on a set of critera.

Requires:
 - jQuery 1.7.0+

Inspired by the jQuery.autosave plugin written by Raymond Julin,
Mads Erik Forberg and Simen Graaten.

Copyright (C) 2012 Kyle Florence
Dual licensed under the MIT and BSD licenses.
*/

(function( global, $, undefined ) {
    var namespace = "autosave",
        classNames = namespacer( namespace, [ "change" ], "-", true ),
        eventNames = namespacer( namespace, [ "change", "keyup" ] ),
        inputEvents = join( eventNames, " " ),
        uuid = 0;

    function arr( obj ) {
        return $.isArray( obj ) ? obj : [ obj ];
    }

    function error( message ) {
        throw new Error( "( " + namespace + " ) " + message );
    }

    function join( obj, separator ) {
        var k,
            items = [];

        if ( typeof obj.join === "function" ) {
            items = obj;

        } else {
            for ( k in obj ) {
                if ( obj.hasOwnProperty( k ) ) {
                    items.push( obj[ k ] );
                }
            }
        }

        return items.join( separator );
    }

    function namespacer( namespace, items, separator, before ) {
        var i, item,
            length = items.length,
            namespaced = {};

        if ( length && namespace ) {
            if ( !separator ) {
                separator = ".";
            }

            for ( i = 0; i < length; i++ ) {
                item = items[ i ];
                namespaced[ item ] = before ?
                    namespace + separator + item :
                    item + separator + namespace;
            }
        }

        return namespaced;
    }

    function Autosave( element, options ) {
        var className, form, i, length,
            handler = options.handler || options.handlers;

        element = $( element );

        // Try to find the form associated the given element
        if ( element.is( "form" ) ) {
            form = element;

        } else if ( !( form = element.find( "form" ) ).length ) {
            form = element.closest( "form" );
        }

        // Listen for changes on inputs
        // FIXME: https://github.com/nervetattoo/jquery-autosave/issues/18
        element.on( inputEvents, ":input", function( event ) {
            var target = $( event.target );

            if ( !target.hasClass( options.ignore ) ) {
                target.addClass( classNames.change );
                options.change.apply( target, event );
            }
        });

        this.element = element;
        this.form = form;
        this.options = options;

        this.addHandler( handler ).done( options.ready );
    };

    // Public Static
    $.extend( Autosave, {
        classNames: classNames,
        eventNames: eventNames,
        handlers: {},
        namespace: namespace,
        options: {
            handler: null,
            ignore: ":hidden",

            // Callbacks
            change: $.noop,
            save: $.noop,
            ready: $.noop
        },
        version: "2.0.0-rc1"
    });

    // Public Instance
    Autosave.prototype = {
        addHandler: function( handler ) {
            var i, length,
                chain = new $.Deferred(),
                handlers = Handler.resolveHandler( handler ),
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

        constructor: Autosave,

        destroy: function() {
            this.interval();

            this.element.removeData( namespace ).off( "autosave" );
            this.inputs().removeClass( classNames.change );

            return this.removeHandler( this.handlers );
        },

        handlers: {},

        inputs: function() {
            return this.element.find( ":input" ).not( this.options.ignore );
        },

        interval: function( interval, callback ) {
            if ( this.timer ) {
                clearTimeout( this.timer );
                this.timer = null;
            }

            if ( !isNaN( parseInt( interval ) ) && $.isFunction( callback ) ) {
                this.timer = setTimeout( $.proxy( callback, this ), interval );
            }
        },

        removeHandler: function( handler ) {
            // TODO
        },

        save: function( event, inputs ) {
            var handler,
                chain = new $.Deferred(),
                data = {},
                deferred = new $.Deferred(),
                promise = chain;

            // args: inputs
            if ( !( event instanceof $.Event ) ) {
                inputs = event;
                event = undefined;
            }

            inputs = inputs ? $( inputs ).filter( ":input" ) : this.inputs();

            for ( handler in this.handlers ) {
                handler = this.handlers[ handler ];

                promise = promise.pipe(function( data ) {
                    return handler.run( event, handler.options, inputs, data ) || data;

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
            chain.resolve( data );

            return deferred.promise();
        }
    };

    // jQuery bridge
    $.fn[ namespace ] = function( options ) {
        options = $.extend( true, {}, Autosave.options, options );

        return this.each(function() {
            $.data( this, namespace, new Autosave( this, options ) );
        });
    };

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

    Handler.resolveHandler = function( handler ) {
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
                handler = Autosave.handlers[ handler ];
            }

            if ( typeof handler != "object" ) {
                error( "Unable to resolve Handler" );

            } else if ( !Handler.isHandler( handler ) ) {
                handler = new Handler( handler );
            }

            resolved.push( handler );
        }

        return resolved;
    };

    Handler.prototype = {
        constructor: Handler,
        options: {},
        run: $.noop,
        setup: $.noop,
        teardown: $.noop
    };

})( this, jQuery );