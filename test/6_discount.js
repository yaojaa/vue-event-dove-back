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
var discountData  = require('./json/discount.json');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

chai.use(chaiHttp);

var expect = chai.expect;

describe('Discount', function(){
    //return ;
    before(function(done){
        Promise.all([
                r.db("testdb").table("Discount").delete()
            ])
        .then(function(values){
            done();
        })
        .catch(function(err){
            logger.debug("prepare test bed. err ", err);
        });
    });

    describe("CreateDiscount", function(){
        // get an event
        var event = {};
        var ticketIds = [];
        before(function(done){
            r.db("testdb").table("Event").limit(10)
            .then(function(events){
                event = events[0];
                _.each(event.tickets, function(ticket,index){
                    index % 2 === 0 ? "" : ticketIds.push(ticket.ticketId);
                });
                done();
            });
        });

        it("Create Discount by random should success", function(done){
            discountData.random.eventId = event.id;
            chai.request(server)
            .post("/discount/add")
            .send(discountData.random)
            .end(function(err, res){
                expect(res).to.have.status(200);
                done();
            });
        });

        it("Create Discount by manualInput should success", function(done){
            discountData.manualInput.eventId = event.id
            if(discountData.manualInput.applyToAllTickets === false){
                discountData.manualInput.applyToTickets = ticketIds;
            }
            chai.request(server)
                .post("/discount/add")
                .send(discountData.manualInput)
                .end(function(err, res){
                    expect(res).to.have.status(200);
                    done();
                });
        });

        it("delete Discount should success", function(done){
            chai.request(server)
                .get("/event/discounts?eventId="+event.id)    // 查询
                .end(function(err, res){
                    var text = res.text;
                    var items = JSON.parse(text).items;
                    var discount = items[0];
                    console.log("items.length: "+items.length+" id: "+discount.id);
                    discount.maxUseCount = 5;
                    chai.request(server)
                        .post("/discount/update")           // 修改
                        .send(discount)
                        .end(function(err, res){
                            chai.request(server)
                                .post("/discount/delete")   // 删除
                                .send({id:discount.id})
                                .end(function(err, res){
                                    chai.request(server)
                                        .get("/event/discounts?eventId="+event.id)    // 查询
                                        .end(function(err, res){
                                            var text = res.text;
                                            var items = JSON.parse(text).items;
                                            console.log("items.length: "+items.length);
                                            expect(res).to.have.status(200);
                                            done();
                                        });
                                });
                        });
                });
        });

        it("Create Discount by random should error1", function(done){
            discountData.random.eventId = event.id;
            var random = discountData.random;
            random.applyToAllTickets = false;
            chai.request(server)
                .post("/discount/add")
                .send(random)
                .end(function(err, res){
                    expect(res).to.have.status(500);
                    done();
                });
        });

        it("Create Discount by random should error2", function(done){
            discountData.random.eventId = event.id;
            var random = discountData.random;
            random.applyToAllTickets = true;
            random.discountExpiryDate = "custom";
            chai.request(server)
                .post("/discount/add")
                .send(random)
                .end(function(err, res){
                    expect(res).to.have.status(500);
                    done();
                });
        });

     });
});
