var classNames = namespacer( namespace, [ "change" ], "-", true ),
    eventNames = namespacer( namespace, [ "change", "keyup" ] );

function Autosave( element, options ) {
    var form;

    this.element = element = $( element );
    this.options = options;

    // Try to find the form associated the given element
    if ( element.is( "form" ) ) {
        form = element;

    } else if ( !( form = element.find( "form" ) ).length ) {
        form = element.closest( "form" );
    }

    this.form = form;

    // Listen for changes on inputs
    // FIXME: https://github.com/nervetattoo/jquery-autosave/issues/18
    element.on( eventNames.change + " " + eventNames.keyup, ":input", function( event ) {
        var target = $( event.target );

        if ( !target.hasClass( options.ignore ) ) {
            target.addClass( classNames.change );
            options.change.apply( target, event );
        }
    });

    this.addHandler( options.handler || options.handlers ).done( options.ready );
}

$.extend( Autosave.prototype, {
    addHandler: function( handler ) {
        var handlers = this.handlers,
            sequence = new Sequence( Handler.resolveHandler( handler ) );

        return sequence.reduce(function( handler ) {
            return $.when( handler.setup() ).done(function() {
                handlers[ handler.uuid ] = handler;
            });
        });
    },

    destroy: function() {
        this.interval();

        this.element.removeData( namespace ).off( "autosave" );
        this.inputs().removeClass( classNames.change );

        return this.removeHandler( this.handlers );
    },

    handlers: {},

    inputs: function() {
        return this.element.find( ":input" ).not( this.options.ignore );
    },

    interval: function( interval, callback ) {
        if ( this.timer ) {
            clearTimeout( this.timer );
            this.timer = null;
        }

        if ( !isNaN( parseInt( interval, 10 ) ) && $.isFunction( callback ) ) {
            this.timer = setTimeout( $.proxy( callback, this ), interval );
        }
    },

    removeHandler: function() {
        // TODO
    },

    save: function( event, inputs, data ) {
        var sequence = new Sequence( this.handlers );

        // Args: inputs, data
        if ( !( event instanceof $.Event ) ) {
            data = inputs;
            inputs = event;
            event = undefined;
        }

        return sequence.reduce({
            data: data,
            event: event,
            inputs: inputs ? $( inputs ).filter( ":input" ) : this.inputs()
        }, function( handler, data ) {
            var dfd = $.Deferred();

            $.when( handler.run( data ) ).done(function( response ) {
                dfd.resolve( response !== undefined ? response : data );
            }).fail( sequence.master.reject );

            return dfd;
        });
    }
});

// Public Static
$.extend( Autosave, {
    classNames: classNames,
    eventNames: eventNames,
    handlers: {},
    namespace: namespace,

    options: {
        handler: null,
        ignore: ":disabled",

        // Callbacks
        change: $.noop,
        save: $.noop,
        ready: $.noop
    },

    version: "<%= pkg.version %>"
});

// Exports
$.Autosave = Autosave;
