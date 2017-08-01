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
var orderData  = require('./json/order.json');
var userData   = require('./json/user.json');
var emailData  = require('./json/email.json');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

chai.use(chaiHttp);


var expect = chai.expect;

describe('EventDove', function(){

    // inster a user into DB. and clean up the Event/Order table
    before(function(done){
        Promise.all([

            ])
        .then(function(values){
            done();
        })
        .catch(function(err){
            logger.debug("prepare test bed. err ", err);
        });
    });

});
