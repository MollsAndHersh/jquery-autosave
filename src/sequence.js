Sequence = (function() {
	var slice = [].slice;

	function scopedFunc( func ) {
		var args = slice.call( arguments, 1 );

		return function() {
			return func.apply( this, args.concat( slice.call( arguments ) ) );
		};
	}

	return function( items ) {
		var head = $.Deferred(),
			master = $.Deferred(),
			tail = head;

		items = $.makeArray( items );

		return {
			head: head,
			items: items,
			master: master,
			reduce: function( value, func, context ) {

				// Args: func, context
				if ( typeof value === "function" ) {
					context = func;
					func = value;
					value = undefined;
				}

				head.resolveWith( context, $.makeArray( value ) );

				$.each( items, function( i, item ) {
					tail = tail.pipe( scopedFunc( func, item ) );
				});

				tail.done( scopedFunc( master.resolve ) );

				return master;
			},
			tail: tail
		};
	};
})();
