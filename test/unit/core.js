(function( $, undefined ) {
    module( "Core" );

    test( "Requirements", function() {
        expect( 4 );

        ok( jQuery, "jQuery exists" );
        ok( $, "$ exists" );
        ok( $.Autosave, "$.Autosave exists" );
        ok( $.fn.autosave, "$.fn.Autosave exists" );
    });

    test( "Initialization / Destruction", function() {
        expect( 4 );

        var fixture = $( "#qunit-fixture" ).autosave(),
            autosave = fixture.data( 'autosave' );

        ok( autosave instanceof jQuery.Autosave, "Autosave instance stored in element." );
        equal( autosave.form.length, 1, "Element contains one form." );
        equal( autosave.inputs().length, 11, "Element contains 11 inputs (one is ignored)." );

        autosave.destroy();

        equal( fixture.data( "autosave" ), undefined, "Autosave instance has been destroyed." );
    });

})( jQuery );
