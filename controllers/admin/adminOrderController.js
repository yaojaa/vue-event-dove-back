'use strict';

var _           = require('lodash');
var myutil      = require('../../util/util.js');
var errorCodes  = require('../../util/errorCodes.js').ErrorCodes;
var fixParams   = require('../../util/fixParams.js');
const settings  = require("../../conf/settings");
const loggerSettings = require('../../logger');
const logger         = loggerSettings.winstonLogger;
var Promise     = require('bluebird');
var order       = require('../../model/order');

exports.getOrderById = getOrderById;

async function getOrderById(req, res, next) {
    var orderId       = req.query.id;
    if (_.isEmpty(orderId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderId")
        });
    }
    try {
        var Order = await order.getOrderById(orderId);
        var orderStatusList = order.getOrderStatusList(req);
        var orderPaymentMethodList = order.getOrderPaymentMethodList(req);

        var discount = _.isEmpty(Order.discount) ? '无使用优惠' : Order.discount.discountCode;
        var OrderInfo = {
            id              : Order.id,
            orderNumber     : Order.orderNumber,
            cTime           : Order.cTime,
            email           : Order.buyer.email,
            status          : _.find(orderStatusList, {name: Order.status}).str,               // 订单状态
            purchasePlatform: Order.purchasePlatform,  // 购票平台
            paymentMethod   : _.find(orderPaymentMethodList, {name: Order.paymentMethod}).str,  // 支付方式
            discount        : discount,                // 是否优惠
        };
        var orderDetails = Order.orderDetails;
        var attendees = Order.attendees;
        var tickets = _.map(orderDetails,function (orderDetail) {
            // 票名称	所购张数	票单价	折扣	 共计
            var ticketId = orderDetail.ticketId;
            var attendeesWithTicket = _.map(attendees,function (attendee) {
                if(attendee.currentTicketInfo.ticketId === ticketId){
                    return {
                        attendeeId       : attendee.attendeeId,
                        name             : attendee.collectInfo.name,                   // 姓名
                        email            : attendee.collectInfo.email,                  // 邮箱
                        isETicketSent    : attendee.isETicketSent ? '已发送' : '未发送',  // 是否发送电子票
                        isNeedAudit      : attendee.isNeedAudit ? '已审核' : '未审核',    // 是否审核
                        isCheckedIn      : attendee.isCheckedIn ? '已签到' : '未签到',    // 是否签到
                        actualTicketPrice: attendee.actualTicketPrice,                  // 实际支付价格
                        defaultPrice     : attendee.currentTicketInfo.defaultPrice      // 原价
                    };
                };
                return '';
            });
            // 去掉数组中为空的值
            attendeesWithTicket = _.difference(attendeesWithTicket,['']);
            var defaultPrice = attendeesWithTicket[0].defaultPrice;           // 原票价
            var actualTicketPrice = attendeesWithTicket[0].actualTicketPrice; // 实际支付票价

            return {
                ticketId           : ticketId,
                ticketName         : orderDetail.ticketName,               // 票名称
                ticketCount        : orderDetail.ticketCount,              // 所购张数
                ticketPrice        : defaultPrice,  // 票原价
                discountPrice      : (defaultPrice - actualTicketPrice) > 0 ? (defaultPrice - actualTicketPrice) : 0,   // 每张票折扣额
                actualTicketPrice  : actualTicketPrice * orderDetail.ticketCount,              // 实际支付票总额
                attendeesWithTicket: attendeesWithTicket                   // 票信息
            };
        });
        OrderInfo.tickets = tickets;

        return res.status(200).send(OrderInfo);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}
