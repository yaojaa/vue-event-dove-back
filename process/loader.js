'use strict';

exports.load = load;

var _ = require('underscore'),
    seriaization = require('./serialization'),
    readData = seriaization.readData,
    writeData = seriaization.writeData,
    config = require("./config");
    
var outputdir = config.outputdir;
var mysqlConn = config.mysqlConn;

function load() {
    
    mysqlConn.connect();
    
    mysqlConn.query("select table_name as name, table_rows as numOfRows, avg_row_length as rowSize from information_schema.tables where table_schema='hyzing_nmyevent'", 
        function(err, rows, fields) {
        
            var tables = _.map(rows, function(tableInfo) {
                
                //if(!tableInfo.numOfRows) return;
                console.log(tableInfo.rowlen, typeof(tableInfo.rowSize));
                
                var multiplier = tableInfo.rowSize % 15114 + 1;
                var batchsize = 10000 * multiplier;
                if(batchsize > tableInfo.numOfRows) {
                    batchsize = tableInfo.numOfRows;
                }
                
                if(batchsize > 150000) {
                    batchsize = 150000;
                }
                
                //console.log(multiplier, batchsize);
                
                var t = {};
                t.name = tableInfo.name; 
                t.batchsize = batchsize;
                t.count = tableInfo.numOfRows;
                return t;
            });
                
            //console.log(tables);
            loadTables(tables);    
        });
}
    
function loadTables(tables) {    
    
    var tableCount = 0;
    
    _.each(tables, function(t) {
        
        var table = t.name;
        var count = t.count;
        var batchsize = t.batchsize;
        
        console.log(table, ' # of rows ', count, t);
        
        if(count == 0 || _.contains(config.excludedTables, t.name) ) {
            return;
        }
        
        var batchnum = Math.round((count/batchsize) + 1);
        
        console.log(batchnum, 'batch ', table);
        
        for(var j = 0; j < batchnum; j++) {
            var offset = j * batchsize;
            var query = 'SELECT * from ' + table + ' limit ' + batchsize + ' offset ' + offset;
            loadTable(table, query, j);
        }
        
        
        if(++tableCount == tables.length) {
          mysqlConn.end();
        }
    });
}

function loadTable(table, query, j) {        
    mysqlConn.query(query, function(err, rows, fields) {
      if (err) throw err;
      console.log(table, ' # of rows ', rows.length);
      
      if(!rows.length) return;
      
      writeData(outputdir + table + '.' + j, rows);
      
      rows = [];          
     
    });
}

load();