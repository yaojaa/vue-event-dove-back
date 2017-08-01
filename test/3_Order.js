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
var orderData  = require('./json/order.json');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

chai.use(chaiHttp);

var expect = chai.expect;

describe('Order', function(){

    // inster a user into DB. and clean up the Event/Order table
    before(function(done){
        Promise.all([
                r.db("testdb").table("Order").delete()
            ])
        .then(function(values){
            done();
        })
        .catch(function(err){
            logger.debug("prepare test bed. err ", err);
        });
    });

    describe("CreateOrder", function(){
        var event = {};
        var discountArr = [];
        // prepare the order information
        before(function(done){
            r.db("testdb").table("Event").limit(10)
            .then(function(events){
                event = events[0];
                // 获取 优惠码
                r.db("testdb").table("Discount").limit(10)
                    .then(function(discounts){
                        discountArr = discounts;
                        done();
                    });
            });
        });

        it("creat order should success", function(done){

            var order = orderData.order1;
            // update the tickets in the order
            order.order.forEach(function(orderItem, index){
                orderItem.ticketName = event.tickets[index].name;
                orderItem.ticketId   = event.tickets[index].ticketId;
            });

            order.eventId = event.id;
            order.userId = "6243870883740520448";

            chai.request(server)
            .post("/order/create")
            .send(order)
            .end(function(err, orderResponse){
                expect(orderResponse).to.have.status(200);
                done();
            });
        });

        it("creat order should fail because the unique condition", function(done){
            var order = orderData.order1;
            // update the tickets in the order
            order.order.forEach(function(orderItem, index){
                orderItem.ticketName = event.tickets[index].name;
                orderItem.ticketId   = event.tickets[index].ticketId;
            });

            order.eventId = event.id;
            order.userId = "6243870883740520448";

            chai.request(server)
            .post("/order/create")
            .send(order)
            .end(function(err, orderResponse){
                expect(orderResponse).to.have.status(500);
                done();
            });
        });

        // it("create order should fail because missing required information. 宋江email为空", function(done){
        //     var order = _.cloneDeep(orderData.order2);
        //     order.order[0].attendees[0].email = "";
        //     // update the tickets in the order
        //     order.order.forEach(function(orderItem, index){
        //         orderItem.ticketName = event.tickets[index].name;
        //         orderItem.ticketId   = event.tickets[index].ticketId;
        //     });
        //
        //     order.eventId = event.id;
        //     order.userId = "6243870883740520448";
        //
        //     chai.request(server)
        //     .post("/order/create")
        //     .send(order)
        //     .end(function(err, orderResponse){
        //         expect(orderResponse).to.have.status(500);
        //         done();
        //     });
        // });
        //
        // it("create order2 should success ", function(done){
        //     var order = _.cloneDeep(orderData.order2);
        //     // update the tickets in the order
        //     order.order.forEach(function(orderItem, index){
        //         orderItem.ticketName = event.tickets[index].name;
        //         orderItem.ticketId   = event.tickets[index].ticketId;
        //     });
        //
        //     order.eventId = event.id;
        //     order.userId = "6243870883740520448";
        //
        //     chai.request(server)
        //     .post("/order/create")
        //     .send(order)
        //     .end(function(err, orderResponse){
        //         expect(orderResponse).to.have.status(200);
        //         done();
        //     });
        // });


        // it("add discount isNeedInvoice should success", function(done){
        //     var order = _.cloneDeep(orderData.order2);
        //     order.order.forEach(function(orderItem, index){
        //         orderItem.ticketName = event.tickets[index].name;
        //         orderItem.ticketId   = event.tickets[index].ticketId;
        //     });
        //
        //     order.eventId = event.id;
        //     order.userId = "6243870883740520448";
        //     order.discount = {discountCode:discountArr[0].discountCode};
        //     order.isNeedInvoice = true;
        //     var invoiceSetting = {
        //         "type": "special",
        //         "serviceItems": "会议费",
        //         "deliverMethod": "express",
        //         "isSplitable": true
        //     }
        //     order.invoiceSetting = invoiceSetting;
        //     chai.request(server)
        //         .post("/order/create")
        //         .send(order)
        //         .end(function(err, orderResponse){
        //             // console.log("orderResponse: "+orderResponse.text);
        //             expect(orderResponse).to.have.status(200);
        //             done();
        //         });
        // });

        it("add discount isNeedInvoice 须要发票,但发票信息未传 success ", function(done){
            var order = _.cloneDeep(orderData.order2);
            order.order.forEach(function(orderItem, index){
                orderItem.ticketName = event.tickets[index].name;
                orderItem.ticketId   = event.tickets[index].ticketId;
            });

            order.eventId = event.id;
            order.userId = "6243870883740520448";
            order.discount = {discountCode:discountArr[0].discountCode};
            // 设置须要发票
            // order.isNeedInvoice = true;
            // 发票类型设置为空
            order.invoiceSetting  = {};
            // 发票信息为空
            order.invoice         = [];
            chai.request(server)
            .post("/order/create")
            .send(order)
            .end(function(err, orderResponse){
                // console.log("orderResponse: "+orderResponse.text);
                expect(orderResponse).to.have.status(200);
                done();
            });
        });

        // it("add discount was delete should error", function(done){
        //     var order = _.cloneDeep(orderData.order2);
        //     order.order.forEach(function(orderItem, index){
        //         orderItem.ticketName = event.tickets[index].name;
        //         orderItem.ticketId   = event.tickets[index].ticketId;
        //     });
        //
        //     order.eventId = event.id;
        //     order.userId = "6243870883740520448";
        //     var discount = _.find(discountArr, function (discountInfo) {
        //         // 获取 已删除的优惠码
        //         return discountInfo.isDeleted === true;
        //     });
        //     console.log("discountId: "+discount.id+" isDeleted: "+discount.isDeleted);
        //     order.discount = {discountCode:discount.discountCode};
        //     order.isNeedInvoice = true;
        //     var invoiceSetting = {
        //         "type": "special",
        //         "serviceItems": "会议费",
        //         "deliverMethod": "express",
        //         "isSplitable": true
        //     }
        //     order.invoiceSetting = invoiceSetting;
        //     chai.request(server)
        //         .post("/order/create")
        //         .send(order)
        //         .end(function(err, orderResponse){
        //             console.log("err: "+err);
        //             console.log("orderResponse: "+orderResponse.text);
        //             expect(orderResponse).to.have.status(500);
        //             done();
        //         });
        // });

    });
});
