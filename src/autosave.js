/* start-build-ignore */
define([
  "jquery",
  "src/namespacer",
  "vendor/fixture",
  "vendor/jquery.deferred.sequence"
], function($, namespacer, Fixture) {
/* end-build-ignore */

function Autosave(elements, options) {
  var classNames, eventNames, fixtures,
    $attached = $([]),
    repository = new Fixture.Repository(),
    self = this;

  // Allow calling without the 'new' operator
  if (!(this instanceof Autosave)) {
    return new Autosave(elements, options);
  }

  // Allow omission of element argument
  if ($.isPlainObject(elements)) {
    options = elements;
    elements = undefined;
  }

  // Options
  options = $.extend(true, {}, Autosave.options, options);
  classNames = namespacer(options.namespace, ["change"], "-", true);
  eventNames = namespacer(options.namespace, ["change", "keyup"]);
  fixtures = options.fixture || options.fixtures;

  /**
   * Attach the given elements to this instance.
   * @param elements A jQuery selector, a jQuery object, a DOM element or a list of DOM elements.
   */
  function attach(elements) {
    var $elements = $(elements);

    if ($elements.length) {
      $attached = $attached.add($elements).addClass(options.namespace).data(options.namespace, this);
    }

    // TODO: move this into a Fixture
    // FIXME: https://github.com/nervetattoo/jquery-autosave/issues/18
    // this.getInputs().on(this.eventNames.change + " " + this.eventNames.keyup, function(event) {
    //   var $target = $(event.target);
    //
    //   if (
    //     $target.not(self.options.ignore) &&
    //     !$target.hasClass(self.classNames.change)
    //   ) {
    //     $.when(
    //       self.options.change.apply($target.get(0), event)
    //     ).done(function() {
    //       $target.addClass(self.classNames.change);
    //     });
    //   }
    // });

    return $attached;
  }

  /**
   * Add fixtures with deferred support.
   * @param mixed The fixture(s) to add, will be normalized.
   * @returns Deferred result.
   */
  function addFixture(mixed) {
    return new $.Deferred.Sequence(mixed).reduce(function(item) {
      var fixture = Fixture.create(item);

      if (fixture) {
        return $.when(fixture.attach(self)).done(function() {
          repository.items.push(fixture);
        });
      }
    });
  }

  /**
   * Remove autosave functionality completely. Detaches all fixtures and elements.
   * @returns Deferred result.
   */
  function detach() {
    return removeFixture().done(function() {
      $attached.removeClass(options.namespace).removeData(options.namespace);
      $attached = $([]);

      // TODO: move this into a fixture
      //self.getInputs().off(self.options.namespace);
    });
  }

  /**
   * Return the elements this instance is attached to.
   * @returns jQuery object of attached elements.
   */
  function getElement() {
    return $attached;
  }

  /**
   * Get fixtures from the repository.
   * @param value Fixture name, UUID or instance to search for. If no present, all fixtures will be returned.
   * @returns List of matching fixtures.
   */
  function getFixture(value) {
    return repository.get(value);
  }

  /**
   * Get input elements within the attached elements.
   * @param filter A filtering selector, function, DOM element or jQuery object to run against all inputs.
   * @returns jQuery object of matching inputs.
   */
  function getInput(filter) {
    var $inputs = $attached.find(":input").addBack().filter(":input");
    return (filter ? $inputs.filter(filter) : $inputs).not(options.ignore);
  }

  /**
   * Get an Object containing all option key/value pairs, or a single option value.
   * @param key The name of an option value to get.
   * @returns Object of option key/value pairs, or a single option value.
   */
  function getOption(key) {
    return key === undefined ? options : options[key];
  }

  /**
   * Remove fixtures with deferred support.
   * @param mixed The fixture(s) to remove.
   * @returns Deferred result.
   */
  function removeFixture(mixed) {
    return new $.Deferred.Sequence(repository.get(mixed)).reduce(function(fixture) {
      return $.when(fixture.detach(self)).done(function() {
        repository.remove(fixture);
      });
    });
  }

  // Public properties
  this.classNames = classNames;
  this.eventNames = eventNames;

  // Public methods
  this.attach = attach;
  this.addFixture = addFixture;
  this.addFixtures = this.addFixture;
  this.detach = detach;
  this.getElement = getElement;
  this.getElements = this.getElement;
  this.getFixture = getFixture;
  this.getFixtures = this.getFixture;
  this.getInput = getInput;
  this.getInputs = this.getInput;
  this.getOption = getOption;
  this.getOptions = this.getOption;
  this.removeFixture = removeFixture;
  this.removeFixtures = this.removeFixture;

  // Initialization
  this.attach(elements);
  this.addFixtures(fixtures).done(options.ready);
}

$.extend(Autosave.prototype, {

  // TODO: move this into a Fixture
  // interval: function( interval, callback ) {
  //   if ( this.timer ) {
  //     clearTimeout( this.timer );
  //     this.timer = null;
  //   }
  //
  //   if ( !isNaN( parseInt( interval, 10 ) ) && $.isFunction( callback ) ) {
  //     this.timer = setTimeout( $.proxy( callback, this ), interval );
  //   }
  // },

  save: function(event, fixtureFilter, inputFilter, data) {
    var sequence, value;

    // Event argument may be omitted
    if (!(event instanceof $.Event)) {
      data = inputFilter;
      inputFilter = fixtureFilter;
      fixtureFilter = event;
      event = undefined;
    }

    sequence = new $.Deferred.Sequence(this.getFixtures(fixtureFilter));
    value = {
      data: data,
      event: event,
      inputs: this.getInputs(inputFilter)
    };

    return sequence.reduce(value, function(fixture, data) {
      var dfd = $.Deferred();

      $.when(fixture.interact(data)).done(function(response) {
        dfd.resolve(response !== undefined ? response : data);
      }).fail(sequence.master.reject);

      return dfd;
    });
  }
});

// Public Static
$.extend(Autosave, {
  options: {
    change: $.noop,
    fixture: null,
    ignore: ":disabled",
    namespace: "autosave",
    ready: $.noop
  },
  version: "<%= pkg.version %>"
});

/* start-build-ignore */
return Autosave;

});
/* end-build-ignore */
