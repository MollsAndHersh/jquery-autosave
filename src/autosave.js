classNames = namespacer( namespace, [ "change" ], "-", true );
eventNames = namespacer( namespace, [ "change", "keyup" ] );

function Autosave( element, options ) {
	var $element = $( element );

	this.$element = $element;
	this.options = options;

	// Listen for changes on inputs
	// FIXME: https://github.com/nervetattoo/jquery-autosave/issues/18
	this.inputs().on( eventNames.change + " " + eventNames.keyup, function( event ) {
		var $target = $( event.target );

		if (  $target.not( options.ignore ) && !$target.hasClass( classNames.change ) ) {
			$target.addClass( classNames.change );
			options.change.apply( $target, event );
		}
	});

	this.addHandler( options.handler || options.handlers ).done( options.ready );
}

$.extend( Autosave.prototype, {
	addHandler: function( handler ) {
		var handlers = this.handlers,
			sequence = new Sequence( Handler.resolveHandler( handler ) );

		return sequence.reduce(function( handler ) {
			return $.when( handler.setup() ).done(function() {
				handlers[ handler.uuid ] = handler;

				if ( handler.options && typeof handler.options.name === "string" ) {
					nameToUuidMap[ handler.options.name ] = handler.uuid;
				}
			});
		});
	},

	destroy: function() {
		this.interval();

		this.$element.removeData( namespace ).off( "autosave" );
		this.inputs().removeClass( classNames.change );

		return this.removeHandler( this.handlers );
	},

	getHandler: function( handler ) {
		var i, length,
			handlers = arr( handler ),
			result = [];

		for ( i = 0, length = handler.length; i < length; i++ ) {
			handler = handlers[ i ];
			handler = this.handlers[
				Handler.isHandler( handler ) ? handler.uuid :
				( typeof handler === "string" ? nameToUuidMap[ handler ] : handler )
			];

			if ( handler ) {
				result.push( handler );
			}
		}

		return result;
	},

	handlers: {},

	inputs: function( inputs ) {
		return ( inputs ? $( inputs ) : this.$element )
			.andSelf().find( ":input" ).not( this.options.ignore );
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

	removeHandler: function( handler ) {
		var handlers = this.handlers,
			sequence = new Sequence( this.getHandler( handler ) );

		return sequence.reduce(function( handler ) {
			return $.when( handler.teardown() ).done(function() {
				delete handlers[ handler.uuid ];
			});
		});
	},

	save: function( event, inputs, data ) {
		var sequence = new Sequence( this.handlers );

		// Args: inputs, data
		if ( !( event instanceof $.Event ) ) {
			data = inputs;
			inputs = event;
			event = undefined;
		}

		return sequence.reduce({
			data: data,
			event: event,
			inputs: this.inputs( inputs )
		}, function( handler, data ) {
			var dfd = $.Deferred();

			$.when( handler.run( data ) ).done(function( response ) {
				dfd.resolve( response !== undefined ? response : data );
			}).fail( sequence.master.reject );

			return dfd;
		});
	}
});

// Public Static
$.extend( Autosave, {
	classNames: classNames,
	eventNames: eventNames,
	Handler: Handler,
	namespace: namespace,

	options: {
		handler: null,
		ignore: ":disabled",

		// Callbacks
		change: $.noop,
		save: $.noop,
		ready: $.noop
	},

	version: "<%= pkg.version %>"
});
