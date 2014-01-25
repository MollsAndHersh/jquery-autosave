(function() {
	var source = [
			'jquery-bridge'
		],
		units = [
			'unit/autosave'
		];

	require.config({
		baseUrl: '../src',
		paths: {
			jquery: '../bower_components/jquery/jquery',
			unit: '../test/unit'
		}
	});

	// Defer QUnit test runner until all tests have loaded
	QUnit.config.autostart = false;
	require( source.concat( units ), QUnit.start );
})();