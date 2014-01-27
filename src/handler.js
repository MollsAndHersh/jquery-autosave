define( [ "jquery" ], function( $ ) {

var uuid = 0;

function Handler( settings ) {

	// Allow calling without the "new" operator
	if ( !Handler.isHandler( this ) ) {
		return new Handler( settings );
	}

	// Properties
	this.data = {};
	this.options = {};
	this.uuid = uuid++;

	$.extend( this, settings );
}

$.extend( Handler.prototype, {
	equals: function( handler ) {
		return Handler.isHandler( handler ) && this.uuid === handler.uuid;
	},
	run: $.noop,
	setup: $.noop,
	teardown: $.noop,
	toString: function() {
		return "Handler:" + this.uuid;
	}
});

$.extend( Handler, {
	create: function( mixed ) {
		var handler;

		mixed = this.normalize( mixed );

		if ( mixed ) {
			handler = new Handler( mixed );
		}

		return handler;
	},

	define: function( proto ) {
		if (
			!$.isPlainObject( proto ) ||
			typeof proto.name !== "string" ||
			!( $.isFunction( proto.setup ) || $.isFunction( proto.run ) || $.isFunction( proto.teardown ) )
		) {
			throw "Handler prototype must contain a name and at least one of the lifecycle functions.";
		}

		this.prototypes[ proto.name ] = proto;
	},

	get: function( name, settings ) {
		var proto;

		if ( typeof name !== "string" ) {
			return;
		}

		// Allow namespacing
		name = name.split( "." )[ 0 ];
		proto = this.prototypes[ name ];

		// Clone
		if ( proto ) {
			proto = $.extend( true, {}, proto, settings );
		}

		return proto;
	},

	prototypes: {},

	isHandler: (function() {
		var matches,
			rFunctionName = /function ([^(]+)/;

		return function( object ) {
			return object !== null && typeof object === "object" && object.constructor &&
				( matches = rFunctionName.exec( object.constructor.toString() ) ) &&
				matches[ 1 ] && matches[ 1 ].toLowerCase() === "handler";
		};
	})(),

	normalize: function( mixed ) {
		var handler,
			type = typeof mixed;

		if ( type === "string" ) {
			handler = this.get( mixed );

		} else if ( type === "function" ) {
			handler = { run: mixed };

		} else if ( $.isPlainObject( mixed ) ) {
			handler = this.get( mixed.name, mixed ) || mixed;

		} else if ( this.isHandler( mixed ) ) {
			handler = mixed;
		}

		return handler;
	}
});

return Handler;

});