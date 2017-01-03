/* start-build-ignore */
define([
  "jquery",
  "vendor/fixture",
  "vendor/jquery.deferred.sequence"
], function($, Fixture) {
/* end-build-ignore */

var id = 0;

function Autosave(element, options) {
  var $element = $([]),
    repository = new Fixture.Repository(),
    self = this,
    uuid = id++;

  // Allow calling without the 'new' operator
  if (!(this instanceof Autosave)) {
    return new Autosave(element, options);
  }

  // Allow omission of element argument
  if ($.isPlainObject(element)) {
    options = element;
    element = undefined;
  }

  // Private properties
  options = $.extend(true, {}, Autosave.options, options);

  /**
   * Attach the given elements to this instance.
   * @param element The form to attach to.
   * @param fixtures Fixtures to add after attachment.
   */
  function attach(element, fixtures) {
    detach();
    $element = $(element).addClass(options.namespace + " " + self.getUuid()).data(options.namespace, this);
    return addFixtures(fixtures);
  }

  /**
   * Add fixtures with deferred support.
   * @param fixtures The fixture(s) to add.
   * @returns Deferred result.
   */
  function addFixtures(fixtures) {
    return new $.Deferred.Sequence(fixtures).reduce(function(item) {
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
    return removeFixtures().done(function() {
      $element.removeClass(options.namespace + " " + self.getUuid()).removeData(options.namespace);
      $element = $([]);
    });
  }

  /**
   * Return the elements this instance is attached to.
   * @returns jQuery object of attached elements.
   */
  function getElements() {
    return $element;
  }

  /**
   * Get fixtures from the repository.
   * @param filter Fixture name, UUID or instance to search for. If no present, all fixtures will be returned.
   * @returns List of matching fixtures.
   */
  function getFixtures(filter) {
    return repository.get(filter);
  }

  /**
   * Get input elements within the attached elements.
   * @param filter A filtering selector, function, DOM element or jQuery object to run against all inputs.
   * @returns jQuery object of matching inputs.
   */
  function getInputs(filter) {
    var $inputs = $element.find(":input").addBack().filter(":input");
    return (filter ? $inputs.filter(filter) : $inputs).not(options.ignore);
  }

  /**
   * Get an Object containing all option key/value pairs, or a single option value.
   * @param key The name of an option value to get.
   * @returns Object of option key/value pairs, or a single option value.
   */
  function getOptions(key) {
    return key === undefined ? options : options[key];
  }

  function getUuid() {
    return options.namespace + "-" + uuid;
  }

  /**
   * Remove fixtures with deferred support.
   * @param fixtures The fixture(s) to remove.
   * @returns Deferred result.
   */
  function removeFixtures(fixtures) {
    return new $.Deferred.Sequence(getFixtures(fixtures)).reduce(function(fixture) {
      return $.when(fixture.detach(self)).done(function() {
        repository.remove(fixture);
      });
    });
  }

  // Public methods
  this.addFixture = this.addFixtures = addFixtures;
  this.attach = attach;
  this.detach = detach;
  this.getElement = this.getElements = getElements;
  this.getFixture = this.getFixtures = getFixtures;
  this.getInput = this.getInputs = getInputs;
  this.getOption = this.getOptions = getOptions;
  this.getUuid = getUuid;
  this.removeFixture = this.removeFixtures = removeFixtures;

  // Initialization
  this.attach(element, options.fixture || options.fixtures).done(options.ready);
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

  save: function(event, inputFilter, data) {
    var sequence, value;

    // Event argument may be omitted
    if (!(event instanceof $.Event)) {
      data = inputFilter;
      inputFilter = event;
      event = undefined;
    }

    sequence = new $.Deferred.Sequence(this.getFixtures());
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
