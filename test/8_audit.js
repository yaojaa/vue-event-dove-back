'use strict';

//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var _ = require('lodash');
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var should = chai.should();
var Promise = require("bluebird");
var transaction = require('../model/transaction');
var thinky = require('../util/thinky.js');
var r = thinky.r;
var tranData   = require('./json/transaction.json');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

chai.use(chaiHttp);

var expect = chai.expect;

describe('Audit', function(){
    before(function(done){
        Promise.all([
                r.db("testdb").table("Transaction").delete()
            ])
        .then(function(values){
        	done();
        })
        .catch(function(err){
            logger.debug("prepare Transaction test bed. err ", err);
        });
    });

    describe("Add Transaction", function(){

    	it("Add Transaction should sucess", function(done){
            //console.log("tranData ", tranData);
            transaction.addTransaction(tranData.ticketTransaction)
            .then(function(){
                done();
            });
    	});
    });
});