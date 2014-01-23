(function() {
	var src = [
			'jquery-bridge'
		],
		units = [
			'unit/core',
			'unit/autosave'
		];

	QUnit.config.autostart = false;

	require.config({
		baseUrl: '../src',
		paths: {
			unit: '../test/unit',
			jquery: 'empty:'
		}
	});

	// Defer QUnit test runner until all tests have loaded
	require( src.concat( units ), QUnit.start );
})();