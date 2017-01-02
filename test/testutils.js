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

	utils.defining = function() {
		var args = utils.slice( arguments, 0 );
		var lastIndex = args.length - 1;
		var func = args[ lastIndex ];
		return func.apply( null, args.splice( 0, lastIndex ) );
	};

	// Generate a hash from an array of fixtures or fixture-like objects
	utils.getHash = function( obj, callback ) {
		return $.map($.makeArray( obj ), callback).join( ", " );
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

	utils.slice = slice;

	return utils;
});
