'use strict';

exports.load = load;

var _ = require('underscore'),
    seriaization = require('../util/serialization'),
    fs = require('fs'),
    readData = seriaization.readData,
    writeData = seriaization.writeData,
    config = require("../process/config");
    
var outputdir = config.outputdir;
var mysqlConn = config.mysqlConn;
var excluded = ['Agenda', 'Event', 'Attendee', 'CollectionData', 'CollectionPoint', 'Organizer', 'City', 'Province','Country', 'CountryRegion'];

function load() {
    
    mysqlConn.connect();
    
    mysqlConn.query("select table_name as name, table_rows as numOfRows, avg_row_length as rowSize from information_schema.tables where table_schema='hyzing_nmyevent'", 
        function(err, rows, fields) {
        
            var tables = _.map(rows, function(tableInfo) {
                
                //if(!tableInfo.numOfRows) return;
                
                var t = {};
                t.name = tableInfo.name; 
                
                t.count = tableInfo.numOfRows;
                
                if(_.contains(excluded, t.name)) {  //t.count < 100 || 
                    //console.log('skipped ', t.name)
                    return null;
                }
                
                
                return t;
            });
            
            _.each(tables, function(table){
                
                if(!table) return;
                
                try {
                    genModel(table.name);
                    //genTest(table.name);
                }
                catch(e) {
                    console.log(e);
                }     
            });
        });
        
        
}
var modelTemplate = fs.readFileSync('./codegen/template/model_template.js').toString();
var modelTestTemplate = fs.readFileSync('./codegen/template/model_test_template.js').toString();

function genModel(modelName) {
    
    var fn = outputdir + modelName + '.0.json';
    if(!fs.existsSync(fn)) {
        return;
    }
    
    var data = readData(fn.replace('.0.json', '.0'));
    var d = data[0];
    
    if(_.isEmpty(data) || data.length < 10) 
        return;
    
    var model = {};
    
    var keys = _.keys(d);
    
    _.each(keys, function(key) {
        model[key] = 'type.string()';
        
        if(key.indexOf('Id') > -1) {
            model[key] = 'type.string()';    
        }
        else if(key.indexOf('Time') > -1) {
            model[key] = 'type.date()';    
        }
        else if(typeof(d[key]) == 'number') {
            if(key.indexOf('Fee') > -1) {
                model[key] = 'type.number()';
            }
            else if(Math.round(d[key]) != d[key])
                model[key] = 'type.number()';
            else {
                model[key] = 'type.number().integer()';
            }
        }
        
    });
    
    var modelBody = '';
    
    for(var k in model) {
        modelBody =  modelBody + '\t' + k + ' : ' + model[k] + ',' + '\n';
    }
    
    modelBody = modelBody.slice(0, modelBody.length-2);
    
    var sourceTemplate = _.template(modelTemplate);
    var source = sourceTemplate({ModelName: modelName, ModelBody:modelBody});
    console.log(source);
    
    var fn = './codegen/model/' + modelName + '.js';
    fs.writeFileSync(fn, source);
}

function genTest(modelName) {
    var fn = outputdir + modelName + '.0.json';
    if(!fs.existsSync(fn)) {
        return;
    }
    
    var data = readData(fn.replace('.0.json', '.0'));
    
    if(_.isEmpty(data) || data.length < 100) 
        return;
    
    var sourceTemplate = _.template(modelTestTemplate);
    var source = sourceTemplate({ModelName: modelName, lowerModelName: modelName.toLowerCase()});
    console.log(source);
    
    var fn = './codegen/test/test' + modelName + '.js';
    fs.writeFileSync(fn, source);
}

    

load();