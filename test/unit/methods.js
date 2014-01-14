(function( $, undefined ) {

	module( "Methods" );

	function getHash( obj ) {
		return $.map(
			obj instanceof $.Autosave ? obj.getHandlers() : $.makeArray( obj ),
			function( data ) {
				return data.name;
			}
		).join( ", " );
	}

	test( "addHandler", function() {
		var instance,
			data = [
				"handler1",
				"handler2",
				[ "handler3", "handler4" ]
			],
			tests = [];

		function getHandlerPrototype( name ) {
			return {
				name: name,
				setup: function( autosave ) {
					ok( autosave instanceof $.Autosave, "Setup called for " + this.name );
				}
			};
		}

		$.each( data, function( index, datum ) {
			tests.push( $.map( $.makeArray( datum ), getHandlerPrototype ) );
		});

		$.each( tests, function( index, test ) {
			var hash = getHash( test );

			if ( index === 0 ) {
				instance = new $.Autosave({ handler: test });

			} else {
				instance[ 'addHandler' + ( $.isArray( test ) ? 's' : '' ) ]( test );
			}

			ok( new RegExp( hash + "$" ).test( getHash( instance ) ), "Added " + hash );
		});

		expect( 7 );
	});

})( jQuery );