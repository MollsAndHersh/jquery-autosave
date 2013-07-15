(function( $, undefined ) {
  module( "Core" );

  test( "Requirements", function() {
      expect( 4 );

      ok( jQuery, "jQuery exists" );
      ok( $, "$ exists" );
      ok( $.Autosave, "$.Autosave exists" );
      ok( $.fn.autosave, "$.fn.Autosave exists" );
  });

  test( "Initialization", function() {
      var $autosave = $( "#qunit-fixture" ).autosave(),
          autosave = $autosave.data( "autosave" );

      ok( autosave, "Autosave instance stored in element." );
      equal( autosave.form.length, 1, "Element contains one form." );
      equal( autosave.inputs().length, 12, "Element contains 12 inputs." );
  });

})( jQuery );
