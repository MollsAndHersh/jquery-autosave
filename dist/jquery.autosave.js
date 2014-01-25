/*!
jquery.autosave - v2.0.0-rc1 - 2014-01-25
https://github.com/kflorence/jquery-autosave
Periodically saves form data based on a set of critera.

Copyright (C) 2014 Kyle Florence
Released under the BSD, MIT licenses
*/

(function( factory ) {

	// AMD
	if ( typeof define === "function" && define.amd ) {
		define( [ "jquery" ], factory );

	// Browser
	} else {
		factory( jQuery );
	}

})(function( $ ) {

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
			!$.isFunction( proto.run )
		) {
			throw "Handler prototype must contain a name and run function.";
		}

		this.prototypes[ proto.name ] = proto;
	},

	get: function( name, settings ) {
		var proto;

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

		} else if ( $.isPlainObject( mixed ) && typeof mixed.name === "string" ) {
			handler = this.get( mixed.name, mixed ) || mixed;

		} else if ( this.isHandler( mixed ) ) {
			handler = mixed;
		}

		return handler;
	}
});

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

var slice = Array.prototype.slice;

function scopedFunc( func ) {
	var args = slice.call( arguments, 1 );

	return function() {
		return func.apply( this, args.concat( slice.call( arguments ) ) );
	};
}

function Sequence( items ) {
	var head = $.Deferred(),
		master = $.Deferred(),
		tail = head;

	items = $.makeArray( items );

	return {
		head: head,
		items: items,
		master: master,
		reduce: function( value, func, context ) {

			// Args: func, context
			if ( typeof value === "function" ) {
				context = func;
				func = value;
				value = undefined;
			}

			head.resolveWith( context, $.makeArray( value ) );

			$.each( items, function( i, item ) {
				tail = tail.pipe( scopedFunc( func, item ) );
			});

			tail.done( scopedFunc( master.resolve ) );

			return master;
		},
		tail: tail
	};
}

function Autosave( element, options ) {
	var classNames, eventNames, handlers;

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
	this.namespace = options.namespace;
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
		var self = this;

		this.$element = $( element || [] )
			.addClass( this.namespace )
			.data( this.namespace, this );

		// TODO: move this into a Handler
		// FIXME: https://github.com/nervetattoo/jquery-autosave/issues/18
		this.inputs().on( this.eventNames.change + " " + this.eventNames.keyup, function( event ) {
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
		return this.removeHandler( this.handlers )
			.done( $.proxy( this.detach, this ) );
	},

	detach: function() {
		this.$element
			.removeClass( this.namespace )
			.removeData( this.namespace );

		// TODO: move this into a handler
		this.inputs().off( this.namespace );
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
		change: $.noop,
		handler: null,
		ignore: ":disabled",
		namespace: "autosave",
		ready: $.noop
	},
	Sequence: Sequence,
	version: "<%= pkg.version %>"
});

$.Autosave = Autosave;

$.fn.autosave = function( options ) {
	return this.each(function() {
		new Autosave( this, options );
	});
};

});