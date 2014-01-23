(function() {
	require.config({
		baseUrl: '../src',
		paths: {
			jquery: '../bower_components/jquery/jquery',
			qunit: '../bower_components/qunit/qunit/qunit',
			unit: '../test/unit'
		},
		shim: {
			qunit: {
				exports: 'QUnit'
			}
		}
	});

	require( [ 'qunit' ], function( QUnit ) {
		var source = [
				'jquery-bridge'
			],
			units = [
				'unit/core',
				'unit/autosave'
			];

		// Defer QUnit test runner until all tests have loaded
		require( source.concat( units ), QUnit.load );
	});
})();