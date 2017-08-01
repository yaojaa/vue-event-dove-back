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
var emailData  = require('./json/email.json');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

chai.use(chaiHttp);

var expect = chai.expect;

describe('Email', function(){

    return ;

    // inster a user into DB. and clean up the Event/Order table
    before(function(done){
        Promise.all([
                r.db("testdb").table("SmsEmailSendRecord").delete()
            ])
        .then(function(values){
            done();
        })
        .catch(function(err){
            logger.debug("prepare test bed. err ", err);
        });
    });

    describe("SendEmail", function(){
        // get an event
        var event = {};
        before(function(done){
            r.db("testdb").table("Event").limit(10)
            .then(function(events){
                event = events[0];
                done();
            });
        });

        it("Save and send email should success", function(done){
            emailData.successfulEvent.eventId = event.id;
            emailData.userId = "6243870883740520448";

            chai.request(server)
            .post("/notice/sendEmailRecord")
            .send(emailData.successfulEvent)
            .end(function(err, res){
                expect(res).to.have.status(200);
                done();
            });
        });

        it("Save and send email 150 should success", function(done){
            emailData.successfulEvent2.eventId = event.id;
            emailData.userId = "6243870883740520448";

            chai.request(server)
                .post("/notice/sendEmailRecord")
                .send(emailData.successfulEvent2)
                .end(function(err, res){
                    expect(res).to.have.status(200);
                    done();
                });
        });
     });
});
