(function() {
	var dependencies = [
			"jquery-bridge",
			"testutils"
		],
		units = [
			"unit/autosave"
		];

	require.config({
		baseUrl: "../src",
		paths: {
			jquery: "../bower_components/jquery/jquery",
			testutils: "../test/testutils",
			unit: "../test/unit"
		}
	});

	// Defer QUnit test runner until all tests have loaded
	require( dependencies.concat( units ), QUnit.start );
})();