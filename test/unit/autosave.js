(function( $, undefined ) {

	module( "Autosave", {
		setup: function() {
			$.Autosave.Handler.prototypes = {};
		}
	});

	// Generate a hash from an array of handlers or handler-like objects
	function getHash( obj, callback ) {
		return $.map(
			obj instanceof $.Autosave ? obj.getHandlers() : $.makeArray( obj ), callback
		).join( ", " );
	}

	// Process a set of data against a callback and generate a new set of data
	function map( data, callback ) {
		var result = [];

		$.each( data, function( index, datum ) {
			var value = $.isArray( datum ) ? $.map( datum, callback ) : callback( datum );

			if ( value ) {
				result.push( value );
			}
		});

		return result;
	}

	test( "addHandler(s)", function() {
		var instance,
			data = [
				"handler1",
				"handler2",
				[ "handler3", "handler4" ]
			],
			tests = map( data, function( name ) {
				return {
					name: name,
					setup: function( autosave ) {
						ok( autosave instanceof $.Autosave, "Setup called for " + this.name );
					}
				};
			});

		function hasher( data ) {
			return data.name;
		}

		$.each( tests, function( index, test ) {
			var hash = getHash( test, hasher );

			if ( index === 0 ) {
				instance = new $.Autosave({ handler: test });

			} else {
				instance[ "addHandler" + ( $.isArray( test ) ? "s" : "" ) ]( test );
			}

			ok( new RegExp( hash + "$" ).test( getHash( instance, hasher ) ), "Added " + hash );
		});

		expect( 7 );
	});

	test( "getHandler(s)", function() {
		var instance = new $.Autosave({
				handlers: [
					function() {},
					{ name: "handler" },
					{ name: "handler.foo" },
					new $.Autosave.Handler({ name: "handlerfoo" })
				]
			}),
			tests = [
				[ undefined, "0, 1, 2, 3" ],
				[ null, "0, 1, 2, 3" ],
				[ 1, "1" ],
				[ "handler", "1, 2" ],
				[ "handler.foo", "2" ],
				[ "handlerfoo", "3" ],
				[ instance.getHandler( 3 ), "3" ]
			];

		function hasher( handler ) {
			return handler.data.index;
		}

		$.each( tests, function( index, test ) {
			equal( getHash( instance.getHandlers( test[ 0 ] ), hasher ), test[ 1 ], "Got " + test[ 1 ] );
		});

		expect( tests.length );
	});

})( jQuery );