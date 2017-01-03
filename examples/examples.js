/* jshint browser: true, devel: true */
/* global require */
(function( window ) {
	require.config({
		baseUrl: "../",
		paths: {
			"jquery": "vendor/jquery"
		}
	});

	require( [
		"jquery",
		"vendor/fixture",
		"vendor/jquery.deferred.sequence",
		"src/jquery-bridge"
	], function( $, Fixture ) {
        var example = $( "#example1" );

        // Need to store custom autosave fixtures somewhere out of global scope
        Fixture.define("trigger.onEvent", function() {
          return {
            data: {
              eventName: "change"
            },
            attach: function(autosave) {
              var self = this;
              var eventName = this.data.eventName;

              // https://mathiasbynens.be/notes/oninput
              // http://caniuse.com/#feat=input-event
              if (eventName == "input") {

              }

              eventName = eventName + "." + autosave.getOption("namespace");
              var selector = "." + autosave.getUuid() + ":input, ." + autosave.getUuid() + " :input";

              $("body").on(eventName, selector, function(event) {
                console.log("event fired: " + self.data.eventName);
                autosave.save(event, event.target);
              });

              console.log("trigger.onEvent attached");
            }
          };
        }());

        example.autosave({
            fixtures: [
                { name: "trigger.onEvent", data: { eventName: "keyup" } },
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
                },
                // Log result
                function(state) {
                  console.log(state);
                }
            ],
            ready: function() {
                console.log( "ready" );
            }
        });

    // has different classname
    $("#example2").autosave();
	});
})( this );
