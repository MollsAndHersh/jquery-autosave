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
/*
    addHandler: function( handlers ) {
        var handler, i, length,
            chain = new $.Deferred(),
            promise = chain;

        handlers = Handler.resolveHandler( handlers );

        for ( i = 0, length = handlers.length; i < length; i++ ) {
            handler = handlers[ i ];
            promise = promise.pipe( pipe( handler ) );
            promise.done( done.call( this, handler ) );
        }

        chain.resolve();

        return promise;
    },
*/
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
    }/*,

    save: function( event, inputs ) {
        var handler,
            chain = new $.Deferred(),
            deferred = new $.Deferred(),
            promise = chain;

        // args: inputs
        if ( !( event instanceof $.Event ) ) {
            inputs = event;
            event = undefined;
        }

        for ( handler in this.handlers ) {
            if ( this.handlers.hasOwnProperty( handler ) ) {
                handler = this.handlers[ handler ];
                promise = promise.pipe( pipe( handler ) );
                promise.fail( fail( deferred ) );
            }
        }

        // Resolve deferred when the last promise is done
        promise.done( done( deferred ) );

        // Start the chain
        chain.resolve({
            data: {},
            event: event,
            inputs: inputs ? $( inputs ).filter( ":input" ) : this.inputs()
        });

        return deferred.promise();
    }*/
});

// Public Static
$.extend( Autosave, {
    classNames: classNames,
    eventNames: eventNames,
    handlers: {},
    namespace: namespace,

    options: {
        handler: null,
        ignore: ":hidden",

        // Callbacks
        change: $.noop,
        save: $.noop,
        ready: $.noop
    },

    version: "<%= pkg.version %>"
});
