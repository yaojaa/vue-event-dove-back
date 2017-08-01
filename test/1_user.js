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
var userData   = require('./json/user.json');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

chai.use(chaiHttp);

var expect = chai.expect;

describe('User', function(){
    // inster a user into DB. and clean up the Event/Order table
    before(function(done){
        Promise.all([
                r.db("testdb").table("User").delete()
            ])
        .then(function(values){
            r.db("testdb").table("User").insert(userData.registerUserSuccess)
            .then(function(user){
                done();
            });
        })
        .catch(function(err){
            logger.debug("prepare test bed. err ", err);
        });
    });
});