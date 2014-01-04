(function( $, undefined ) {

	module( "Methods" );

	test( "addHandler", function() {
		expect( 3 );

		var autosave = new $.Autosave( null, {
			handler: { name: "handler1" }
		});

		equal( autosave.getHandlers().length, 1, "One handler present after initialization" );

		autosave.addHandler({ name: "handler2" });

		equal( autosave.getHandlers().length, 2, "Two handlers present after adding a single handler" );

		autosave.addHandlers( [ { name: "handler3" }, { name: "handler4" } ] );

		equal( autosave.getHandlers().length, 4, "Four handlers present after adding two more handlers" );
	});

})( jQuery );