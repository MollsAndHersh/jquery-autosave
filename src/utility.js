function arr( obj ) {
    return $.isArray( obj ) ? obj : [ obj ];
}

function error( message ) {
    throw new Error( "( " + namespace + " ) " + message );
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
