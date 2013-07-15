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