$.fn.autosave = function( options ) {
	return this.each(function() {
		new Autosave( this, options );
	});
};
