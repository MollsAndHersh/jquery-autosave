define( [ 'jquery', 'qunit' ], function( $, QUnit ) {
	QUnit.module( "Core" );

	QUnit.test( "Dependencies", function() {
		QUnit.expect( 5 );

		QUnit.ok( $, "jQuery exists" );
		QUnit.ok( $.Autosave, "jQuery.Autosave exists" );
		QUnit.ok( $.Autosave.Handler, "jQuery.Autosave.Handler exists" );
		QUnit.ok( $.Autosave.Sequence, "jQuery.Autosave.Sequence" );
		QUnit.ok( $.fn.autosave, "jQuery.fn.Autosave exists" );
	});

	// TODO: move to unit/autosave.js and unit/jquery-bridge.js
	QUnit.test( "Initialization / Destruction", function() {
		var fixture = $( "#qunit-fixture" ).autosave(),
			autosave = fixture.data( "autosave" );

		QUnit.expect( 3 );

		QUnit.ok( autosave instanceof jQuery.Autosave, "Autosave instance stored in element." );
		QUnit.equal( autosave.inputs().length, 11, "Element contains 11 inputs (one is ignored)." );

		autosave.destroy();

		QUnit.equal( fixture.data( "autosave" ), undefined, "Autosave instance has been destroyed." );
	});
});
