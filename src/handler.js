(function( $, undefined ) {

function Handler( settings ) {

    // Allow calling without the 'new' operator
    if ( !Handler.isHandler( this ) ) {
        return new Handler( settings );
    }

    $.extend( this, settings );

    this.uuid = uuid++;
}

Handler.isHandler = (function() {
    var matches,
        rFunctionName = /function ([^(]+)/;

    return function( object ) {
        return object != null && typeof object == "object" && object.constructor
            && ( matches = rFunctionName.exec( object.constructor.toString() ) )
            && matches[ 1 ] && matches[ 1 ].toLowerCase() == "handler";
    }
})();

Handler.prototype = {
    constructor: Handler,
    options: {},
    run: $.noop,
    setup: $.noop,
    teardown: $.noop
};

})( jQuery );