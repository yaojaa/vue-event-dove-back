'use strict'
var _            = require("lodash"),
    seriaization = require('../util/serialization'),
    readData     = seriaization.readData,
    writeData    = seriaization.writeData,
    settings     = require("../conf/settings");


var initialized;

var refData = {};

exports.refData = refData;
exports.init    = init;

function init(args, cb) {

    console.time('loadcoredata');

    // try {
    // refData = {
    //     city:readData(settings.DATA_DIR + 'City.0'),
    //     province:readData(settings.DATA_DIR + 'Province.0'),
    //     country:readData(settings.DATA_DIR + 'Country.0'),
    //     countryRegion:readData(settings.DATA_DIR + 'CountryRegion.0'),
    //     paymentType:readData(settings.DATA_DIR+'PaymentType.0'),
    //     eventCategory:readData(settings.DATA_DIR+'EventCategory.0')
    //     //operation: readData(settings.DATA_DIR + 'Operation.0'),
    //     //userPackage: readData(settings.DATA_DIR + 'serPackage.0')
    // };
    // }
    // catch(e) {
    //     console.error(e);
    // }
    //
    // console.log('Loaded reference data ', _.keys(refData).join(', '), 'specifically ', _.map(_.values(refData), function(d){return d.length}));

    console.timeEnd('loadcoredata');

    initialized = true;
    cb(refData);
}


