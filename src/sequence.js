var aps = Array.prototype.slice;

function scopedFunc() {
    var args = aps.call( arguments, 0 ),
        func = args.shift();

    return function() {
        return func.apply( this, args.concat( arguments ) );
    };
}

function Sequence( settings, process ) {
    return process === true ? this.process( settings ) : this.update( settings );
}

Sequence.prototype = {
    constructor: Sequence,

    process: function( settings ) {
        this.update( settings );

        this.head = new $.Deferred();
        this.deferred = new $.Deferred();
        this.tail = this.head;

        $.each( this.settings.items, $.proxy( function( i, item ) {
            this.tail = this.tail.then( scopedFunc( this.settings.each, this.tail, item ) );
        }, this ) );

        this.tail.done( scopedFunc( this.deferred.resolve ) );
        this.head.resolve( this.settings.data );

        return this.deferred.promise();
    },

    update: function( settings ) {
        if ( settings ) {
            this.settings = $.extend( true, {}, Sequence.settings, settings );
        }

        return this;
    }
};

Sequence.settings = {
    data: {},
    each: function( dfd, item, data ) {
        return data;
    },
    items: []
};

// Setters
$.each( Sequence.settings, function( key ) {
    Sequence.prototype[ key ] = function( value ) {
        this.settings[ key ] = value;

        return this;
    };
});
