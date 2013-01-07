var aps = Array.prototype.slice;

function scopedFunc( func /* , arg, ..., argN */ ) {
    var args = aps.call( arguments, 1 );

    return function() {
        return $.when( func.apply( this, args.concat( arguments ) ) );
    };
}

function Sequence( items, each ) {
    var head = $.Deferred(),
        master = $.Deferred(),
        tail = head;

    $.each( items, function( i, item ) {
        tail = tail.pipe( scopedFunc( each, tail, item ) );
        tail.fail( scopedFunc( master.reject ) );
    });

    tail.done( scopedFunc( master.resolve ) );

    return {
        head: head,
        master: master,
        start: function( args, context ) {
            head.resolveWith( context || this, arr( args ) );
            return master;
        },
        tail: tail
    };
}

// Export
$.Deferred.Sequence = Sequence;
