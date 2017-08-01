var _ = require('underscore'),
    ngeohash = require('ngeohash');
    
exports.locale2Country = function (locale) {
    if(!locale || locale.indexOf('_') === -1) return locale;
    return locale.split('_')[1];
}

// parse and convert string to float or NaN to null
exports.f2n = function(n) {
    n = parseFloat(n);
    if(_.isFinite(n)) 
        return n;
    return null; 
}

exports.loc2hash = function(lat, lng) {
    //eg 29.6665,116.0097
    if(!lat || !lng) return null;
    return ngeohash.encode(lat, lng).slice(0, 5);
}
