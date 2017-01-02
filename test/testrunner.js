(function() {
	require.config({
		baseUrl: "../",
		paths: {
			"jquery": "vendor/jquery",
      "qunit": "vendor/qunit/qunit"
		}
	});

	// Defer QUnit test runner until all tests have loaded
	require(["qunit", "test/unit/autosave"], function(QUnit, tests) {
    tests();
    QUnit.start();
  });
})();
