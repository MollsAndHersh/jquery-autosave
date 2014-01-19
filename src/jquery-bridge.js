define( [ "jquery", "autosave" ], function( $, Autosave ) {

$.Autosave = Autosave;

$.fn.autosave = function( options ) {
	return this.each(function() {
		new Autosave( this, options );
	});
};

return $;

});
