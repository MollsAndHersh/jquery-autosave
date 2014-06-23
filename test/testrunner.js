(function() {
	var units = [
		"test/unit/autosave"
	];

	require.config({
		baseUrl: "../",
		paths: {
			"jquery": "vendor/jquery"
		}
	});

	// Defer QUnit test runner until all tests have loaded
	require( units, QUnit.start );
})();