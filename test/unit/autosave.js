define( [ "jquery-bridge", "testutils" ], function( $, utils ) {
	var autosaveFactory = utils.constructorApply.bind( null, $.Autosave );

	module( "Autosave", {
		setup: function() {
			$.Autosave.Handler.prototypes = {};
		}
	});

	test( "constructor", function() {
		var tests,
			expects = {
				ready: 1
			},
			index = 0,
			totalExpects = 0;

		function change() {}

		function getHandlers() {
			return this.instance.getHandlers();
		}

		function getOptions() {
			return this.instance.getOptions();
		}

		function ready() {
			ok( true, "Ready called" );
		}

		tests = [
			{
				cases: [
					{
						actual: getOptions,
						assert: deepEqual,
						expected: {
							change: $.noop,
							handler: null,
							ignore: ":disabled",
							namespace: "autosave",
							ready: $.noop
						},
						message: "Default options used."
					},
					{
						actual: getHandlers,
						assert: deepEqual,
						expected: [],
						message: "Handlers array exists and is empty."
					}
				]
			},
			{
				args: [
					{
						change: change,
						ready: ready
					}
				],
				cases: [
					{
						actual: function() {
							return this.instance.getOption( 'change' ) === change;
						},
						assert: ok,
						message: "Custom change function used."
					},
					{
						actual: function () {
							return this.instance.getOption( 'ready' ) === ready;
						},
						assert: ok,
						message: "Custom ready function used."
					}
				]
			}
		];

		expects.tests = utils.runFactoryTests( autosaveFactory, tests, function() {
			return "Instance " + this.test.index + ": " + this.testCase.message;
		});

		$.each( expects, function( name, amount ) {
			totalExpects += amount;
		});

		expect( totalExpects );
	});

	test( "addHandler(s)", function() {
		var instance,
			data = [
				"handler1",
				"handler2",
				[ "handler3", "handler4" ]
			],
			tests = utils.map( data, function( name ) {
				return {
					name: name,
					setup: function( autosave ) {
						ok( autosave instanceof $.Autosave, "Setup called for " + this.name );
					}
				};
			});

		function hasher( data ) {
			return data.name;
		}

		$.each( tests, function( index, test ) {
			var hash = utils.getHash( test, hasher );

			if ( index === 0 ) {
				instance = new $.Autosave({ handler: test });

			} else {
				instance[ "addHandler" + ( $.isArray( test ) ? "s" : "" ) ]( test );
			}

			ok( new RegExp( hash + "$" ).test( utils.getHash( instance, hasher ) ), "Added " + hash );
		});

		expect( 7 );
	});

	test( "attach", function() {
		var expects,
			tests,
			elementExists = {
				actual: function() {
					return this.instance.getElement() instanceof jQuery;
				},
				expected: true,
				message: "Element is attached."
			};

		function elementHasClass() {
			return this.instance.getElement().hasClass( 'autosave' );
		}

		function getElementData() {
			return this.instance.getElement().data( 'autosave' );
		}

		function getElementLength() {
			return this.instance.getElement().length;
		}

		tests = [
			{
				cases: [
					{
						actual: elementHasClass,
						expected: false,
						message: "Element does not have namespace class."
					},
					{
						actual: getElementData,
						expected: undefined,
						message: "Element does not have instance stored in data."
					},
					{
						actual: getElementLength,
						expected: 0,
						message: "Element contains zero DOM Elements."
					}
				]
			},
			{
				args: [
					$( "#qunit-fixture" )
				],
				cases: [
					{
						actual: elementHasClass,
						expected: true,
						message: "Element has namespace class."
					},
					{
						actual: getElementData,
						expected: function() {
							return this.instance;
						},
						message: "Element has instance stored in data."
					},
					{
						actual: getElementLength,
						expected: 1,
						message: "Element contains one DOM Element."
					}
				]
			}
		];

		// Every test gets element exists check
		$.each( tests, function( index, test ) {
			test.cases.unshift( elementExists );
		} );

		expects = utils.runFactoryTests( autosaveFactory, tests, function() {
			return "Instance " + this.test.index + ": " + this.testCase.message;
		});

		expect( expects );
	});

	test( "getHandler(s)", function() {
		var instance = new $.Autosave({
				handlers: [
					function() {},
					{ name: "handler" },
					{ name: "handler.foo" },
					new $.Autosave.Handler({ name: "handlerfoo" })
				]
			}),
			tests = [
				[ undefined, "0, 1, 2, 3" ],
				[ null, "0, 1, 2, 3" ],
				[ 1, "1" ],
				[ "handler", "1, 2" ],
				[ "handler.foo", "2" ],
				[ "handlerfoo", "3" ],
				[ instance.getHandler( 3 ), "3" ]
			];

		function hasher( handler ) {
			return handler.data.index;
		}

		$.each( tests, function( index, test ) {
			equal( utils.getHash( instance.getHandlers( test[ 0 ] ), hasher ), test[ 1 ], "Got " + test[ 1 ] );
		});

		expect( tests.length );
	});
});