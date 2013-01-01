function arr( obj ) {
    return $.isArray( obj ) ? obj : [ obj ];
}

function error( message ) {
    throw new Error( "( " + namespace + " ) " + message );
}

function join( obj, separator ) {
    var k,
        items = [];

    if ( typeof obj.join === "function" ) {
        items = obj;

    } else {
        for ( k in obj ) {
            if ( obj.hasOwnProperty( k ) ) {
                items.push( obj[ k ] );
            }
        }
    }

    return items.join( separator );
}

function namespacer( namespace, items, separator, before ) {
    var i, item,
        length = items.length,
        namespaced = {};

    if ( length && namespace ) {
        if ( !separator ) {
            separator = ".";
        }

        for ( i = 0; i < length; i++ ) {
            item = items[ i ];
            namespaced[ item ] = before ?
                namespace + separator + item :
                item + separator + namespace;
        }
    }

    return namespaced;
}
