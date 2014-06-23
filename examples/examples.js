/* jshint browser: true, devel: true */
/* global require */
(function( window ) {
	require.config({
		baseUrl: "../",
		paths: {
			"fixture": "vendor/fixture",
			"jquery": "vendor/jquery"
		}
	});

	require( [
		"jquery",
		"fixture",
		"vendor/jquery.deferred.sequence",
		"dist/jquery.autosave"
	], function( $ ) {
        var example = $( "#example1" );

        example.autosave({
            fixtures: [
                // Reduce inputs to type=text
                function( state ) {
                    state.inputs = state.inputs.filter( ":text" );
                },
                // Serialize inputs
                function( state ) {
                    var dfd = $.Deferred();

                    window.setTimeout(function() {
                        state.data = state.inputs.serialize();
                        dfd.resolve(state);
                    }, 1000);

                    return dfd;
                }
            ],
            ready: function() {
                console.log( "ready" );
            }
        }).find( "[type=text]" ).val( "text" );

        example.data( "autosave" ).save().done(function( response ) {
            console.log( "done:", response );

        }).fail(function( message ) {
            console.log( "failed: " + message );
        });
	});
})( this );