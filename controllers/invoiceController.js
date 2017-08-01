/**
 * Created by zhaohongyu on 2017/03/08.
 */

'use strict';

var _          = require('lodash');
var myutil     = require('../util/util.js');
const settings = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
var Promise    = require('bluebird');
var errorCodes = require('../util/errorCodes.js').ErrorCodes;
var Event      = require('../model/event');
var Order      = require('../model/order');

exports.getInvoiceSetting    = getInvoiceSetting;
exports.getInvoiceList       = getInvoiceList;
exports.getInvoiceDetail     = getInvoiceDetail;
exports.updateInvoiceSetting = updateInvoiceSetting;
exports.updateInvoice        = updateInvoice;

// 获取发票设置
function getInvoiceSetting(req, res, next) {
    var params  = req.query;
    var eventId = params.eventId;

    if (_.isEmpty(eventId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'eventId')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            var eventAttributeNames = ['isProvideInvoice', 'invoiceSetting'];
            var eventInfo           = yield Event.getEventById(eventId, eventAttributeNames);
            return res.status(200).send(eventInfo);
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

// 搜索发票
function __search(orderList, params) {
    var invoiceStatus = params.invoiceStatus;
    var search        = params.search;
    var searchType    = myutil.getSearchType(search);

    var orderList = _.filter(orderList, {isNeedInvoice: true});

    if (searchType === 'orderNumber') {
        orderList = _.filter(orderList, {'orderNumber': search});
    }

    if (searchType === 'email') {
        orderList = _.filter(orderList, function (orderInfo) {
            return orderInfo.buyer.email === search;
        });
    }

    if (searchType === 'name') {
        orderList = _.filter(orderList, function (orderInfo) {
            return orderInfo.buyer.name === search;
        });
    }

    if (!(_.isEmpty(invoiceStatus))) {

        switch (invoiceStatus) {
            case 'invoiced':// invoiced已开票,订单下的所有发票都为invoiced
                orderList = _.filter(orderList, function (orderInfo) {
                    var invoice = orderInfo.invoice;
                    return _.every(invoice, {'invoiceStatus': 'invoiced'});
                });
                break;
            case 'uninvoiced':// uninvoiced未开票,订单下的所有发票都为uninvoiced
                orderList = _.filter(orderList, function (orderInfo) {
                    var invoice = orderInfo.invoice;
                    return _.every(invoice, {'invoiceStatus': 'uninvoiced'});
                });
                break;
            case 'part':// part部分开票,订单下的发票有invoiced和uninvoiced
                orderList = _.filter(orderList, function (orderInfo) {
                    var invoice      = orderInfo.invoice;
                    var isInvoiced   = _.every(invoice, {'invoiceStatus': 'invoiced'});
                    var isUninvoiced = _.every(invoice, {'invoiceStatus': 'uninvoiced'});
                    return !isInvoiced && !isUninvoiced;
                });
                break;
            default:
        }

    }

    return orderList;
}

// 获取发票列表
function getInvoiceList(req, res, next) {
    var params  = req.query;
    var eventId = params.eventId;

    if (_.isEmpty(eventId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'eventId')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            // 根据活动id查询所有订单
            var orderAttributeNames = [
                'orderNumber', 'buyer', 'isNeedInvoice',
                'invoiceSetting', 'invoice', 'currencyType',
                'paymentPriceUnitSign', 'totalPrice', 'taxes', 'totalDeliverFee'
            ];
            var orderList           = yield Order.getOrderByEventId(eventId, orderAttributeNames);

            // 遍历订单列表中符合条件的invoice字段进行展示
            params.orderList = __search(orderList, params);

            // 分页返回数据
            var data = Order.getInvoiceListByEventIdAndPageIndex(params);

            var invoiceStatusList = Event.getInvoiceStatusList(req);// 所有开票状态列表
            var deliverMethodList = Event.getDeliverMethodList(req);// 所有快递方式列表
            for (var invoiceInfo of data.items) {

                // 发票状态多语
                invoiceInfo.invoiceStatus    = __calcInvoiceStatus(invoiceInfo.invoice);
                var i18nInvoiceStatus        = _.find(invoiceStatusList, {name: invoiceInfo.invoiceStatus});
                invoiceInfo.invoiceStatusStr = i18nInvoiceStatus.str;

                // 发票快递方式多语
                invoiceInfo.deliverMethod    = invoiceInfo.invoiceSetting.deliverMethod;
                var i18nDeliverMethod        = _.find(deliverMethodList, {name: invoiceInfo.invoiceSetting.deliverMethod});
                invoiceInfo.deliverMethodStr = i18nDeliverMethod.str;

                // 获取发票的开票总金额
                invoiceInfo.totalAmountOfTicketPayment = Order.getTotalAmountOfTicketPayment(invoiceInfo)

            }

            var result = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

            result.invoiceStatusList = invoiceStatusList;

            return res.status(200).send(result);
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

// 计算发票开具状态
function __calcInvoiceStatus(invoice) {
    var isInvoiced    = _.every(invoice, {'invoiceStatus': 'invoiced'});
    var isUninvoiced  = _.every(invoice, {'invoiceStatus': 'uninvoiced'});
    var invoiceStatus = '';
    if (isInvoiced) {
        invoiceStatus = 'invoiced';
    }

    if (isUninvoiced) {
        invoiceStatus = 'uninvoiced';
    }

    if (!isInvoiced && !isUninvoiced) {
        invoiceStatus = 'part';
    }

    return invoiceStatus;
}

// 获取发票详情
function getInvoiceDetail(req, res, next) {
    var params      = req.query;
    var orderNumber = params.orderNumber;

    if (_.isEmpty(orderNumber)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'eventId')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            // 根据活动id查询所有订单
            var orderAttributeNames = [
                'orderNumber', 'attendees', 'buyer', 'isNeedInvoice', 'invoiceSetting',
                'invoice', 'totalPrice', 'taxes', 'totalDeliverFee'
            ];
            var orderInfo           = yield Order.getOrderByOrderNum(orderNumber, orderAttributeNames);
            if (_.isEmpty(orderInfo)) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('NotExists', 'orderNumber')
                });
            }

            var deliverMethodList = Event.getDeliverMethodList(req);// 所有快递方式列表
            var invoiceTypeList   = Event.getInvoiceTypeList(req);// 所有开票类型

            // 计算整个订单的开票状态
            var invoice                     = orderInfo.invoice;
            orderInfo.orderInvoiceStatus    = __calcInvoiceStatus(invoice);
            var i18nInvoiceStatus           = Event.getOrderInvoiceStatusI18nInfo(req, orderInfo.orderInvoiceStatus);
            orderInfo.orderInvoiceStatusStr = i18nInvoiceStatus.str;

            // 发票快递方式多语
            orderInfo.deliverMethod    = orderInfo.invoiceSetting.deliverMethod;
            var i18nDeliverMethod      = _.find(deliverMethodList, {name: orderInfo.invoiceSetting.deliverMethod});
            orderInfo.deliverMethodStr = _.isUndefined(i18nDeliverMethod) ? '' : i18nDeliverMethod.str;

            // 开票类型多语言
            orderInfo.orderInvoiceType    = orderInfo.invoiceSetting.type;
            var i18nInvoiceType           = _.find(invoiceTypeList, {name: orderInfo.orderInvoiceType});
            orderInfo.orderInvoiceTypeStr = _.isUndefined(i18nInvoiceType) ? '' : i18nInvoiceType.str;

            // 发票收件人类型
            orderInfo.invoiceSetting.receiveType = Order.getInvoiceReceiveType(orderInfo.invoiceSetting);

            // 根据发票信息中的参会者id查询门票信息
            var attendees = orderInfo.attendees;
            _.each(invoice, function (invoiceInfo, invoiceIndex) {

                var attendeeInfo = _.find(attendees, {attendeeId: invoiceInfo.attendeeId});

                let ticketName = '';
                if (!_.isEmpty(attendeeInfo)) {
                    ticketName = Order.getTicketNameFromAttendeeInfo(attendeeInfo);
                }

                invoiceInfo.ticketName = ticketName;

                var i18nInvoiceStatus        = Event.getOrderInvoiceStatusI18nInfo(req, invoiceInfo.invoiceStatus);
                invoiceInfo.invoiceStatusStr = i18nInvoiceStatus.str;

                invoiceInfo.invoiceNumber      = invoiceInfo.invoiceNumber || '';
                invoiceInfo.deliverInformation = invoiceInfo.deliverInformation || {};
                invoice[invoiceIndex]          = invoiceInfo;
            });

            var returnObj = {
                orderInvoiceStatus        : orderInfo.orderInvoiceStatus,
                orderInvoiceStatusStr     : orderInfo.orderInvoiceStatusStr,
                deliverMethod             : orderInfo.deliverMethod,
                deliverMethodStr          : orderInfo.deliverMethodStr,
                orderInvoiceType          : orderInfo.orderInvoiceType,
                orderInvoiceTypeStr       : orderInfo.orderInvoiceTypeStr,
                isNeedInvoice             : orderInfo.isNeedInvoice,
                totalAmountOfTicketPayment: Order.getTotalAmountOfTicketPayment(orderInfo),
                orderNumber               : orderInfo.orderNumber,
                buyer                     : orderInfo.buyer,
                invoiceSetting            : orderInfo.invoiceSetting,
                invoice                   : orderInfo.invoice,
            };

            return res.status(200).send(returnObj);
        } catch (err) {
            logger.error('getInvoiceDetail ', err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();

}

// 更新发票设置
function updateInvoiceSetting(req, res, next) {
    var params           = req.body;
    var eventId          = params.eventId;
    var isProvideInvoice = params.isProvideInvoice;
    var invoiceSetting   = params.invoiceSetting;

    // 验证规则数组
    var validArr = [
        {fieldName: 'eventId', type: 'string'},
        {fieldName: 'isProvideInvoice', type: 'boolean'},
        {fieldName: 'invoiceSetting', type: 'object'}
    ];

    const doSomething = Promise.coroutine(function*() {
        try {

            myutil.validateCustomObject(req, next, validArr, params);

            var eventAttributeNames = ['id'];
            yield Event.getEventById(eventId, eventAttributeNames);

            var toBeUpdateData = {};

            // 不提供发票
            if (isProvideInvoice === false) {
                toBeUpdateData.isProvideInvoice = isProvideInvoice;
            }

            // 提供发票
            if (isProvideInvoice === true) {
                toBeUpdateData.isProvideInvoice = isProvideInvoice;
                var newInvoiceSetting           = {};
                newInvoiceSetting.type          = invoiceSetting.type;
                newInvoiceSetting.serviceItems  = invoiceSetting.serviceItems;
                newInvoiceSetting.taxPoint      = invoiceSetting.taxPoint;
                newInvoiceSetting.deliverMethod = invoiceSetting.deliverMethod;
                newInvoiceSetting.deliverFee    = invoiceSetting.deliverFee;
                newInvoiceSetting.isSplitable   = invoiceSetting.isSplitable;
                toBeUpdateData.invoiceSetting   = newInvoiceSetting;
            }

            yield Event.updateEventById(eventId, toBeUpdateData);

            return res.status(200).send(toBeUpdateData);
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

// 更新发票
function updateInvoice(req, res, next) {
    var params             = req.body;
    var orderNumber        = params.orderNumber;
    var invoiceId          = params.invoiceId;
    var invoiceNumber      = params.invoiceNumber || '';
    var deliverInformation = params.deliverInformation || {};

    // 验证规则数组
    var validArr = [
        {fieldName: 'orderNumber', type: 'string'},
        {fieldName: 'invoiceId', type: 'string'},
        {fieldName: 'invoiceNumber', type: 'string'},
        {fieldName: 'deliverInformation', type: 'object'}
    ];

    const doSomething = Promise.coroutine(function*() {
        try {

            myutil.validateCustomObject(req, next, validArr, params);

            // 查询订单是否存在
            var orderAttributeNames = ['id', 'invoice'];
            var orderInfo           = yield Order.getOrderByOrderNum(orderNumber, orderAttributeNames);
            if (_.isEmpty(orderInfo)) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('NotExists', 'orderNumber')
                });
            }

            // 查询发票是否存在
            var invoiceIndex = _.findIndex(orderInfo.invoice, {invoiceId: invoiceId});
            if (invoiceIndex === -1) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('NotExists', 'invoice')
                });
            }

            var invoiceInfo = orderInfo.invoice[invoiceIndex];
            if (_.isEmpty(invoiceInfo)) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('NotExists', 'invoice')
                });
            }

            invoiceInfo.invoiceStatus = 'invoiced';

            if (!(_.isEmpty(invoiceNumber))) {
                invoiceInfo.invoiceNumber = invoiceNumber;
            }

            if (!(_.isEmpty(deliverInformation))) {

                if (_.isEmpty(deliverInformation.deliverName)) {
                    return next({
                        errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                        responseText: req.__('Empty', 'deliverName')
                    });
                }

                if (_.isEmpty(deliverInformation.deliverNumber)) {
                    return next({
                        errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                        responseText: req.__('Empty', 'deliverNumber')
                    });
                }

                var newDeliverInformation           = {};
                newDeliverInformation.deliverName   = deliverInformation.deliverName;
                newDeliverInformation.deliverNumber = deliverInformation.deliverNumber;
                invoiceInfo.deliverInformation      = newDeliverInformation;
            }

            orderInfo.invoice[invoiceIndex] = invoiceInfo;

            yield Order.updateOrderById(orderInfo.id, {invoice: orderInfo.invoice});
            return res.status(200).send(invoiceInfo);
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}


