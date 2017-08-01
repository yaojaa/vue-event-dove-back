'use strict';

exports.migrate = migrate;

var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    r = require('rethinkdb'),
    settings = require("../conf/settings"),
    seriaization = require('./serialization'),
    converters = require('./converters'),
    readData = seriaization.readData;

var outputdir = require("./config").outputdir;

var now = _.now();

var loadableTables = ['Event']; //'Login','Event'
var tableNameMap = {
		'Event':{'name':'Event', 'converter':converters.eventConverter},
		'Login':{'name':'User', 'converter':converters.userConverter}, 
		'Attendee':{'name':'EventAttendee', 'converter':converters.attendeeConverter}
};

function migrate() {
    var pgData = {};
    
    _.each(loadableTables, function(tableName) {
    	
    	
    	var dirs = fs.readdirSync(outputdir);
        var files = _.filter(dirs, function(dir) {
        	return dir.startsWith(tableName) && dir.indexOf(tableName+'.') !==-1;
        });
          
        var fileCount = 0;
    	_.each(files, function(file) {
	    	try {
	    		pgData[file] = readData(outputdir+file, {dataformat:'json'});
	    		console.log(file, ' load file ', file, pgData[file].length);
	        }
	        catch(e) {
	            console.log(e);
	        }
    	});
    	
    	_.each(files, function(file) {
    		onconnect(function(err, conn) {
	            upsert(conn, tableName, pgData[file], function(results){
	            	fileCount++;
	            });
	            
	            if(fileCount >= files.length){
	            	process.exit();
	            }
    		});
    	});
    });
    
    
          
}

function upsert(rConn, tableName, rows, cb) {
	
	var itemCount = 0;
	var newTableName = tableName;
	
	var converter;
    if(tableNameMap[tableName]) {
    	newTableName = tableNameMap[tableName].name;
    	converter = tableNameMap[tableName].converter;
    }
     
    _.each(rows, function(item) {
    	if(converter) {
        	item = converter(item);
        }
        
        upsertRow(newTableName, item, rConn, function(result){
        	itemCount++;
        	console.log(itemCount+'/'+rows.length )
        });
        
        if(itemCount >= rows.length) {
        	cb();
        }
    });
    
}


function upsertRow(tablename, item, connection, callback) {
    r.db(settings.rethinkdbDB).table(tablename).insert(item, {conflict:'replace'})
      .run(connection, function(err, result) {
          
          if(err) {
            //console.error("[ERROR][%s][saveMessage] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
            console.error(err.name, err.message, item);
          }
          else {
            if(callback) {
                callback(result);
            }
          }
    });
}

function onconnect(callback) {
  r.connect({host: settings.rethinkdbHost, port: settings.rethinkdbPort, user:settings.rethinkdbUser, password:settings.rethinkdbPasswd}, 
    function(err, connection) {
        if(err) {
            return callback(err, null);
        }
        callback(err, connection);
    });
}   

migrate();