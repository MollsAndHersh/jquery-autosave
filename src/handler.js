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

	// Get a public handler by name.
	getHandler: function( name, options ) {
		return $.extend( true, { options: options }, this.handlers[ name ] );
	},

	// Register a public handler to a given name.
	registerHandler: function( name, handler ) {
		if ( !Handler.isHandler( handler ) ) {
			error( "The given handler is not valid." );

		} else {
			this.handlers[ name ] = handler;
		}
	},

	handlers: {},

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
				handler = { run: handler };

			} else if ( type === "string" ) {
				handler = this.getHandler( handler );
			}

			type = typeof handler;

			if ( type !== "object" ) {
				error( "Unable to resolve Handler ( " + type + " )" );

			} else if ( !Handler.isHandler( handler ) ) {
				handler = new Handler(
					typeof handler.handler === "string" ?
						this.getHandler( handler.handler, handler.options ) :
						handler
				);
			}

			resolved.push( handler );
		}

		return resolved;
	}
});
