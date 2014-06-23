(function( factory ) {

	// AMD
	if ( typeof define === "function" && define.amd ) {
		define( [ "jquery", "fixture" ], factory );

	// Browser
	} else {
		factory( jQuery, Fixture );
	}

})(function( $, Fixture ) {

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


function Autosave( elements, options ) {
	var classNames, eventNames, fixtures;

	// Allow calling without the 'new' operator
	if ( !( this instanceof Autosave ) ) {
		return new Autosave( elements, options );
	}

	// Allow omission of element argument
	if ( $.isPlainObject( elements ) ) {
		options = elements;
		elements = undefined;
	}

	// Options
	options = $.extend( true, {}, Autosave.options, options );
	classNames = namespacer( options.namespace, [ "change" ], "-", true );
	eventNames = namespacer( options.namespace, [ "change", "keyup" ] );
	fixtures = options.fixture || options.fixtures;

	// Properties
	this.classNames = classNames;
	this.eventNames = eventNames;
	this.fixtures = {};
	this.options = options;

	// Initialization
	this.attach( elements );
	this.addFixture( fixtures ).done( options.ready );
}

$.extend( Autosave.prototype, {
	addFixture: function( mixed ) {
		var fixture,
			self = this;

		return new $.Deferred.Sequence( mixed ).reduce(function( item ) {
			fixture = Fixture.create( item );

			if ( fixture ) {
				return $.when( fixture.attach( self ) ).done(function() {
					self.fixtures[ fixture.uuid ] = fixture;
				});
			}
		});
	},

	attach: function( elements ) {
		var $elements = $( elements || [] ),
			self = this;

		( this.$elements ? this.$elements.add( $elements ) : ( this.$elements = $elements ) )
			.addClass( this.options.namespace )
			.data( this.options.namespace, this );

		// TODO: move this into a Fixture
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
		return this.removeFixtures( this.getFixtures() )
			.done( $.proxy( this.detach, this ) );
	},

	detach: function() {
		this.$elements
			.removeClass( this.options.namespace )
			.removeData( this.options.namespace );

		this.$elements = $( [] );

		// TODO: move this into a fixture
		this.getInputs().off( this.options.namespace );
	},

	getElement: function() {
		return this.$elements;
	},

	getFixture: function( mixed ) {
		var fixture, item, key, type,
			i = 0,
			fixtures = [];

		if ( mixed == null ) {
			for ( key in this.fixtures ) {
				fixtures.push( this.fixtures[ key ] );
			}

			return fixtures;
		}

		mixed = $.makeArray( mixed );

		for ( ; i < mixed.length; i++ ) {
			item = mixed[ i ];

			if ( item == null ) {
				continue;
			}

			type = typeof item;

			if ( type === "number" ) {
				fixture = this.fixtures[ item ];

				if ( fixture ) {
					fixtures.push( fixture );
				}

			} else if ( type === "string" ) {
				for ( key in this.fixtures ) {
					fixture = this.fixtures[ key ];

					if (
						typeof fixture.name === "string" &&
						new RegExp( item + "(?:\\.|$)" ).test( fixture.name )
					) {
						fixtures.push( fixture );
					}
				}

			} else if ( Fixture.isFixture( item ) && item.equals( this.fixtures[ item.uuid ] ) ) {
				fixtures.push( item );
			}
		}

		return fixtures;
	},

	getInput: function( selector ) {
		var $inputs = ( selector ? $( selector ) : this.$elements ).find( ":input" );
		return ( $inputs.length ? $inputs : $inputs.end().filter( ":input" ) ).not( this.options.ignore );
	},

	getOption: function( key ) {
		return key === undefined ? this.options : this.options[ key ];
	},

/*
	// TODO: move this into a Fixture
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
	removeFixture: function( mixed ) {
		var self = this,
			sequence = new $.Deferred.Sequence( this.getFixtures( mixed ) );

		return sequence.reduce(function( fixture ) {
			return $.when( fixture.detach( self ) ).done(function() {
				delete self.fixtures[ fixture.uuid ];
			});
		});
	},

	save: function( event, inputs, data ) {
		var sequence = new $.Deferred.Sequence( this.getFixtures() );

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
		}, function( fixture, data ) {
			var dfd = $.Deferred();

			$.when( fixture.interact( data ) ).done(function( response ) {
				dfd.resolve( response !== undefined ? response : data );
			}).fail( sequence.master.reject );

			return dfd;
		});
	}
});

// Add the plural form of applicable prototype functions
$.each([
	"addFixture",
	"getElement",
	"getFixture",
	"getInput",
	"getOption",
	"removeFixture"
], function( index, name ) {
	Autosave.prototype[ name + "s" ] = Autosave.prototype[ name ];
});

// Public Static
$.extend( Autosave, {
	options: {
		change: $.noop,
		fixture: null,
		ignore: ":disabled",
		namespace: "autosave",
		ready: $.noop
	},
	version: "<%= pkg.version %>"
});


$.Autosave = Autosave;

$.fn.autosave = function( options ) {
	return this.each(function() {
		new Autosave( this, options );
	});
};



});