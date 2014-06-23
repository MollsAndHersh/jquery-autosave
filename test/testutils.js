define( [
	"jquery",
	"vendor/poly/function"
], function(
	$
) {
	var slice = Function.prototype.call.bind( Array.prototype.slice ),
		utils = {};

	// .apply() for constructors. IE9+
	utils.constructorApply = function( constructor, args ) {
		return new ( constructor.bind.apply( constructor, [ null ].concat( args ) ) )();
	};

	// Generate a hash from an array of fixtures or fixture-like objects
	utils.getHash = function( obj, callback ) {
		return $.map(
			obj instanceof $.Autosave ? obj.getFixtures() : $.makeArray( obj ), callback
		).join( ", " );
	};

	// Process a set of data against a callback and generate a new set of data
	utils.map = function( data, callback ) {
		var result = [];

		$.each( data, function( index, datum ) {
			var value = $.isArray( datum ) ? $.map( datum, callback ) : callback( datum );

			if ( value ) {
				result.push( value );
			}
		});

		return result;
	};

	// Returns the number of properties in an object
	utils.objectLength = function( obj ) {
		var prop,
			length = 0;

		for ( prop in obj ) {
			if ( obj.hasOwnProperty( prop ) ) {
				length++;
			}
		}

		return length;
	};

	// Process a value against context and args.
	utils.process = function( mixed, context ) {
		return $.isFunction( mixed ) ? mixed.apply( context, slice( arguments, 2 ) ) : mixed;
	};

	// Run tests against a factory instance
	utils.runFactoryTests = function( factory, tests, message ) {
		var expects = 0,
			current = {};

		$.each( tests, function( testIndex, test ) {
			var cases = test.cases || [];

			current.instance = factory( test.args );
			current.test = $.extend( {}, test );
			current.test.index = testIndex;

			utils.process( test.setup, current );

			$.each( cases, function( testCaseIndex, testCase ) {
				var args,
					assert = testCase.assert || equal;

				current.testCase = $.extend( {}, testCase );
				current.testCase.index = testCaseIndex;
				current.testCase.actual = utils.process( testCase.actual, current );
				current.testCase.expected = utils.process( testCase.expected, current );
				current.testCase.message = utils.process( testCase.message, current );

				if ( message ) {
					current.testCase.message = utils.process( message, current );
				}

				args = [ current.testCase.actual, current.testCase.expected, current.testCase.message ];
				if ( assert === ok ) {
					args.splice( 1, 1 );
				}

				assert.apply( QUnit, args );
			});

			utils.process( test.teardown, current );

			expects += cases.length;
		});

		return expects;
	};

	return utils;
});