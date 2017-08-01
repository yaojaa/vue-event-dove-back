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
var memberData  = require('./json/member.json');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

chai.use(chaiHttp);

var expect = chai.expect;
let memberId = '';
let membershipId = '';
let userId = '';
let uuid='';
const email = memberData.member.email;

describe('Member', function(){

    // inster a user into DB. and clean up the Event/Order table
    before(function(done){
        Promise.all([
                r.db("testdb").table("Membership").delete(),
                r.db("testdb").table("Member").delete()
            ])
        .then(function(values){
            done();
        })
        .catch(function(err){
            logger.debug("prepare test bed failed. err ", err);
        });
    });

    describe("CreateMembershipGroup", function(){
        it("create Membership group should fail because lack of ‘name’", function(done){
            var memberGroup = _.cloneDeep(memberData.memberGroupBasic);
            delete memberGroup.name;

            chai.request(server)
            .post("/member/addGroup")
            .send(memberGroup)
            .end(function(err, res){
                expect(res).to.have.status(400);
                done();
            });
        });

		it("creat membership group should success", function(done){
            var memberGroup = _.cloneDeep(memberData.memberGroupBasic);

			chai.request(server)
			.post("/member/addGroup")
			.send(memberGroup)
			.end(function(err, res){
				expect(res).to.have.status(200);
                expect(res.body).to.have.property("id").not.to.be.null;
                membershipId = res.body.id;
				done();
			});
		});
    });

    describe("UpdateMembershipGroup", function(){
        var membershipGroup = {};
        before(function(done){
            // get an membership group to update
            r.db("testdb").table("Membership").limit(10)
            .then(function(membershipGroups){
                membershipGroup = membershipGroups[0];
                done();
            });
        });

        it("update membership group should success", function(done){
            var memberGroupUpdate = _.cloneDeep(memberData.memberGroupForFreeUpdate);

            _.merge(memberGroupUpdate, {id: membershipId});

            chai.request(server)
            .post("/member/updateGroup")
            .send(memberGroupUpdate)
            .end(function(err, res){
                expect(res).to.have.status(200);
                expect(res.body).to.have.property("id").not.to.be.null;
                done();
            });
        });
    });

    describe("JoinMembershipGroup", function(){
        var freeMembershipGroup = {};
        var member = _.cloneDeep(memberData.member);

        it("join free membership should success", function(done){

            member.membershipId = membershipId;

            chai.request(server)
            .post("/member/joinGroup")
            .send(member)
            .end(function(err, res){
                expect(res).to.have.status(200);
                expect(res.body).to.have.property("id").not.to.be.null;
                memberId = res.body.id;
                done();
            });
        });
    });

    describe('GetMemberById', function() {

        it('Get member should fail because lack of \'memberId\'' , function (done) {
            chai.request(server).get('/member/getMemberById')
                .send().end(function(err, res){
                expect(res).to.have.status(400);
                done();
            });
        });

        it("Get member should success", function (done) {
            chai.request(server).get('/member/getMemberById?memberId='+memberId)
                .send().end(function(err, res){
                expect(res).to.have.status(200);
                expect(res.body).to.have.property("id").not.to.be.null;
                uuid = res.body.validation.uuid;
                done();
            });
        });


    });

    describe('GetMembershipById', function() {


        it('Get membership group should fail because lack of \'membershipId\'' , function (done) {
            chai.request(server).get('/member/getMembershipById')
                .send().end(function(err, res){
                expect(res).to.have.status(400);
                done();
            });
        });

        it('Get membership group should success' , function (done) {
            chai.request(server).get('/member/getMembershipById?membershipId='+membershipId)
                .send().end(function(err, res){
                expect(res).to.have.status(200);
                expect(res.body).to.have.property("id").not.to.be.null;
                done();
            });
        });


    });

    describe('GetMemberByEmail', function() {

        it('Get member by email should fail because lack of \'email\'' , function (done) {
            chai.request(server).get('/member/getMemberByEmail')
                .send().end(function(err, res){
                expect(res).to.have.status(400);
                done();
            });
        });

        it('Get member by email should fail because of \'email\' is not an email address' , function (done) {
            chai.request(server).get('/member/getMemberByEmail?email=xxx')
                .send().end(function(err, res){
                expect(res).to.have.status(400);
                done();
            });
        });

        it('Get member by email should success' , function (done) {
            chai.request(server).get('/member/getMemberByEmail?email=newmember@eventdove.com')
                .send().end(function(err, res){
                expect(res).to.have.status(200);
                expect(res.body[0]).to.have.property("id").not.to.be.null;
                userId = res.body.userId;
                done();
            });
        });


    });

    describe("SearchMembers", function(){

        it('sholud return an arry of one members', function (done) {
            chai.request(server).get('/member/searchMembers')
                .query({membershipId: membershipId, beforeDays: 2})
                .send().end(function (err, res) {
                expect(res).to.have.status(200);
                done();
            });
        });
    });

    describe('getMyMember', function(){
        it('Get my joined memberships', function (done) {
            chai.request(server).get('/member/getMyJoinedGroups')
                .send().end(function(err, res){
                expect(res).to.have.status(200);
                expect(res.body[0]).to.have.property("id").not.to.be.null;
                done();
            });
        })
    });
    describe("getMyMembership", function(){
        it('Get my managed groups', function (done) {
            chai.request(server).get('/member/getMyManagedGroups')
                .send().end(function(err, res){
                expect(res).to.have.status(200);
                expect(res.body[0]).to.have.property("id").not.to.be.null;
                done();
            });
        })
    });
    describe('validateEmail', function () {
        it('validate email should success',function (done) {
            chai.request(server).get('/member/validateEmail')
                .query({memberId: memberId, uuid: uuid})
                .send().end(function(err, res){
                expect(res).to.have.status(200);
                done();
            });
        })
    });

    describe('checkMembershipSubDomian', function () {
        it('should return an array of length 1',function (done) {
            chai.request(server).get('/member/checkMembershipSubDomian')
                .query({subDomain: 'gmgc'})
                .send().end(function(err, res){
                expect(res).to.have.status(200);
                res.body.length.should.equal(1);
                done();
            });
        })

        it('should return an array of length 0',function (done) {
            chai.request(server).get('/member/checkMembershipSubDomian')
                .query({subDomain: 'gmg'})
                .send().end(function(err, res){
                expect(res).to.have.status(200);
                res.body.length.should.equal(0);
                done();
            });
        })
    });


});
