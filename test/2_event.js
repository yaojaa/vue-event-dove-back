'use strict';

//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var _ = require('lodash');
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var should = chai.should();
var Promise = require("bluebird");
var order = require('../model/order');
var thinky = require('../util/thinky.js');
var r = thinky.r;
var eventData  = require('./json/event.json');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

chai.use(chaiHttp);

var expect = chai.expect;

describe('Event', function(){

    // inster a user into DB. and clean up the Event/Order table
    before(function(done){
        Promise.all([
                r.db("testdb").table("Event").delete()
            ])
        .then(function(values){
            done();
        })
        .catch(function(err){
            logger.debug("prepare test bed. err ", err);
        });
    });

    describe("CreateEvent", function(){
		it("creat event should success", function(done){
			chai.request(server)
			.post("/event/create")
			.send(eventData.successfulEvent)
			.end(function(err, res){
				expect(res).to.have.status(200);
				done();
			});
		});
    });
});
