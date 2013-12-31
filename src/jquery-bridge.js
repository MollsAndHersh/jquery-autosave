$.fn[ namespace ] = function( options ) {
	options = $.extend( true, {}, Autosave.options, options );

	return this.each(function() {
		$.data( this, namespace, new Autosave( this, options ) );
	});
};
