'use strict';

var _ = require('underscore'),
    fs = require("fs");
//var settings = require("../conf/settings");
    

exports.readData = readData;
exports.writeData = writeData;
exports.init = init;


function init() {
}


function readData(fn, opts) {
    var format = opts && opts.dataformat || 'json';
    //console.log(fn, '+++++++++++++++', opts, format)
     
    if(opts && opts.dataformat == 'json') {
    	
    }
    else if(opts && opts.dataformat) {
        fn = fn + '.' +  opts.dataformat;
    }
    else if(!opts || !opts.dataformat) {
        fn = fn + '.' + 'json';
    }
    
    if(format == 'json') {
        return JSON.parse(fs.readFileSync(fn));
    }
    else if(format == 'idx') {
        return JSON.parse(fs.readFileSync(fn));
    }
    else {
        return fs.readFileSync(fn);
    }
}

function toCSV(data) {
    var keys = _.keys(data[0]);
    var result = [];
    result.push(keys.join(','));
    
    _.each(data, function(d) {
        result.push(_.values(d).join(','));    
    });
    return result.join('\n');
    
}

function writeData(fn, data, opts) {
    var format = opts && opts.dataformat || 'json';
    
    
    if(opts && opts.dataformat) {
        fn = fn + '.' + opts.dataformat;
    }
    else if(!opts || !opts.dataformat) {
        fn = fn + '.' + 'json';
    }
    
    if(format == 'json') {
        return fs.writeFileSync(fn, JSON.stringify(data));
    }
    else if(format == 'idx') {
        return fs.writeFileSync(fn, JSON.stringify(data));
    }
    
    else if(format == 'csv') {
        return fs.writeFileSync(fn, toCSV(data));
    }
    else {
        return fs.writeFileSync(fn, data);
    }
}
