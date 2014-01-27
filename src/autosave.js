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
	var classNames, eventNames, handlers;

	// Allow calling without the 'new' operator
	if ( !( this instanceof Autosave ) ) {
		return new Autosave( element, options );
	}

	// Allow omission of element argument
	if ( $.isPlainObject( element ) ) {
		options = element;
		element = undefined;
	}

	// Options
	options = $.extend( true, {}, Autosave.options, options );
	classNames = namespacer( options.namespace, [ "change" ], "-", true );
	eventNames = namespacer( options.namespace, [ "change", "keyup" ] );
	handlers = options.handler || options.handlers;

	// Properties
	this.classNames = classNames;
	this.eventNames = eventNames;
	this.handlers = [];
	this.options = options;

	// Initialization
	this.attach( element );
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

	attach: function( element ) {
		var $element = $( element || [] ),
			self = this;

		( this.$element ? this.$element.add( $element ) : ( this.$element = $element ) )
			.addClass( this.options.namespace )
			.data( this.options.namespace, this );

		// TODO: move this into a Handler
		// FIXME: https://github.com/nervetattoo/jquery-autosave/issues/18
		this.getInputs().on( this.eventNames.change + " " + this.eventNames.keyup, function( event ) {
			var $target = $( event.target );

			if (
				$target.not( self.options.ignore ) &&
				!$target.hasClass( self.classNames.change )
			) {
				$.when(
					self.options.change.apply( $target.get( 0 ), event )
				).done(function() {
					$target.addClass( self.classNames.change );
				});
			}
		});
	},

	destroy: function() {
		return this.removeHandlers( this.handlers )
			.done( $.proxy( this.detach, this ) );
	},

	detach: function() {
		this.$element
			.removeClass( this.options.namespace )
			.removeData( this.options.namespace );

		this.$element = $( [] );

		// TODO: move this into a handler
		this.getInputs().off( this.options.namespace );
	},

	getElement: function() {
		return this.$element;
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

	getInputs: function( inputs ) {
		return ( inputs ? $( inputs ) : this.$element )
			.andSelf().find( ":input" ).not( this.options.ignore );
	},

	getOption: function( key ) {
		return key === undefined ? this.options : this.options[ key ];
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
			inputs: this.getInputs( inputs )
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
$.each([
	"addHandler",
	"getHandler",
	"getOption",
	"removeHandler"
], function( index, name ) {
	Autosave.prototype[ name + "s" ] = Autosave.prototype[ name ];
});

// Public Static
$.extend( Autosave, {
	Handler: Handler,
	options: {
		change: $.noop,
		handler: null,
		ignore: ":disabled",
		namespace: "autosave",
		ready: $.noop
	},
	Sequence: Sequence,
	version: "<%= pkg.version %>"
});

return Autosave;

});