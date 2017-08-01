'use strict';

//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var _ = require('lodash');
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var should = chai.should();
var Promise = require("bluebird");
var wallet = require('../model/wallet');
var thinky = require('../util/thinky.js');
var r = thinky.r;
var walletData   = require('./json/wallet.json');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

chai.use(chaiHttp);

var expect = chai.expect;

describe('Wallet', function(){
	var walletId = "";
    // inster a user into DB. and clean up the Event/Order table
    before(function(done){
        Promise.all([
                r.db("testdb").table("Wallet").delete()
            ])
        .then(function(values){
        	done();
        })
        .catch(function(err){
            logger.debug("prepare wallet test bed. err ", err);
        });
    });

    describe("CreateWallet", function(){
    	it("crete wallet should sucess", function(done){
    		wallet.createWallet(walletData.createWallet.userId)
    		.then(function(createdWallet){
    			walletId = createdWallet.id;
    			done();
    		});
    	});
    });

    describe("PersonalAccount", function(){
    	it("add personal account should success", function(done){

    		var personalAccount = _.cloneDeep(walletData.personalAccount);
    		_.merge(personalAccount, {id: walletId});

    		chai.request(server)
    		.post("/wallet/addPersonalAccount")
    		.send(personalAccount)
    		.end(function(err, res){
    			expect(res).to.have.status(200);
    			done();
    		});
    	});
    });
});