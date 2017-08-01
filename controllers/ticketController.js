'use strict';

var _             = require('lodash');
var Discount      = require('../model/discount');
var Order         = require('../model/order');
var myutil        = require('../util/util.js');
var thinky        = require('../util/thinky.js');
var validate      = myutil.validate;
var DiscountModel = Discount.DiscountModel;
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
var Event         = require('../model/event');
var Promise       = require('bluebird');
var errorCodes    = require('../util/errorCodes.js').ErrorCodes;

exports.addTicket            = addTicket;
exports.addTickets           = addTickets;
exports.updateTicket         = updateTicket;
exports.getEventTickets      = getEventTickets;
exports.getEventTicketDetail = getEventTicketDetail;
exports.deleteTicket         = deleteTicket;
exports.updateRefundSettings = updateRefundSettings;

exports.addDiscount       = addDiscount;
exports.updateDiscount    = updateDiscount;
exports.getEventDiscounts = getEventDiscounts;
exports.deleteDiscount    = deleteDiscount;
exports.getDiscountById   = getDiscountById;
exports.getDiscountByCode = getDiscountByCode;

async function addTickets(req, res, next) {

    const body    = req.body;
    const tickets = body.tickets;
    const eventId = body.eventId;

    if (_.isEmpty(tickets)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__("Empty", "request")});
    }

    // 验证规则数组
    const validArr = [
        {fieldName: 'name', type: 'string'},
        {fieldName: 'describe', type: 'string'},
        {fieldName: 'startSalesTime', type: 'string'},
        {fieldName: 'endSalesTime', type: 'string'},
        {fieldName: 'totalCount', type: 'number'}
    ];

    try {

        _.each(tickets, function (ticket) {
            myutil.validateCustomObject(req, next, validArr, ticket);
        });

        // 1 根据活动id查询活动是否存在
        const eventAttributeNames = ['id', 'tickets'];
        const eventInfo           = await Event.getEventById(eventId, eventAttributeNames);

        // 2 根据门票名称查询门票是否存在,存在则不能添加
        _.each(tickets, function (ticketInfo) {
            const ticketName  = ticketInfo.name;
            const ticketIndex = _.findIndex(eventInfo.tickets, {name: ticketName});
            if (!(ticketIndex === -1)) {
                const message = req.__('Exists', 'ticket name ' + ticketName + ' ');
                return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: message});
            }
        });

        // 3 添加门票
        _.each(tickets, function (ticketInfo) {
            ticketInfo.status   = "normal";
            ticketInfo.ticketId = myutil.nextId();
            const purenessReq   = myutil.getPurenessRequsetFields(ticketInfo, Event.EventFields.tickets[0]);// 准备需要插入数据库的数据
            eventInfo.tickets.push(purenessReq);
        });

        // 4 同步到数据库
        const newEvent = await Event.updateEventById(eventInfo.id, {tickets: eventInfo.tickets});
        return res.status(200).send(tickets);

    } catch (err) {
        logger.error('addTickets ', err);
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

async function addTicket(req, res, next) {
    const ticket      = req.body;
    const purenessReq = myutil.getPurenessRequsetFields(ticket, Event.EventFields.tickets[0]);// 准备需要插入数据库的数据

    if (_.isEmpty(ticket)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__("Empty", "request")});
    }

    // 验证规则数组
    const validArr = [
        {fieldName: 'eventId', type: 'string'},
        {fieldName: 'name', type: 'string'},
        {fieldName: 'describe', type: 'string'},
        {fieldName: 'startSalesTime', type: 'string'},
        {fieldName: 'endSalesTime', type: 'string'},
        {fieldName: 'totalCount', type: 'number'}
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, ticket);

        // 1 根据活动id查询活动是否存在
        const eventAttributeNames = ['id', 'tickets'];
        const eventInfo           = await Event.getEventById(ticket.eventId, eventAttributeNames);

        // 2 根据门票名称查询门票是否存在,存在则不能添加
        const ticketName  = ticket.name;
        const ticketIndex = _.findIndex(eventInfo.tickets, {name: ticketName});
        if (!(ticketIndex === -1)) {
            const message = req.__('Exists', 'ticket name ' + ticketName + ' ');
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: message
            });
        }

        // 3 添加门票
        purenessReq.status   = "normal";
        purenessReq.ticketId = myutil.nextId();
        eventInfo.tickets.push(purenessReq);

        // 4 同步到数据库
        const newEvent = await Event.updateEventById(eventInfo.id, {tickets: eventInfo.tickets});
        return res.status(200).send(purenessReq);

    } catch (err) {
        logger.error('addTicket ', err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

async function updateTicket(req, res, next) {
    const ticket      = req.body;
    const purenessReq = myutil.getPurenessRequsetFields(ticket, Event.EventFields.tickets[0]);// 准备需要插入数据库的数据

    if (_.isEmpty(ticket)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'request')});
    }

    // 验证规则数组
    const validArr = [
        {fieldName: 'eventId', type: 'string'},
        {fieldName: 'ticketId', type: 'string'},
        {fieldName: 'name', type: 'string'}
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, ticket);

        // 1 根据活动id查询活动是否存在
        const eventAttributeNames = ['id', 'tickets'];
        const eventInfo           = await Event.getEventById(ticket.eventId, eventAttributeNames);

        // 2 根据门票名称查询门票是否存在,不存在则不能更新
        const ticketIndex = _.findIndex(eventInfo.tickets, {ticketId: ticket.ticketId});
        if (ticketIndex === -1) {
            const message = req.__('NotExists', 'ticketId ' + ticket.ticketId + ' ');
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: message
            });
        }

        const oldTicketInfo = _.cloneDeep(eventInfo.tickets[ticketIndex]);

        // 如果用户变更了门票名字,校验新的门票名字是否存在
        const isChangeTicketName = !(_.isEmpty(ticket.name)) && (oldTicketInfo.name !== ticket.name);
        if (isChangeTicketName) {
            const newTicketNameIndex = _.findIndex(eventInfo.tickets, {name: ticket.name});
            if (!(newTicketNameIndex === -1)) {
                const message = req.__('Exists', 'ticket name ' + ticket.name + ' ');
                return next({
                    errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: message
                });
            }
        }

        // 3 更新门票
        _.each(purenessReq, function (value, key) {
            eventInfo.tickets[ticketIndex][key] = value;
        });

        // 4 同步到数据库
        const newEvent = await Event.updateEventTicketById(
            eventInfo.id, eventInfo.tickets[ticketIndex], {ticketIndex: ticketIndex}
        );

        return res.status(200).send(newEvent.tickets[ticketIndex]);

    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

async function deleteTicket(req, res, next) {
    const ticket = req.body;

    if (_.isEmpty(ticket)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__("Empty", "request")});
    }

    // 验证规则数组
    const validArr = [
        {fieldName: 'eventId', type: 'string'},
        {fieldName: 'ticketId', type: 'string'}
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, ticket);

        // 1 根据活动id查询活动是否存在
        const eventAttributeNames = ['id', 'tickets'];
        const eventInfo           = await Event.getEventById(ticket.eventId, eventAttributeNames);

        // 2 查询门票是否存在,不存在则不能删除
        const ticketIndex = _.findIndex(eventInfo.tickets, {ticketId: ticket.ticketId});
        if (ticketIndex === -1) {
            const message = req.__('NotExists', 'ticketId' + ticket.ticketId + ' ');
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: message
            });
        }

        // 3 更新门票信息
        eventInfo.tickets[ticketIndex].status = "deleted";

        // 4 同步到数据库
        const newEvent = await Event.updateEventTicketById(
            eventInfo.id, eventInfo.tickets[ticketIndex], {ticketIndex: ticketIndex}
        );

        return res.status(200).send(newEvent.tickets[ticketIndex]);

    } catch (err) {
        logger.debug('deleteTicket ', err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

function getEventTickets(req, res, next) {
    var eventId = req.query.eventId;
    if (_.isUndefined(eventId)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__("Empty", "eventId")});
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            // 1 根据活动id查询活动是否存在
            var eventAttributeNames = ['id', 'tickets'];
            var event               = yield Event.getEventById(eventId, eventAttributeNames);

            // 2 查询未删除的门票
            var ticketStatus  = 'normal';
            var newTicketsArr = _.filter(event.tickets, function (ticket) {
                return ticket.status === ticketStatus;
            });

            return res.status(200).send(newTicketsArr);

        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

function getEventTicketDetail(req, res, next) {
    var reqTicket = req.query;
    var eventId   = reqTicket.eventId;
    var ticketId  = reqTicket.ticketId;

    // 验证规则数组
    var validArr = [
        {fieldName: 'eventId', type: 'string'},
        {fieldName: 'ticketId', type: 'string'}
    ];

    const doSomething = Promise.coroutine(function*() {
        try {

            myutil.validateCustomObject(req, next, validArr, reqTicket);

            // 1 根据活动id查询活动是否存在
            var eventAttributeNames = ['id', 'tickets'];
            var event               = yield Event.getEventById(eventId, eventAttributeNames);

            // 2 查询未删除的门票
            var ticketStatus  = 'normal';
            var newTicketsArr = _.filter(event.tickets, function (ticket) {
                return (ticket.status === ticketStatus) && (ticket.ticketId === ticketId);
            });

            return res.status(200).send(newTicketsArr[0]);

        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

// 更新退票设置
async function updateRefundSettings(req, res, next) {
    var body           = req.body;
    var eventId        = body.eventId;
    var refundSettings = body.refundSettings;

    // 验证规则数组
    var validArr = [
        {fieldName: 'eventId', type: 'string'},
        {fieldName: 'refundSettings', type: 'array'}
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        // 根据活动id查询活动是否存在
        var eventAttributeNames = ['id', 'refundSettings'];
        var eventInfo           = await Event.getEventById(eventId, eventAttributeNames);

        eventInfo.refundSettings = [];
        _.each(refundSettings, function (refundSettingInfo) {
            var purenessReq = myutil.getPurenessRequsetFields(refundSettingInfo, Event.EventFields.refundSettings[0]);
            eventInfo.refundSettings.push(purenessReq);
        });

        // 同步到数据库
        await Event.updateEventById(eventInfo.id, {refundSettings: eventInfo.refundSettings});

        return res.status(200).send(eventInfo.refundSettings);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

function addDiscount(req, res, next) {
    var body        = req.body;
    var eventId     = body.eventId;
    var purenessReq = myutil.getPurenessRequsetFields(body, Discount.DiscountFields);// 准备需要插入数据库的数据

    if (!validate(req, res, DiscountModel)) {
        return;
    }
    // generationMode 为 manualInput 时需要校验 discountCode 不能为空
    if (body.generationMode === 'manualInput') {
        if (_.isEmpty(body.discountCode)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('Empty', 'discountCode')
            });
        }

    }
    // generationMode 为 random 时需要校验 discountCodeCount 必须大于等于1
    if (body.generationMode === 'random') {
        if (!(body.discountCodeCount >= 1)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('Empty', 'discountCodeCount')
            });
        }

    }
    // applyToAllTickets 为 false 时 applyToTickets 不能为空
    if (body.applyToAllTickets === false) {
        if (_.isEmpty(body.applyToTickets)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('Empty', 'applyToTickets')
            });
        }

    }
    // discountExpiryDate 为 custom 时 startTime,endTime 不能为空
    if (body.discountExpiryDate === 'custom') {
        if (_.isEmpty(body.startTime) || _.isEmpty(body.endTime)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('Empty', 'startTime or endTime')
            });
        }

    }
    const doSomething = Promise.coroutine(function*() {
        try {
            if (body.applyToAllTickets === true) {
                // 1 根据活动id查询活动是否存在
                var eventAttributeNames = ['id', 'tickets'];
                var event               = yield Event.getEventById(eventId, eventAttributeNames);

                // 2 查询未删除的门票
                var ticketStatus   = 'normal';
                var newTicketsArr  = _.filter(event.tickets, function (ticket) {
                    return ticket.status === ticketStatus;
                });
                var applyToTickets = [];
                _.each(newTicketsArr, function (ticket) {
                    applyToTickets.push(ticket.ticketId);
                });
                purenessReq.applyToTickets = applyToTickets;
            }

            if (body.discountType === 'free') {
                purenessReq.discountTypeValue = -1;
            }
            var promiseArr = [];
            if (body.generationMode === 'random') {
                for (var i = 0; i < body.discountCodeCount; i++) {
                    purenessReq.discountCode = myutil.GenNonDuplicateID(8);
                    promiseArr.push(Discount.addDiscount(purenessReq));
                }
            } else if (body.generationMode === 'manualInput') {
                promiseArr.push(Discount.addDiscount(purenessReq));
            }
            var results = yield Promise.all(promiseArr);

            return res.status(200).send(results);

        } catch (err) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: err.message
            });
        }
    })();

}

function updateDiscount(req, res, next) {
    if (!myutil.checkMandatory(["id", "discountType", "applyToAllTickets", "maxUseCount", "discountExpiryDate"], req.body)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("err_invalid_req_parameters")
        });
    }

    var body        = req.body;
    var discountId  = body.id;
    var purenessReq = myutil.getPurenessRequsetFields(body, Discount.DiscountFields);// 准备需要插入数据库的数据

    const doSomething = Promise.coroutine(function*() {
        try {
            // 1 根据优惠券id获取优惠券
            var discount = yield Discount.getDiscount(discountId);

            // 2 判断优惠券是否已被删除
            if (discount.isDeleted) {
                return next({
                    errorCode   : errorCodes.DISCOUNT_IS_DELETED,
                    responseText: req.__("err_is_deleted")
                });
            }

            if (body.applyToAllTickets === true) {
                // 1 根据活动id查询活动是否存在
                var eventAttributeNames = ['id', 'tickets'];
                var event               = yield Event.getEventById(discount.eventId, eventAttributeNames);

                // 2 查询未删除的门票
                var newTicketsArr = _.filter(event.tickets, function (ticket) {
                    return ticket.status === 'normal';
                });

                var applyToTickets = [];
                _.each(newTicketsArr, function (ticket) {
                    applyToTickets.push(ticket.ticketId);
                });

                purenessReq.applyToTickets = applyToTickets;

            }
            if (body.discountType === 'free') {
                purenessReq.discountTypeValue = -1;

            }
            purenessReq.utime = new Date();
            var newDiscount   = yield Discount.updateDiscountById(discountId, purenessReq);

            return res.status(200).send(newDiscount);

        } catch (err) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: err.message
            });
        }
    })();

}

function getDiscountById(req, res, next) {
    var discountId = req.query.did;

    if (_.isUndefined(discountId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: "err_missing_required_fields"
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {
            // 1 根据优惠券id获取优惠券
            var discount = yield Discount.getDiscount(discountId);

            // 2 判断优惠券是否存在或是否已被删除
            if (_.isEmpty(discount)) {
                return next({
                    errorCode   : errorCodes.DISCOUNT_IS_NOTEXIST,
                    responseText: req.__("err_contain_not_exist")
                });
            }
            if (discount.isDeleted) {
                return next({
                    errorCode   : errorCodes.DISCOUNT_IS_DELETED,
                    responseText: req.__("err_is_deleted")
                });
            }
            var eventId             = discount.eventId;
            // 1. 先根据活动id查询改活动id下的所有订单
            var orderAttributeNames = ['orderDetails'];
            var orderList           = yield Order.getOrderByEventId(eventId, orderAttributeNames);

            // 2. 统计该折扣码的使用数量
            var totalUsedCount = Discount.getDiscountTotalUsedCount(orderList, discount);

            discount.totalUsedCount = totalUsedCount;
            return res.status(200).send(discount);

        } catch (err) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: err.message
            });
        }
    })();
}

function deleteDiscount(req, res, next) {
    var discountIds = req.body.discountIds;

    if (_.isEmpty(discountIds)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: "err_missing_required_fields"
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            // 根据优惠券id查询优惠券是否存在
            var discounts = yield Discount.getDiscountWithIn(discountIds);
            // 判断优惠券是否存在
            if (discountIds.length !== discounts.length) {// 所请求优惠码含不存在
                return next({
                    errorCode   : errorCodes.DISCOUNT_IS_DELETED,
                    responseText: req.__("err_contain_not_exist")
                });
            }

            // 组装将要进行更新的数据
            var promiseArr = [];
            discountIds.some(function (id) {
                promiseArr.push(Discount.updateDiscountById(id, {isDeleted: true}));
            });

            var results = yield Promise.all(promiseArr);

            return res.status(200).send(results);
        } catch (err) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: err.message
            });
        }
    })();
}

async function getEventDiscounts(req, res, next) {
    const params = req.query;

    if (_.isEmpty(params.eventId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "eventId")
        });
    }

    try {

        const discountList = await Discount.getEventAllDiscounts(params);
        const orderList    = await  Order.getOrderByEventId(params.eventId, "orderDetails");

        _.each(discountList.items, function (discount, index) {
            // 获取已使用次数
            discountList.items[index].totalUsedCount = Discount.getDiscountTotalUsedCount(orderList, discount);
        });

        const resStr = myutil.getPaginate(req.query.page, req.query.limit, discountList.count, discountList.items);

        return res.status(200).send(resStr);

    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }

}

function getDiscountByCode(req, res, next) {
    var discountCode = req.query.code;

    if (_.isUndefined(discountCode)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: "err_missing_required_fields"
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {
            // 1 根据优惠券code获取优惠券
            var discounts = yield Discount.getDiscountByCode(discountCode);
            var discount  = discounts[0];

            // 2 判断优惠券是否存在或是否已被删除
            if (_.isEmpty(discount)) {
                return next({
                    errorCode   : errorCodes.DISCOUNT_IS_NOTEXIST,
                    responseText: req.__("err_contain_not_exist")
                });
            }
            if (discount.isDeleted) {
                return next({
                    errorCode   : errorCodes.DISCOUNT_IS_DELETED,
                    responseText: req.__("err_is_deleted")
                });
            }
            var eventId             = discount.eventId;
            // 1. 先根据活动id查询改活动id下的所有订单
            var orderAttributeNames = ['orderDetails'];
            var orderList           = yield Order.getOrderByEventId(eventId, orderAttributeNames);

            // 2. 统计该折扣码的使用数量
            var totalUsedCount = Discount.getDiscountTotalUsedCount(orderList, discount);

            discount.totalUsedCount = totalUsedCount;
            return res.status(200).send(discount);

        } catch (err) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: err.message
            });
        }
    })();
}
