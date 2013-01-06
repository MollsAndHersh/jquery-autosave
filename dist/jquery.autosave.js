/*!
jquery.autosave - v2.0.0-rc1 - 2013-01-05
https://github.com/kflorence/jquery-autosave
Periodically saves form data based on a set of critera.

Copyright (C) 2013 Kyle Florence
Released under the BSD, MIT licenses
*/

(function( window, $, undefined ) {
"use strict";

var namespace = "autosave";

function arr( obj ) {
    return $.isArray( obj ) ? obj : [ obj ];
}

function error( message ) {
    throw new Error( "( " + namespace + " ) " + message );
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

var uuid = 0;

function Handler( settings ) {

    // Allow calling without the "new" operator
    if ( !Handler.isHandler( this ) ) {
        return new Handler( settings );
    }

    $.extend( this, settings );

    this.uuid = uuid++;
}

$.extend( Handler.prototype, {
    constructor: Handler,
    options: {},
    run: $.noop,
    setup: $.noop,
    teardown: $.noop
});

$.extend( Handler, {
    isHandler: (function() {
        var matches,
            rFunctionName = /function ([^(]+)/;

        return function( object ) {
            return object !== null && typeof object === "object" && object.constructor &&
                ( matches = rFunctionName.exec( object.constructor.toString() ) ) &&
                matches[ 1 ] && matches[ 1 ].toLowerCase() === "handler";
        };
    })(),

    resolveHandler: function( handler ) {
        var handlers, i, length, type,
            resolved = [];

        if ( !handler ) {
            return resolved;
        }

        handlers = arr( handler );

        for ( i = 0, length = handlers.length; i < length; i++ ) {
            handler = handlers[ i ];
            type = typeof handler;

            if ( type === "function" ) {
                handler = {
                    run: handler
                };

            } else if ( type === "string" ) {
                handler = Autosave.handlers[ handler ];
            }

            type = typeof handler;

            if ( type !== "object" ) {
                error( "Unable to resolve Handler ( " + type + " )" );

            } else if ( !Handler.isHandler( handler ) ) {
                handler = new Handler( handler );
            }

            resolved.push( handler );
        }

        return resolved;
    }
});

var aps = Array.prototype.slice;

function scopedFunc() {
    var args = aps.call( arguments, 0 ),
        func = args.shift();

    return function() {
        return func.apply( this, args.concat( arguments ) );
    };
}

function Sequence( settings, process ) {
    return process === true ? this.process( settings ) : this.update( settings );
}

Sequence.prototype = {
    constructor: Sequence,

    process: function( settings ) {
        this.update( settings );

        this.head = new $.Deferred();
        this.deferred = new $.Deferred();
        this.tail = this.head;

        $.each( this.settings.items, $.proxy( function( i, item ) {
            this.tail = this.tail.then( scopedFunc( this.settings.each, this.tail, item ) );
        }, this ) );

        this.tail.done( scopedFunc( this.deferred.resolve ) );
        this.head.resolve( this.settings.data );

        return this.deferred.promise();
    },

    update: function( settings ) {
        if ( settings ) {
            this.settings = $.extend( true, {}, Sequence.settings, settings );
        }

        return this;
    }
};

Sequence.settings = {
    data: {},
    each: function( dfd, item, data ) {
        return data;
    },
    items: []
};

// Setters
$.each( Sequence.settings, function( key ) {
    Sequence.prototype[ key ] = function( value ) {
        this.settings[ key ] = value;

        return this;
    };
});

var classNames = namespacer( namespace, [ "change" ], "-", true ),
    eventNames = namespacer( namespace, [ "change", "keyup" ] );

function Autosave( element, options ) {
    var form;

    this.element = element = $( element );
    this.options = options;

    // Try to find the form associated the given element
    if ( element.is( "form" ) ) {
        form = element;

    } else if ( !( form = element.find( "form" ) ).length ) {
        form = element.closest( "form" );
    }

    this.form = form;

    // Listen for changes on inputs
    // FIXME: https://github.com/nervetattoo/jquery-autosave/issues/18
    element.on( eventNames.change + " " + eventNames.keyup, ":input", function( event ) {
        var target = $( event.target );

        if ( !target.hasClass( options.ignore ) ) {
            target.addClass( classNames.change );
            options.change.apply( target, event );
        }
    });

    this.addHandler( options.handler || options.handlers ).done( options.ready );
}

$.extend( Autosave.prototype, {
/*
    addHandler: function( handlers ) {
        var handler, i, length,
            chain = new $.Deferred(),
            promise = chain;

        handlers = Handler.resolveHandler( handlers );

        for ( i = 0, length = handlers.length; i < length; i++ ) {
            handler = handlers[ i ];
            promise = promise.pipe( pipe( handler ) );
            promise.done( done.call( this, handler ) );
        }

        chain.resolve();

        return promise;
    },
*/
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

        if ( !isNaN( parseInt( interval, 10 ) ) && $.isFunction( callback ) ) {
            this.timer = setTimeout( $.proxy( callback, this ), interval );
        }
    },

    removeHandler: function() {
        // TODO
    }/*,

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
            if ( this.handlers.hasOwnProperty( handler ) ) {
                handler = this.handlers[ handler ];
                promise = promise.pipe( pipe( handler ) );
                promise.fail( fail( deferred ) );
            }
        }

        // Resolve deferred when the last promise is done
        promise.done( done( deferred ) );

        // Start the chain
        chain.resolve({
            data: {},
            event: event,
            inputs: inputs ? $( inputs ).filter( ":input" ) : this.inputs()
        });

        return deferred.promise();
    }*/
});

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

$.fn[ namespace ] = function( options ) {
    options = $.extend( true, {}, Autosave.options, options );

    return this.each(function() {
        $.data( this, namespace, new Autosave( this, options ) );
    });
};

})( this, jQuery );
