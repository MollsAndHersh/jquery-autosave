define([
  "jquery",
  "qunit",
  "vendor/fixture",
  "test/testutils",
  "src/jquery-bridge"
], function($, QUnit, Fixture, utils) {
  return function unit() {
    QUnit.module("Autosave", {
      beforeEach: function() {
        Fixture.definitions = {};
      }
    });

    QUnit.test("constructor", function(assert) {
      var expects = 0;

      function change() {}

      function ready() {
        assert.ok(true, "Ready called");
        expects += 1;
      }

      utils.defining(new $.Autosave(), function(autosave) {
        var expected = {
          change: $.noop,
          fixture: null,
          ignore: ":disabled",
          namespace: "autosave",
          ready: $.noop
        };

        assert.deepEqual(autosave.getOptions(), expected, "Default options used.");
        assert.equal(autosave.getFixtures().length, 0, "Fixtures array exists and is empty.");

        expects += 2;
      });

      utils.defining(new $.Autosave({
        change: change,
        ready: ready
      }), function(autosave) {
        assert.ok(autosave.getOption("change") === change, "Custom change function used.");
        assert.ok(autosave.getOption("ready") === ready, "Custom ready function used.");

        expects +=2;
      });

      assert.expect(expects);
    });

    QUnit.test("addFixture(s)", function(assert) {
      var autosave = new $.Autosave(),
        data = [
          "fixture1",
          "fixture2",
          ["fixture3", "fixture4"]
        ],
        dfds = [],
        done = assert.async(),
        expects = 0,
        tests = utils.map(data, function(name) {
          return {
            name: name,
            attach: function(autosave) {
              assert.ok(autosave instanceof $.Autosave, "Attach called for " + this.name);
              expects++;
            }
          };
        });

      function hasher(data) {
        return data.name;
      }

      $.each(tests, function(index, test) {
        var hash = utils.getHash(test, hasher),
          dfd = autosave["addFixture" + ($.isArray(test) ? "s" : "" )](test).done(function() {
            assert.ok(new RegExp(hash + "$").test(utils.getHash(autosave.getFixtures(), hasher)), "Added " + hash);
            expects++;
          });

        dfds.push(dfd);
      });

      $.when.apply($, dfds).always(function() {
        assert.expect(expects);
        done();
      });
    });

    QUnit.test("attach", function(assert) {
      var $qunitFixture = $("#qunit-fixture"),
        autosave = new $.Autosave();

      assert.equal(autosave.getElement().length, 0, "No elements are attached on initialization.");
      autosave.attach($qunitFixture);
      assert.equal(autosave.getElement().length, 1, "One element is attached.");
      assert.ok(autosave.getElement().hasClass("autosave"), "Element has namespace class.");
      assert.equal(autosave.getElement().data("autosave"), autosave, "Element has instance stored in data.");
      autosave.attach("#qunit-fixture [name=text]");
      assert.ok(!$qunitFixture.hasClass("autosave"), "Detached element does not have namespace class.");
      assert.ok(!$qunitFixture.data("autosave"), "Detached element does not have instance stored in data.");
      assert.equal(autosave.getElement().length, 1, "Attached to new element.");
      assert.ok(autosave.getElement().hasClass("autosave"), "New element has namespace class.");
      assert.equal(autosave.getElement().data("autosave"), autosave, "New element has instance stored in data.");

      assert.expect(9);
    });

    QUnit.test("detach", function(assert) {
      var done = assert.async();
      var expects = 0;
      var autosave = new $.Autosave("#qunit-fixture", {
        fixtures: [
          {
            detach: function() {
              assert.ok(true, "Detach called.");
              expects++;
            }
          },
          {
            detach: function() {
              var dfd = $.Deferred();
              setTimeout(function() {
                assert.ok(true, "Deferred detach called.");
                expects++;
                dfd.resolve();
              }, 0);
              return dfd;
            }
          }
        ]
      });

      autosave.detach().done(function() {
        var $qunitFixture = $("#qunit-fixture");
        assert.ok(true, "Done called.");
        assert.equal(autosave.getElement().length, 0, "Element is not attached.");
        assert.ok(!$qunitFixture.hasClass("autosave"), "Element does not have namespace class.");
        assert.ok(!$qunitFixture.data("autosave"), "Element does not have instance stored in data.");
        expects += 4;
        assert.expect(expects);
        done();
      });
    });

    QUnit.test("getElement(s)", function(assert) {
      var autosave = new $.Autosave();

      assert.equal(autosave.getElement().length, 0, "Not attached to any elements.");
      autosave.attach("form [name=text]");
      assert.equal(autosave.getElements().length, 1, "Attached to one element.");

      assert.expect(2);
    });

    QUnit.test("getFixture(s)", function( assert ) {
      var autosave = new $.Autosave({
          fixtures: [
            new Fixture({ name: "fixturefoo" }),
            { name: "fixture" },
            { name: "fixture.foo" }
          ]
        }),
        expects = 0,
        fixtures = autosave.getFixtures(),
        tests = [
          [ undefined, "fixturefoo, fixture, fixture.foo" ],
          [ null, "fixturefoo, fixture, fixture.foo" ],
          [ fixtures[ 1 ].uuid, "fixture" ],
          [ "fixture", "fixture, fixture.foo" ],
          [ "fixture.foo", "fixture.foo" ],
          [ "fixturefoo", "fixturefoo" ],
          [ fixtures[ 0 ], "fixturefoo" ]
        ];

      function hasher(fixture) {
        return fixture.name;
      }

      $.each(tests, function(index, test) {
        assert.equal(utils.getHash(autosave.getFixtures(test[0]), hasher), test[1], "Got " + test[1]);
        expects++;
      });

      assert.expect(expects);
    });

    QUnit.test("getInput(s)", function(assert) {
      var autosave = new $.Autosave("#qunit-fixture"),
        tests = [
          [undefined, 11],
          [":input", 11],
          ["[name=text]", 1]
        ];

      $.each(tests, function(index, test) {
        assert.equal(autosave.getInputs(test[0]).length, test[1], "Got " + test[1] + " inputs.");
      });

      assert.expect(tests.length);
    });

    QUnit.test("getOption(s)", function(assert) {
      var autosave,
        expects = 0,
        tests = {
          fixture: {
            name: "fixture"
          },
          ignore: ".ignore",
          namespace: "myNamespace",
          ready: function() {}
        };

      autosave = new $.Autosave($.extend({}, tests));

      $.each(tests, function(key) {
        assert.deepEqual(autosave.getOption(key), tests[key], "Got option value for '" + key + "'." );
        expects++;
      });

      assert.deepEqual(autosave.getOptions(), $.extend({}, $.Autosave.options, tests), "Got all options." );
      expects++;

      assert.expect(expects);
    });

    QUnit.test("removeFixture(s)", function(assert) {
      var autosave,
        data = [
          "fixture1",
          "fixture2",
          ["fixture3", "fixture4"]
        ],
        dfds = [],
        done = assert.async(),
        expects = 0;

      autosave = $.Autosave({
        fixtures: utils.map($.map(data, function(value) {
          return value;
        }), function(name) {
          return {
            name: name,
            detach: function(instance) {
              assert.ok(true, "Detach called for " + this.name);
              assert.ok(this instanceof Fixture, "Fixture has proper context.");
              assert.equal(instance, autosave, "Fixture has proper arguments.");
              expects += 3;
            }
          };
        })
      });

      function hasher(data) {
        return data.name;
      }

      $.each(data, function(index, datum) {
        var hash = $.makeArray(datum).join(", "),
          dfd = autosave["removeFixture" + ($.isArray(datum) ? "s" : "") ](datum).done(function() {
            assert.ok(!(new RegExp(hash).test(utils.getHash(autosave, hasher))), "Removed " + hash);
            expects++;
          });

        dfds.push(dfd);
      });

      $.when.apply($, dfds).always(function() {
        assert.expect(expects);
        done();
      });
    });
  };
});
