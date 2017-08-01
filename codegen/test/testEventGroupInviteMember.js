'use strict';

//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var should = chai.should();
var Promise = require("bluebird");

var EventGroupInviteMember = require('../model/EventGroupInviteMember');

var thinky = require('../util/thinky.js');
var r = thinky.r;

chai.use(chaiHttp);

describe('EventGroupInviteMember', function() {

    before(function(done) {
        const deletetables = Promise.coroutine(function*() {
            // runs before all tests in this block
            yield r.table("EventGroupInviteMember").delete();
        })();
        done();
    });
    describe('Test eventgroupinvitemember', function() {
        it('it should pass', function(done) {
            const tests = Promise.coroutine(function*() {
                var logRes = function(res) {
                    console.log("res ----->:" + JSON.stringify(res, null, 2))
                }

                var id = 'test-id';
                
                console.log("add eventgroupinvitemember 1");

                var res = yield chai.request(server)
                    .post('/eventgroupinvitemember/add')
                    .send({
                        "id":id
                    });
                logRes(res);
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('id');
                aid1 = res.body['id'];
                
                console.log("get eventgroupinvitemember");
                res = yield chai.request(server)
                    .get('/eventgroupinvitemember/'+id);
                logRes(res);
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(1);
                [aid1].should.contains(res.body[0]['id']);
                

                console.log("delete eventgroupinvitemember 1");
                res = yield chai.request(server)
                    .post('/eventgroupinvitemember/delete')
                    .send({"id":aid1});
                logRes(res);
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body['deleted'].should.be.eq(1);
                res.body['errors'].should.be.eq(0);

                console.log("get eventgroupinvitemember again");
                res = yield chai.request(server)
                    .get('/eventgroupinvitemembers/'+id);
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
            
