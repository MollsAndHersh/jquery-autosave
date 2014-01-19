define( [
	"jquery",
	"handler",
	"namespacer",
	"sequence"
], function(
	$,
	Handler,
	namespacer,
	Sequence
) {

function Autosave( element, options ) {
	var $element, classNames, eventNames, handlers, namespace;

	// Allow omission of element argument
	if ( $.isPlainObject( element ) ) {
		options = element;
		element = [];
	}

	$element = $( element );

	// Options
	options = $.extend( true, {}, Autosave.options, options );
	namespace = options.namespace;
	classNames = namespacer( namespace, [ "change" ], "-", true );
	eventNames = namespacer( namespace, [ "change", "keyup" ] );
	handlers = options.handler || options.handlers;

	// Properties
	this.$element = $element;
	this.classNames = classNames;
	this.eventNames = eventNames;
	this.handlers = [];
	this.namespace = namespace;
	this.options = options;

	// Initialization
	$element.data( namespace, this );

	// Listen for changes on inputs
	// FIXME: https://github.com/nervetattoo/jquery-autosave/issues/18
	this.inputs().on( eventNames.change + " " + eventNames.keyup, function( event ) {
		var $target = $( event.target );

		if ( $target.not( options.ignore ) && !$target.hasClass( classNames.change ) ) {
			$target.addClass( classNames.change );
			options.change.apply( $target, event );
		}
	});

	this.addHandler( handlers ).done( options.ready );
}

$.extend( Autosave.prototype, {
	addHandler: function( mixed ) {
		var handler,
			self = this;

		return new Sequence( mixed ).reduce(function( item ) {
			handler = Handler.create( item );

			if ( handler ) {
				return $.when( handler.setup( self ) ).done(function() {
					handler.data.index = self.handlers.push( handler ) - 1;
				});
			}
		});
	},

	destroy: function() {
		return this.removeHandler( this.handlers )
			.done( $.proxy(function() {
				this.$element.removeData( this.namespace ).off( this.namespace );
				this.inputs().removeClass( this.classNames.change );
			}, this ) );
	},

	getHandler: function( mixed ) {
		var handler, item, j, type,
			i = 0,
			handlers = [];

		if ( mixed == null ) {
			return this.handlers;
		}

		mixed = $.makeArray( mixed );

		for ( ; i < mixed.length; i++ ) {
			item = mixed[ i ];

			if ( item == null ) {
				continue;
			}

			type = typeof item;

			if ( type === "number" ) {
				handler = this.handlers[ item ];

				if ( handler ) {
					handlers.push( handler );
				}

			} else if ( type === "string" ) {
				for ( j = 0; j < this.handlers.length; j++ ) {
					handler = this.handlers[ j ];

					if (
						typeof handler.name === "string" &&
						new RegExp( item + "(?:\\.|$)" ).test( handler.name )
					) {
						handlers.push( handler );
					}
				}

			} else if ( Handler.isHandler( item ) && item.equals( this.handlers[ item.data.index ] ) ) {
				handlers.push( item );
			}
		}

		return handlers;
	},

	inputs: function( inputs ) {
		return ( inputs ? $( inputs ) : this.$element )
			.andSelf().find( ":input" ).not( this.options.ignore );
	},
/*
	// TODO: move this into a Handler
	interval: function( interval, callback ) {
		if ( this.timer ) {
			clearTimeout( this.timer );
			this.timer = null;
		}

		if ( !isNaN( parseInt( interval, 10 ) ) && $.isFunction( callback ) ) {
			this.timer = setTimeout( $.proxy( callback, this ), interval );
		}
	},
*/
	removeHandler: function( mixed ) {
		var self = this,
			sequence = new Sequence( this.getHandler( mixed ) );

		return sequence.reduce(function( handler ) {
			return $.when( handler.teardown( self ) ).done(function() {
				self.handlers.splice( handler.data.index, 1, undefined );
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

// Add the plural form of applicable prototype functions
$.each( [ "addHandler", "getHandler", "removeHandler" ], function( index, name ) {
	Autosave.prototype[ name + "s" ] = Autosave.prototype[ name ];
});

// Public Static
$.extend( Autosave, {
	Handler: Handler,
	options: {
		handler: null,
		ignore: ":disabled",
		namespace: "autosave",

		// Callbacks
		change: $.noop,
		save: $.noop,
		ready: $.noop
	},
	Sequence: Sequence,
	version: "<%= pkg.version %>"
});

return Autosave;

});