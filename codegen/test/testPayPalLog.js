'use strict';

//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var should = chai.should();
var Promise = require("bluebird");

var PayPalLog = require('../model/PayPalLog');

var thinky = require('../util/thinky.js');
var r = thinky.r;

chai.use(chaiHttp);

describe('PayPalLog', function() {

    before(function(done) {
        const deletetables = Promise.coroutine(function*() {
            // runs before all tests in this block
            yield r.table("PayPalLog").delete();
        })();
        done();
    });
    describe('Test paypallog', function() {
        it('it should pass', function(done) {
            const tests = Promise.coroutine(function*() {
                var logRes = function(res) {
                    console.log("res ----->:" + JSON.stringify(res, null, 2))
                }

                var id = 'test-id';
                
                console.log("add paypallog 1");

                var res = yield chai.request(server)
                    .post('/paypallog/add')
                    .send({
                        "id":id
                    });
                logRes(res);
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('id');
                aid1 = res.body['id'];
                
                console.log("get paypallog");
                res = yield chai.request(server)
                    .get('/paypallog/'+id);
                logRes(res);
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(1);
                [aid1].should.contains(res.body[0]['id']);
                

                console.log("delete paypallog 1");
                res = yield chai.request(server)
                    .post('/paypallog/delete')
                    .send({"id":aid1});
                logRes(res);
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body['deleted'].should.be.eq(1);
                res.body['errors'].should.be.eq(0);

                console.log("get paypallog again");
                res = yield chai.request(server)
                    .get('/paypallogs/'+id);
                logRes(res);
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(1);
                [aid2].should.contains(res.body[0]['id']);

                done();
            })();
        });
    });
});
            
