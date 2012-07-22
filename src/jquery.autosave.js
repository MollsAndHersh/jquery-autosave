/*
jQuery.autosave v2.0.0-rc1
https://github.com/kflorence/jquery-autosave/
Periodically saves form data based on a set of critera.

Inspired by the jQuery.autosave plugin written by Raymond Julin,
Mads Erik Forberg and Simen Graaten.

Dual licensed under the MIT and BSD Licenses.
*/

(function( $, undefined ) {

$.widget( "kf.autosave", {
    version: "2.0.0-rc1",
    queues: $({}),
    options: {
        ignore: ":hidden",

        trigger: "interval",
        scope: "all",
        data: "serialize",
        condition: "changed",
        save: "ajax",

        // callbacks
        change: null,
        complete: null
    },

    _create: function() {
        var form,
            element = this.element;

        if ( element.is( "form" ) ) {
            form = element;

        } else if ( !( form = element.find( "form" ) ).length ) {
            form = element.closest( "form" );
        }

        if ( !( this.form = form ).length ) {
            throw "Unable to locate form!";
        }

        // Listen for changes on the inputs
        $.each( "change keyup".split( " " ), $.proxy(function( i, eventName ) {
            element.on( eventName + this.eventNamespace, ":input", $.proxy( this._change, this ) );
        }, this ));

        // Set up triggers
        // TODO
    },

    _change: function( event ) {
        var target = $( event.target );

        if ( !target.hasClass( this.options.ignore ) ) {
            target.addClass( this.widgetFullName + "-changed" );
            this.element._trigger( "change", event );
        }
    },

    _destroy: function() {
        this.interval();

        this.element
            .off( this.eventNamespace )
            .find( ":input" ).removeClass( this.widgetFullName + "-changed" );
    },

    _resolveHandler: function( handler ) {
        var handler = {},
            type = typeof handler;

        if ( type == "function" ) {
            handler.handler
    },

    _save: function() {
        // TODO
    },

    interval: function( interval, callback ) {
        if ( this.timer ) {
            clearTimeout( this.timer );
            this.timer = null;
        }

        if ( !isNaN( parseInt( interval ) ) &&  $.isFunction( callback ) ) {
            this.timer = setTimeout( $.proxy( callback, this ), interval );
        }
    }
});

})( jQuery );
