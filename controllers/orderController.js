'use strict';

const _          = require('lodash');
const util       = require('util');
const Order      = require('../model/order');
const User       = require('../model/user');
const Event      = require('../model/event');
const myutil     = require('../util/util.js');
const fixParams  = require('../util/fixParams.js');
const thinky     = require('../util/thinky.js');
const moment     = require('moment');
const settings   = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const Promise    = require('bluebird');
const nextId     = myutil.nextId;
const errorCodes = require('../util/errorCodes.js').ErrorCodes;
const Discount   = require('../model/discount');
const Big        = require('big.js');
const path       = require('path');
const Alipay     = require('../services/pay/alipay/alipay');
const PayPal     = require('../services/pay/paypal/paypal');
const Wallet     = require('../model/wallet.js');

const sysNotice = require('../model/admin/sysNotice');

const precision = 2;

exports.createOrder                   = createOrder;
exports.cancelOrder                   = cancelOrder;
exports.getOrderByEventIdAndPageIndex = getOrderByEventIdAndPageIndex;
exports.getOrderById                  = getOrderById;
exports.getOrderByOrderNum            = getOrderByOrderNum;
exports.validateIsUnique              = validateIsUnique;
exports.auditOrder                    = auditOrder;
exports.statisticsDiscountCodeUsage   = statisticsDiscountCodeUsage;
exports.updateOrderNote               = updateOrderNote;
exports.prepareCreateOrder            = prepareCreateOrder;
exports.preparePay                    = preparePay;
exports.getTicketOrderPayResult       = getTicketOrderPayResult;
exports.prepareAdminAddAttendee       = prepareAdminAddAttendee;
exports.prepareExportOrders           = prepareExportOrders;

function __getOrderRelatedParameters(eventId) {
    var eventFields = ["status", "userId", "basePrice", "percent", "maxFee", "isCollectAttendees", "collectItems", "tickets", "paymentPriceUnit", "paymentPriceUnitSign", "isProvideInvoice", "invoiceSetting"];
    var orderFields = ["orderDetails", "attendees"];
    return Promise.props(
        {
            event : Event.getEventById(eventId, eventFields),
            orders: Order.getOrderByEventId(eventId, orderFields),
        }
    );
}

// 获取活动创办者信息
function __getOrgUserInfo(userId) {
    var userFields = ["basePrice", "percent", "maxFee"];
    return Promise.props(
        {
            user: User.getUserById(userId, userFields),
        }
    );
}

function __getCollectedAttendees(body) {

    var buyer              = body.buyer;// 用户提交过来的购票者信息
    var collectedAttendees = [];// 整理后的参会者信息

    _.each(body.order, function (orderInfo) {

        var collectedAttendeeInfo = {
            ticketId  : orderInfo.ticketId,
            ticketName: orderInfo.ticketName,
        };
        var userPostAttendees     = orderInfo.attendees;// 用户提交过来的参会者信息

        if (_.isEmpty(userPostAttendees)) {

            // 购票者模式
            var newCollectedAttendeeInfo = _.merge(collectedAttendeeInfo, buyer);

            for (var i = 0, total = orderInfo.total; i < total; i++) {
                collectedAttendees.push(newCollectedAttendeeInfo);
            }

        } else {

            // 参会者模式
            _.each(userPostAttendees, function (attendeeInfo) {

                var newCollectedAttendeeInfo = _.merge(attendeeInfo, collectedAttendeeInfo);

                collectedAttendees.push(newCollectedAttendeeInfo);

            });

        }

    });

    return collectedAttendees;
}

function __getMissingItems(collectedAttendees, collectItems) {
    var missingItemsArr = [];
    var missingItems    = [];
    _.each(collectedAttendees, function (attendee) {
        missingItems = __checkRequiredItemsPresent(attendee, collectItems);
        if (missingItems.length) {
            missingItemsArr.push(missingItems[0]['displayName']);
        }
    });

    return _.uniq(missingItemsArr);
}

function __prepareAttendees(collectedAttendees, eventId, orderNumber, tickets) {
    var attendees = _.map(collectedAttendees, function (collectedAttendee) {
        var newCollectedAttendee = _.cloneDeep(collectedAttendee);

        var attendeeId = myutil.generateAttendeeId();
        var ticketId   = newCollectedAttendee.ticketId;
        var ticketName = newCollectedAttendee.ticketName;
        var ticketInfo = Event.getTicketByTicketId(ticketId, tickets);

        _.unset(newCollectedAttendee, 'ticketId');
        _.unset(newCollectedAttendee, 'ticketName');

        var codeObj =
                {
                    eventId    : eventId,
                    attendeeId : attendeeId,
                    orderNumber: orderNumber,
                    ticketId   : ticketId,
                    ticketName : ticketName
                };

        var codeContent = myutil.getCodeContent({aId: attendeeId, oNu: orderNumber});

        var attendee =
                {
                    attendeeId       : attendeeId,
                    isNeedAudit      : ticketInfo.needAudit,
                    barcode          : codeContent,
                    qrCodeContent    : codeContent,
                    collectInfo      : newCollectedAttendee,
                    codeObj          : codeObj,
                    currentTicketInfo: ticketInfo
                };
        return attendee;
    });
    return attendees;
}

// 检测参会者信息的属性值是否唯一
function __checkUnique(attendee, allCollectInfos, uniqueCollectItems) {
    var repeatedValues = [];
    _.each(attendee, function (value, key) {
        var isUniqueItem = _.find(uniqueCollectItems, {itemName: key});// 当前对象的属性是否是唯一收集项条目
        if (!_.isUndefined(isUniqueItem)) {
            var isUniqueValue = __validateIsUniqueValue(key, value, allCollectInfos);
            if (!isUniqueValue) {
                // 如果不是唯一值,记录起来
                repeatedValues.push(key + "=" + value);
            }
        }
    });
    return repeatedValues;
}

function __getAllRepeatedValues(collectedAttendees, currentOrders, eventCollectItems) {

    // 订单中已经收集到的所有参会者信息
    var allCollectInfos = __getAllCollectInfos(currentOrders);

    // 取出活动中要求收集唯一项的表单收集项
    var uniqueCollectItems = _.filter(eventCollectItems, {isUnique: true});

    // 取得所有重复的值
    var allRepeatedValues = [];
    _.each(collectedAttendees, function (attendee) {
        var repeatedValues = __checkUnique(attendee, allCollectInfos, uniqueCollectItems);
        _.isEmpty(repeatedValues) ? '' : allRepeatedValues.push(repeatedValues);
    });

    var allRepeatedValues2 = [];
    _.each(allRepeatedValues, function (value) {
        _.each(value, function (value2) {
            allRepeatedValues2.push(value2);
        });
    });

    return allRepeatedValues2;
}

function __getInvoiceSetting(body, currentEvent) {
    var invoiceSetting = {};

    // 用户是否需要开具发票
    var isNeedInvoice = body.isNeedInvoice || false;
    if (!isNeedInvoice) {
        return invoiceSetting;
    }

    // 用户提交的发票设置信息
    var userInvoiceSetting          = body.invoiceSetting || {};
    var isInvalidUserInvoiceSetting = _.isEmpty(userInvoiceSetting)
        || _.isEmpty(userInvoiceSetting.type)
        || _.isEmpty(userInvoiceSetting.serviceItems)
        || _.isEmpty(userInvoiceSetting.deliverMethod)
        || _.isUndefined(userInvoiceSetting.isSplitable);
    if (isInvalidUserInvoiceSetting) {
        return invoiceSetting;
    }

    // 本次活动是否提供发票
    var isProvideInvoice = currentEvent.isProvideInvoice || false;
    if (!isProvideInvoice) {
        return invoiceSetting;
    }

    // 取出发票相关设置
    var sysInvoiceSetting = currentEvent.invoiceSetting || {};
    if (_.isEmpty(sysInvoiceSetting)) {
        return invoiceSetting;
    }

    // 组装发票设置信息
    invoiceSetting.type          = userInvoiceSetting.type;
    invoiceSetting.serviceItems  = userInvoiceSetting.serviceItems;
    invoiceSetting.taxPoint      = sysInvoiceSetting.taxPoint;
    invoiceSetting.deliverMethod = userInvoiceSetting.deliverMethod;
    invoiceSetting.deliverFee    = sysInvoiceSetting.deliverFee;
    invoiceSetting.isSplitable   = userInvoiceSetting.isSplitable;
    invoiceSetting.receiveType   = userInvoiceSetting.receiveType;

    return invoiceSetting;
}

/**
 * 计算税点费用
 * @param totalPrice 计算后的门票总价格
 * @param currentEvent 活动详情
 * @param isNeedInvoice 用户是否需要开发票
 * @private
 */
function __getTaxes(totalPrice, invoiceSetting) {
    var taxes = Big(0);

    if (_.isEmpty(invoiceSetting)) {
        return taxes;
    }

    // 计算
    taxes = Big(totalPrice).times(Big(invoiceSetting.taxPoint).div(Big(100)));

    return taxes.round(precision);
}

/**
 * 计算发票快递费用
 * @param attendees 所有参会者
 * @param invoiceSetting 发票设置
 * @private
 */
function __getTotalDeliverFee(attendees, invoiceSetting) {
    var totalDeliverFee = Big(0);

    if (_.isEmpty(invoiceSetting)) {
        return totalDeliverFee;
    }

    totalDeliverFee = Big(invoiceSetting.deliverFee).times(Big(attendees.length));

    return totalDeliverFee.round(precision);
}

/**
 * 组装用户的发票信息
 * @param attendees 组装好的参会者信息数组
 * @param invoices 用户提交过来的发票信息数组
 * @private
 */
function __getInvoices(attendees, invoices) {

    // 根据发票的receiver查询参会者信息
    _.each(invoices, function (invoiceInfo, index) {
        var receiver       = invoiceInfo.receiver;
        var receiverDetail = _.find(attendees, function (attendeeInfo) {
            return attendeeInfo.collectInfo.name === receiver;
        });

        if (!(_.isEmpty(receiverDetail))) {
            invoiceInfo.invoiceId     = nextId();
            invoiceInfo.invoiceAmount = receiverDetail.actualTicketPrice;
            invoiceInfo.attendeeId    = receiverDetail.attendeeId;
            invoices[index]           = invoiceInfo;
        }
    });

    return invoices;
}

// 获取不在可售时间的门票
function __getOverdueTickets(orderDetails, tickets) {

    var overdueTickets = _.filter(orderDetails, function (orderInfo) {
        var ticketInfo = Event.getTicketByTicketId(orderInfo.ticketId, tickets);
        // 判断当前门票是否在可售时间范围内
        var isValid    = __validateTime(ticketInfo.startSalesTime, ticketInfo.endSalesTime);
        return !isValid;
    });

    // 取出不在可售时间的门票
    var ticketNames = [];
    _.each(overdueTickets, function (ticketInfo) {
        ticketNames.push(ticketInfo.ticketName);
    });

    return ticketNames;
}

function __getOrderDetailsFromBody(body) {
    const orderDetails = _.map(body.order, function (order) {
        return {
            ticketId   : order.ticketId,
            ticketName : order.ticketName,
            ticketCount: Number(order.total)
        };
    });
    return orderDetails;
}

async function createOrder(req, res, next) {

    if (!myutil.checkMandatory(["eventId", "order", "platform", "buyer"], req.body)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("err_invalid_req_parameters")
        });
    }
    const body    = req.body;
    const userId  = body.userId;
    const eventId = body.eventId;
    try {
        const values        = await __getOrderRelatedParameters(eventId);
        const currentEvent  = values.event;
        const orgUserInfo   = await __getOrgUserInfo(currentEvent.userId);
        const currentUser   = orgUserInfo.user;
        const currentOrders = values.orders;
        const orderNumber   = myutil.getOrderNum();

        // 活动是否是能进行购买门票
        if (!Order.isEventCanBuyTicket(currentEvent.status)) {
            return next({
                errorCode   : errorCodes.ERR_NOT_FOUND,
                responseText: req.__("isEventCanBuyTicket")
            });
        }

        // 提取订单信息数组
        const orderDetails = __getOrderDetailsFromBody(body);

        // 提取参会者信息
        const collectedAttendees = __getCollectedAttendees(body);

        // todo isMemberOnlyTicket 当只允许群组会员进行购买时检测购买该门票的人是否有资格

        // 验证门票是否在有效期
        const overdueTickets = __getOverdueTickets(orderDetails, currentEvent.tickets);
        if (!(_.isEmpty(overdueTickets))) {
            return next({
                errorCode   : errorCodes.ERR_NOT_FOUND,
                responseText: req.__("overdue_tickets", overdueTickets.toString())
            });
        }

        // 检查每个参会者必填信息收集情况
        const missingItemsArr = __getMissingItems(collectedAttendees, currentEvent.collectItems);
        if (missingItemsArr.length) {
            return next({
                errorCode   : errorCodes.ORDER_FILED_MISSING_REQUIRED,
                responseText: req.__("err_missing_required_fields") + ": " + missingItemsArr.toString()
            });
        }

        // 检查每个参会者唯一性收集项情况
        const isCollectAttendees = currentEvent.isCollectAttendees;
        if (isCollectAttendees) {
            const allRepeatedValues = __getAllRepeatedValues(collectedAttendees, currentOrders, currentEvent.collectItems);
            if (allRepeatedValues.length) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__("Exists", allRepeatedValues.toString())
                });
            }
        }

        // 组装即将入库的attendee信息
        const prepareAttendees = __prepareAttendees(collectedAttendees, eventId, orderNumber, currentEvent.tickets);

        // 检查ticket名称及售票状态，不能over sell
        const soldOutTicket = _.find(orderDetails, function (orderInfo) {
            let remainingTickets = __getTicketInventoryByTicketId(orderInfo.ticketId, currentEvent.tickets, currentOrders);
            return ( remainingTickets < orderInfo.ticketCount);
        });
        if (soldOutTicket !== undefined) {
            return next({
                errorCode   : errorCodes.ORDER_TICKETS_NOT_SUFFICIENT,
                responseText: req.__("err_ticket_not_enough", soldOutTicket.ticketName)
            });
        }

        if (!_.isEmpty(body.discount) && !_.isEmpty(body.discount.discountCode)) {
            const discounts          = await Discount.getDiscountByCode(body.discount.discountCode);
            body.discount            = _.isEmpty(discounts[0]) ? {} : discounts[0];
            body.discount.discountId = _.isEmpty(body.discount) ? 0 : body.discount.id;
        }

        // 组装订单object，存入数据库

        const paymentMethod      = body.paymentMethod || fixParams.PAYMENT_METHOD.PAYMENT_METHOD_NONE;
        const purchasePlatform   = body.platform || fixParams.ORDER_PLATFORM.ORDER_PLATFORM_WEB;
        const invoiceSetting     = __getInvoiceSetting(body, currentEvent);// 用户选择的发票相关信息
        const isNeedInvoice      = !_.isEmpty(invoiceSetting);// 用户是否需要开具发票
        const shouldPayInfo      = __getOrderShouldPayTotalPrice(orderDetails, currentEvent.tickets, body.discount, currentOrders, prepareAttendees);
        const taxes              = __getTaxes(shouldPayInfo.totalPrice, invoiceSetting);
        let newAttendees         = shouldPayInfo.attendees;
        const totalDeliverFee    = __getTotalDeliverFee(newAttendees, invoiceSetting);
        const totalPrice         = Big(shouldPayInfo.totalPrice).plus(Big(taxes)).plus(Big(totalDeliverFee));
        const originalPriceTotal = __getOrderOriginalPriceTotal(orderDetails, currentEvent.tickets);
        const serviceFee         = __getServiceFee(currentUser, currentEvent, shouldPayInfo.totalPrice);
        const thirdPartyCharge   = __getThirdPartyCharge();
        const orderStatus        = __getOrderStatus(orderDetails, currentEvent.tickets, totalPrice, purchasePlatform);

        const orderRecord = _.assign({}, {orderNumber: orderNumber, buyer: body.buyer});
        _.extend(orderRecord, {eventId: eventId, eventUserId: currentEvent.userId});
        _.extend(orderRecord, {userId: userId, cTime: new Date()});
        _.extend(orderRecord, {currencyType: currentEvent.paymentPriceUnit});
        _.extend(orderRecord, {paymentPriceUnitSign: currentEvent.paymentPriceUnitSign});
        _.extend(orderRecord, {status: orderStatus});
        _.extend(orderRecord, {paymentMethod: paymentMethod});
        _.extend(orderRecord, {totalPrice: Number(totalPrice)});// 订单应支付总金额
        _.extend(orderRecord, {originalPriceTotal: Number(originalPriceTotal)});// 订单原金额
        _.extend(orderRecord, {serviceFee: Number(serviceFee)});// 订单服务费
        _.extend(orderRecord, {thirdPartyCharge: Number(thirdPartyCharge)});// 支付渠道费用总额
        _.extend(orderRecord, {isNeedInvoice: isNeedInvoice});
        _.extend(orderRecord, {invoiceSetting: invoiceSetting});
        _.extend(orderRecord, {taxes: Number(taxes)});
        _.extend(orderRecord, {totalDeliverFee: Number(totalDeliverFee)});
        _.extend(orderRecord, {purchasePlatform: purchasePlatform});

        if (orderStatus === fixParams.ORDER_STATUS.ORDER_STATUS_PAID) {
            // 订单状态为已支付的设置参会者支付状态为已支付
            newAttendees = Order.setAttendeesPayStatus(newAttendees);
        }

        _.extend(orderRecord, {attendees: newAttendees, orderDetails: orderDetails});


        if (isNeedInvoice && !(_.isEmpty(body.invoice))) {
            const invoices = __getInvoices(newAttendees, body.invoice);
            _.extend(orderRecord, {invoice: invoices});
        }

        if (!_.isEmpty(body.discount) && !_.isEmpty(body.discount.discountCode)) {
            const newDiscount = _.pick(body.discount, 'discountId', 'discountCode');
            _.extend(orderRecord, {discount: newDiscount});
        }

        const orderRet               = await Order.addOrder(orderRecord);
        orderRet.createOrderNextPage = __getCreateOrderNextPage(orderStatus, totalPrice);

        // 创建订单后发送通知
        sysNotice.sendNoticeAfterOrderCreate(req, orderStatus, orderRecord, body.buyer, totalPrice);

        return res.status(200).send(orderRet);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}


// 获取创建订单后前端需要跳转的页面
function __getCreateOrderNextPage(orderStatus, totalPrice) {
    var jumpPage     = '';
    var auditPending = fixParams.ORDER_STATUS.ORDER_STATUS_AUDIT_PENDING;
    // 需要审核的订单跳转到====>报名成功,请等待主办方审核
    if (orderStatus === auditPending) {
        jumpPage = 'toBeAuditPage';
    }
    // 不需要审核的订单,不需要支付的====>恭喜报名成功,期待参与
    if ((orderStatus !== auditPending) && (0 === Number(totalPrice))) {
        jumpPage = 'successfulRegistrationPage';
    }
    // 不需要审核的订单,需要支付的====>订单支付页
    if ((orderStatus !== auditPending) && (0 !== Number(totalPrice))) {
        jumpPage = 'toBePayPage';
    }

    return jumpPage;
}

// barCode内容生成
function __getBarCode(codeObj) {
    return JSON.stringify(codeObj);
}

// 二维码内容生成
function __getQRCode(codeObj) {
    return JSON.stringify(codeObj);
}

// 设置订单的初始状态
function __getOrderStatus(orderDetails, ticketSetting, totalPrice, purchasePlatform) {

    // 当订单的票中有一种包含审核票的时候就需要把订单的初始状态设置成 ORDER_STATUS_AUDIT_PENDING
    const setting = _.find(orderDetails, function (ticketInfo) {
        const ticketDetail = Event.getTicketByTicketId(ticketInfo.ticketId, ticketSetting);
        return ticketDetail.needAudit;
    });

    let orderStatus = (setting !== undefined)
        ? fixParams.ORDER_STATUS.ORDER_STATUS_AUDIT_PENDING
        : fixParams.ORDER_STATUS.ORDER_STATUS_PAID_NONE;

    // 支付金额为0时,并且不是需要审核的门票,将票设置成已支付
    const isSetPaid = ((Number(totalPrice)) === 0) && (orderStatus !== fixParams.ORDER_STATUS.ORDER_STATUS_AUDIT_PENDING);
    if (isSetPaid) {
        orderStatus = fixParams.ORDER_STATUS.ORDER_STATUS_PAID;
    }

    const needSetOrderStatusPaidPlatformArr = [fixParams.ORDER_PLATFORM.ORDER_PLATFORM_ONSITE, fixParams.ORDER_PLATFORM.ORDER_PLATFORM_UPLOAD, fixParams.ORDER_PLATFORM.ORDER_PLATFORM_ADMIN];
    // 后台添加的参会人员订单状态设置成已支付
    if (myutil.inArray(purchasePlatform, needSetOrderStatusPaidPlatformArr)) {
        orderStatus = fixParams.ORDER_STATUS.ORDER_STATUS_PAID;
    }

    return orderStatus;
}

/**
 * 根据ticketId，需要购买的ticketCount，以及ticket的设置来判断是否有足够的票
 * @param ticketId 门票id
 * @param ticketSetting 活动的门票
 * @param eventOrders 活动的所有订单
 * @returns {number} 返回剩余票数
 * @private
 */
function __getTicketInventoryByTicketId(ticketId, ticketSetting, eventOrders) {
    var soldTickets = Event.getSoldTicketCount(eventOrders, ticketId);
    var ticketInfo  = Event.getTicketByTicketId(ticketId, ticketSetting);

    if (ticketInfo !== undefined) {
        return ticketInfo.totalCount - soldTickets;
    }
    return 0;
}

// 判断参会者信息中的必填项是否存在并且不为空，如果不存在则返回相关收集项信息
// 如果都存在则返回空数组
function __checkRequiredItemsPresent(collectedAttendee, collectItems) {
    // 判断必填项
    var requiredItemNames = _.map(collectItems, function (item) {
        if (Event.isItemRequired(item)) {
            return item.itemName;
        }
        return '';
    });

    // remove the empty ones 
    _.pull(requiredItemNames, '');

    if (0 === requiredItemNames.length) {
        return [];
    }

    var emptyVauleObj = _.pickBy(collectedAttendee, function (value, key) {
        return (requiredItemNames.indexOf(key) > -1) && _.isEmpty(value);
    });

    var missingItemNames = _.keys(emptyVauleObj);
    if (0 === missingItemNames.length) {
        return [];
    }

    var missingItems = _.filter(collectItems, function (item) {
        return (missingItemNames.indexOf(item.itemName) > -1);
    });
    return missingItems;
}


/**
 * 查询活动下所有订单
 * @param req
 * @param res
 */
async function getOrderByEventIdAndPageIndex(req, res, next) {
    var params = req.query;

    if (_.isEmpty(params.eventId)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'eventId')
        });
    }

    if (!_.isEmpty(params.search)) {
        params.searchType = myutil.getSearchType(params.search);
    }

    try {

        var data   = await Order.getOrderByEventIdAndPageIndex(params);
        var result = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        result.orderStatusList   = Order.getOrderStatusList(req);// 查询所有订单状态
        result.paymentMethodList = Order.getPaymentMethodList(req);// 查询所有支付方式

        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

// 组装订单详情给前端展示
function __makeOrderDetails(orderRet) {

    var cloneOrderDetails = _.cloneDeep(orderRet.orderDetails);
    var cloneAttendees    = _.cloneDeep(orderRet.attendees);

    var newOrderDetails = _.map(cloneOrderDetails, function (orderInfo) {

        var buyCount         = orderInfo.ticketCount;// 门票购买的数量
        var defaultPrice     = 0;// 门票的默认单价
        var ticketTotalPrice = Big(0);// 用户实际花费的金额

        orderInfo.buyInfos = _.filter(cloneAttendees, function (o) {

            if (o.codeObj.ticketId === orderInfo.ticketId) {
                defaultPrice     = o.currentTicketInfo.defaultPrice;// 门票的单价
                ticketTotalPrice = ticketTotalPrice.plus(Big(o.actualTicketPrice));
                return true;
            }

            return false;
        });

        orderInfo.defaultPrice     = defaultPrice;
        orderInfo.ticketTotalPrice = Number(ticketTotalPrice);
        orderInfo.discountPrice    = Number(
            Big(defaultPrice).times(Big(buyCount)).minus(ticketTotalPrice)
        );


        return orderInfo;
    });

    return newOrderDetails;
}

/**
 * 根据订单Id 查询订单
 * @param req
 * @param res
 */
async function getOrderById(req, res, next) {
    const orderId = req.query.orderId;

    if (_.isEmpty(orderId)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'orderId')
        });
    }

    try {
        let orderRet          = await Order.getOrderById(orderId);
        orderRet.orderDetails = __makeOrderDetails(orderRet);
        orderRet.eventInfo    = await Event.getEventById(
            orderRet.eventId, ['title', 'startTime', 'endTime', 'onlineAddress', 'detailedAddress', 'organizers']
        );

        return res.status(200).send(orderRet);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

/**
 * 根据订单号查询订单
 * @param req
 * @param res
 */
function getOrderByOrderNum(req, res, next) {
    var orderNum = req.query.orderNum;

    if (_.isEmpty(orderNum)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'orderNum')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {
            var orderAttributeNames = [
                'id', 'orderNumber', 'buyer', 'totalPrice', 'originalPriceTotal',
                'serviceFee', 'thirdPartyCharge', 'currencyType', 'paymentPriceUnitSign', 'status', 'paymentMethod',
                'purchasePlatform', 'orderDetails', 'attendees', 'invoice', 'discount',
                'uTime', 'cTime', 'eventId', 'userId', 'orderNote',
            ];
            var orderInfo           = yield Order.getOrderByOrderNum(orderNum, orderAttributeNames);
            return res.status(200).send(orderInfo);
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

/**
 * 获取活动未删除采集项
 * @param eventCollectItems    活动所有采集项
 * @returns {Array}
 */
var __getNotDeleteEventCollectItems = function (eventCollectItems) {
    return _.filter(eventCollectItems, {isDeleted: false});
};

var __getCollectItemInfo = function (eventCollectItems, itemId) {
    return _.find(eventCollectItems, {itemId: itemId});
};

/**
 * 提取所有订单中的参会者表单收集项信息
 * @param currentEventOrders
 * @returns {*}
 * @private
 */
function __getAllCollectInfos(currentEventOrders) {
    // 提取所有参会者信息
    var allAttendees = _.reduce(currentEventOrders, function (attendees, orderInfo) {
        return orderInfo.attendees ? attendees.concat(orderInfo.attendees) : attendees;
    }, []);

    // 提取所有参会者信息中的表单收集项信息
    var allCollectInfos = _.reduce(allAttendees, function (collectInfos, attendeeInfo) {
        return attendeeInfo.collectInfo ? collectInfos.concat(attendeeInfo.collectInfo) : collectInfos;
    }, []);
    return allCollectInfos;
}

/**
 * 校验唯一采集项值是否唯一
 * @param itemName 要验证的表单收集项的itemName
 * @param value 要验证的值
 * @param allCollectInfos 所有订单中的参会者表单收集项信息
 * @returns {boolean}
 * @private
 */
function __validateIsUniqueValue(itemName, value, allCollectInfos) {
    var myfilter       = {};
    myfilter[itemName] = value;
    var valueInfo      = _.find(allCollectInfos, myfilter);
    if (!_.isUndefined(valueInfo)) {
        return false;
    }
    return true;
}

// 校验唯一采集项值是否唯一
function validateIsUnique(req, res, next) {
    var params   = req.body;
    var eventId  = params.eventId;
    var itemId   = params.itemId;// 唯一收集项的主键id
    var itemName = params.itemName;// 唯一收集项的英文名字
    var value    = params.value;// 唯一收集项的值

    const doSomething = Promise.coroutine(function*() {
        try {

            var eventAttributeNames = ['collectItems', 'isCollectAttendees'];
            var orderAttributeNames = ['attendees'];
            var data                = yield Promise.props(
                {
                    event : Event.getEventById(eventId, eventAttributeNames),
                    orders: Order.getOrderByEventId(eventId, orderAttributeNames)
                }
            );
            var currentEvent        = data.event;
            var currentEventOrders  = data.orders;

            // 不需要收集用户信息
            if (!currentEvent.isCollectAttendees) {
                return res.status(200).send();
            }

            var eventCollectItems = __getNotDeleteEventCollectItems(currentEvent.collectItems);
            var collectItemInfo   = __getCollectItemInfo(eventCollectItems, itemId);

            // 传递了错误的itemId
            if (_.isEmpty(collectItemInfo)) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__("NotExists", itemId)
                });
            }

            var allCollectInfos = __getAllCollectInfos(currentEventOrders);
            var isUniqueValue   = __validateIsUniqueValue(itemName, value, allCollectInfos);
            if (!isUniqueValue) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__("Exists", value)
                });
            }

            return res.status(200).send();
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

function __getDiscountPrice(basePrice, orderInfo, discount, orderList) {
    // 订单中购买的此门票是否在优惠码生效的门票数组中
    var applyToTickets = discount.applyToTickets;
    if (!myutil.inArray(orderInfo.ticketId, applyToTickets)) {
        return basePrice;
    }

    // 优惠码是否已删除
    var discountIsDeleted = discount.isDeleted;
    if (discountIsDeleted) {
        return basePrice;
    }

    // 优惠码是否在有效期
    var discountExpiryDate = discount.discountExpiryDate;
    if (discountExpiryDate === 'custom') {
        var isValid = __validateTime(discount.startTime, discount.endTime);
        if (!isValid) {
            return basePrice;
        }
    }

    // 优惠码是否已经超出了使用次数限制
    var maxUseCount = discount.maxUseCount;
    if (maxUseCount !== -1) {
        // 计算该优惠码的已使用次数
        var totalUsedCount = Discount.getDiscountTotalUsedCount(orderList, discount);
        var availableCount = (maxUseCount - totalUsedCount);// 此优惠码的可用次数
        var userBuyCount   = orderInfo.ticketCount;// 用户购买的门票数量
        if (userBuyCount > availableCount) {
            return basePrice;
        }
    }

    // 开始计算在团购价格基础上的价格
    var discountType      = discount.discountType;
    var discountTypeValue = Big(discount.discountTypeValue);
    var discountPrice     = basePrice;
    switch (discountType) {
        case 'fixed':
            discountPrice = basePrice.minus(discountTypeValue);
            break;
        case 'rate':
            discountPrice = basePrice.times(Big(1).minus(discountTypeValue.div(100)));
            break;
        case 'free':
            discountPrice = Big(0);
            break;
        default:
    }

    // 优惠码生效,记录生效的优惠码到订单信息中
    // !!! 注意这里的修改会直接影响上层调用者的原始数据,`JS中基本类型是按值传递的，对象类型是按共享传递的`
    orderInfo.discountId   = discount.discountId;
    orderInfo.discountCode = discount.discountCode;

    var debugMsg = '门票 ' + orderInfo.ticketName +
        ' 使用的优惠码类型是 ' + discountType +
        ' 优惠码类型的值是 ' + discountTypeValue +
        ' 使用优惠码后的价格为' + discountPrice;
    logger.debug(debugMsg);

    return discountPrice;
}

/**
 * 获取门票价格,以及如果使用了有效的优惠码会变更订单的信息内容
 * @param orderInfo 订单详情
 * @param ticketDetail 活动门票的详情
 * @param discount 折扣码对象
 * @param orderList 根据活动id查询出的所有订单信息数组
 * @returns {number}
 * @private
 */
function __getPresentPrice(orderInfo, ticketDetail, discount, orderList) {
    var debugMsg     = '';
    var defaultPrice = Big(ticketDetail.defaultPrice);// 门票的默认价格

    logger.debug('【', ticketDetail.name, '】的默认价格是 ' + defaultPrice);

    // 是否是早鸟票,如果是早鸟票,取早鸟票的价格
    var earlyBirdTicketSetting = ticketDetail.earlyBirdTicketSetting || {};
    if (!(_.isEmpty(earlyBirdTicketSetting))) {

        // 该门票是否在早鸟票截止时间之前
        var validateTime = __validateTime(earlyBirdTicketSetting.startTime, earlyBirdTicketSetting.endTime);
        if (validateTime) {
            defaultPrice = Big(earlyBirdTicketSetting.price);
            logger.debug('该门票目前处于早鸟票期间价格是 ' + defaultPrice);
        }

    }

    // 是否允许团购
    var isAllowGroupPurchase = ticketDetail.isAllowGroupPurchase;
    if (!isAllowGroupPurchase) {

        // 用户是否使用了优惠码
        if (_.isEmpty(discount) || _.isEmpty(discount.discountId)) {
            return defaultPrice;
        }

        // 不允许团购但使用了优惠码
        logger.debug('不允许团购但使用了优惠码...');
        defaultPrice = __getDiscountPrice(defaultPrice, orderInfo, discount, orderList);

        return defaultPrice;
    }

    // 有没有对团购进行设置
    var groupPurchaseTicketSetting = ticketDetail.groupPurchaseTicketSetting;// 团购设置
    if (_.isEmpty(groupPurchaseTicketSetting)) {
        return defaultPrice;
    }

    // 用户购买的数量是否符合团购规则
    var userBuyCount  = orderInfo.ticketCount;// 用户购买的门票数量
    var minGroupCount = groupPurchaseTicketSetting.minGroupCount;// 团购最少购买张数
    if (userBuyCount < minGroupCount) {
        return defaultPrice;
    }

    // 计算团购价格
    var preferentialType      = groupPurchaseTicketSetting.preferentialType;
    var preferentialTypeValue = Big(groupPurchaseTicketSetting.value);
    switch (preferentialType) {
        case 'fixed':
            defaultPrice = defaultPrice.minus(preferentialTypeValue);
            break;
        case 'rate':
            defaultPrice = defaultPrice.times((1 - (preferentialTypeValue / 100)));
            break;
        default:
    }

    debugMsg = '门票 ' + orderInfo.ticketName +
        ' 默认价格是 ' + ticketDetail.defaultPrice +
        ' 使用的团购类型是 ' + preferentialType +
        ' 团购类型的值是 ' + preferentialTypeValue +
        ' 团购的价格为' + defaultPrice;
    logger.debug(debugMsg);

    // 团购基础上是否允许使用优惠券
    var isAllowGroupPurchase = groupPurchaseTicketSetting.isAllowDiscount;
    if (!isAllowGroupPurchase) {
        return defaultPrice;
    }

    // 用户是否使用了优惠码
    if (_.isEmpty(discount) || _.isEmpty(discount.discountId)) {
        return defaultPrice;
    }

    // 查询优惠码是否适用于此门票,如果适用进行满减操作
    logger.debug('允许团购且使用了优惠码...');
    defaultPrice = __getDiscountPrice(defaultPrice, orderInfo, discount, orderList);

    return defaultPrice;
}

/**
 * 计算门票此时的价格
 * @param orderInfo 订单详情
 * @param ticketSetting 活动的门票数组
 * @param discount 折扣码对象
 * @param orderList 根据活动id查询出的所有订单信息数组
 * @returns {number}
 * @private
 */
function __calcPresentPrice(orderInfo, ticketSetting, discount, orderList) {
    var ticketDetail = Event.getTicketByTicketId(orderInfo.ticketId, ticketSetting);
    var presentPrice = __getPresentPrice(orderInfo, ticketDetail, discount, orderList);// 获取团购价
    return presentPrice < 0 ? 0 : presentPrice;
}

/**
 * 在参会者信息中加入当时购买的门票的价格
 * @param attendees 参会者信息数组
 * @param orderInfo 订单信息
 * @param presentPrice 此时门票的价格
 * @returns {*}
 * @private
 */
function __convergeAttendees(attendees, orderInfo, presentPrice) {
    _.each(attendees, function (attendeeInfo, index) {
        if (attendeeInfo.codeObj.ticketId === orderInfo.ticketId) {
            attendeeInfo.actualTicketPrice = Number(presentPrice);
            attendees[index]               = attendeeInfo;
        }
    });
    return attendees;
}

/**
 * 获取订单应支付总金额,以及将门票的实际价格记录到每个参会者中
 * @param orderDetails 订单详情数组
 * @param ticketSetting 活动的门票数组
 * @param discount 折扣码对象
 * @param orderList 根据活动id查询出的所有订单信息数组
 * @param attendees 参会者信息数组
 * @returns {*}
 * @private
 */
function __getOrderShouldPayTotalPrice(orderDetails, ticketSetting, discount, orderList, attendees) {
    var totalPrice             = Big(0);// 总价格
    var presentPrice           = Big(0);// 门票当前价格
    var actualTicketTotalPrice = Big(0);// 当前门票花费的总价格
    var newAttendees           = [];
    _.each(orderDetails, function (orderInfo) {
        presentPrice           = __calcPresentPrice(orderInfo, ticketSetting, discount, orderList);
        presentPrice           = Big(presentPrice);
        newAttendees           = __convergeAttendees(attendees, orderInfo, presentPrice);
        actualTicketTotalPrice = presentPrice.times(orderInfo.ticketCount);
        totalPrice             = Big(totalPrice).plus(actualTicketTotalPrice);
    });
    return {totalPrice: totalPrice.round(precision), attendees: newAttendees};
}

// 获取订单原金额
var __getOrderOriginalPriceTotal = function (orderDetails, ticketSetting) {
    var originalPriceTotal = Big(0);
    _.each(orderDetails, function (ticketInfo) {
        var ticketDetail = Event.getTicketByTicketId(ticketInfo.ticketId, ticketSetting);
        var defaultPrice = Big(ticketDetail.defaultPrice);// 票原价
        var presentPrice = defaultPrice;// 现价

        originalPriceTotal = originalPriceTotal.plus(presentPrice.times(Big(ticketInfo.ticketCount)));
    });
    return originalPriceTotal.round(precision);
};

// 支付渠道费用总额,只有当确切知道用户选择的支付方式时才能计算出支付通道费
var __getThirdPartyCharge = function () {
    var thirdPartyCharge = Big(0);
    return thirdPartyCharge.round(precision);
};

/**
 * 校验时间
 * @param startTime
 * @param endTime
 * @returns {boolean}
 * @private
 */
var __validateTime = function (startTime, endTime) {
    var nowTime = moment();
    if (moment(startTime) > nowTime || moment(endTime) < nowTime) {
        return false;
    }
    return true;
};

/**
 * 计算订单服务费
 * @param user      用户对象
 * @param event     活动对象
 * @param totalPrice   订单支付金额
 */
var __getServiceFee = function (user, event, totalPrice) {
    var basePrice = Big(user.basePrice);// 最低服务费
    var percent   = Big(user.percent);// 票服务费比例(占票价百分比)
    var maxFee    = Big(user.maxFee);// 最高服务费

    if (event.percent !== 0) {
        basePrice = Big(event.basePrice);
        percent   = Big(event.percent);
        maxFee    = Big(event.maxFee);
    }

    var serviceFee = Big(totalPrice).times(percent.div(Big(100)));
    if (basePrice != 0) {
        serviceFee = (serviceFee < basePrice) ? basePrice : serviceFee;
    }
    if (maxFee != 0) {
        serviceFee = (serviceFee > maxFee) ? maxFee : serviceFee;
    }

    return serviceFee.round(precision);
};

// 审核订单,通过或拒绝
async function auditOrder(req, res, next) {
    const body        = req.body;
    const orderStatus = body.orderStatus;
    const orderId     = body.orderId;

    if (_.isEmpty(orderId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderId")
        });
    }

    if (_.isEmpty(orderStatus)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderStatus")
        });
    }

    if (!myutil.inArray(orderStatus, ['audited', 'reject'])) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("err_invalid_req_parameters")
        });
    }

    try {

        const orderInfo  = await Order.getOrderById(orderId);
        const totalPrice = orderInfo.totalPrice;

        let toBeUpdateData = {
            status: orderStatus
        };

        // 当审核通过时,并且订单的金额为0时,即是免费票直接将订单状态设置为已支付
        if ((orderStatus === 'audited') && (totalPrice === 0)) {
            toBeUpdateData.status = 'paid';
        }
        await Order.updateOrderById(orderId, toBeUpdateData);
        //发送参会者订单审核结果通知
        sysNotice.sendAuditNotice(req, orderId, orderStatus);
        return res.status(200).send(
            {
                errorCode: errorCodes.COMMON_SUCCESS, responseText: req.__('operate_success')
            }
        );
    } catch (err) {
        logger.error('auditOrder ', err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}


// 取消订单
function cancelOrder(req, res, next) {
    var body    = req.body;
    var orderId = body.orderId;

    if (_.isEmpty(orderId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderId")
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            var toBeUpdateData = {
                status: 'cancel'
            };

            var orderRet = yield Order.updateOrderById(orderId, toBeUpdateData);
            return res.status(200).send(_.pick(orderRet, 'id', 'status'));
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

// 给订单添加备注
function updateOrderNote(req, res, next) {
    var body      = req.body;
    var orderId   = body.orderId;
    var orderNote = body.orderNote;

    if (_.isEmpty(orderId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderId")
        });
    }

    if (_.isEmpty(orderNote)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderNote")
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            var toBeUpdateData = {
                orderNote: orderNote
            };

            var orderRet = yield Order.updateOrderById(orderId, toBeUpdateData);
            return res.status(200).send(orderRet);
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

// 统计折扣码使用数量
function statisticsDiscountCodeUsage(req, res, next) {

    var params       = req.query;
    var eventId      = params.eventId;
    var discountCode = params.discountCode;

    if (_.isEmpty(params)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "requset")
        });
    }

    if (_.isEmpty(eventId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "eventId")
        });
    }

    if (_.isEmpty(discountCode)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "discountCode")
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            // 1. 先根据活动id查询改活动id下的所有订单
            var orderAttributeNames = ["orderDetails"];
            var orderList           = yield Order.getOrderByEventId(eventId, orderAttributeNames);

            // 2. 遍历活动下的所有订单含有的折扣码是否与入参一致,一致则记录起来
            var totalUsedCount = Discount.getDiscountTotalUsedCount(orderList, {discountCode: discountCode});

            logger.debug('折扣码discountCode的使用总数量是:' + totalUsedCount);

            return res.status(200).send({totalUsedCount: totalUsedCount});
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

function __getPrepareCreateOrderInfo(orderDetails, currentEvent, discount, orderList) {
    var ticketSetting          = currentEvent.tickets;
    var totalPrice             = Big(0);// 总价格
    var presentPrice           = Big(0);// 门票当前价格
    var actualTicketTotalPrice = Big(0);// 当前门票花费的总价格
    var tickets                = _.map(orderDetails, function (orderInfo) {
        presentPrice           = __calcPresentPrice(orderInfo, ticketSetting, discount, orderList);
        presentPrice           = Big(presentPrice);
        actualTicketTotalPrice = presentPrice.times(orderInfo.ticketCount);
        totalPrice             = Big(totalPrice).plus(actualTicketTotalPrice);
        return {
            ticketId              : orderInfo.ticketId,
            ticketName            : orderInfo.ticketName,
            ticketCount           : orderInfo.ticketCount,
            actualTicketPrice     : Number(presentPrice.round(precision)),
            actualTicketTotalPrice: Number(actualTicketTotalPrice.round(precision)),
        };
    });

    var returnObj =
            {
                tickets             : tickets,
                totalPrice          : Number(Big(totalPrice).round(precision)),
                paymentPriceUnit    : currentEvent.paymentPriceUnit,
                paymentPriceUnitSign: currentEvent.paymentPriceUnitSign,
            };
    return returnObj;
}

// 准备创建订单
function prepareCreateOrder(req, res, next) {
    var body    = req.body;
    var userId  = body.userId;// 创建此订单的用户
    var eventId = body.eventId;// 活动主键id

    const doSomething = Promise.coroutine(function*() {
        try {
            var values        = yield __getOrderRelatedParameters(eventId);
            var currentEvent  = values.event;
            var currentOrders = values.orders;

            // 提取订单信息数组
            var orderDetails = _.map(body.order, function (order) {
                return {
                    ticketId   : order.ticketId,
                    ticketName : order.ticketName,
                    ticketCount: Number(order.total)
                };
            });

            if (!_.isEmpty(body.discount) && !_.isEmpty(body.discount.discountCode)) {
                var discounts            = yield Discount.getDiscountByCode(body.discount.discountCode);
                body.discount            = _.isEmpty(discounts[0]) ? {} : discounts[0];
                body.discount.discountId = _.isEmpty(body.discount) ? 0 : body.discount.id;
            }

            var returnObj = __getPrepareCreateOrderInfo(orderDetails, currentEvent, body.discount, currentOrders);
            return res.status(200).send(returnObj);
        } catch (err) {
            logger.error(err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

// 根据货币单位获取线上支付方式
function __getOnlinePayment(req, orderInfo) {
    var paymentPriceUnit = orderInfo.paymentPriceUnit;// 活动支持的货币单位
    var paymentMethod    = orderInfo.paymentMethod;// 活动支持的支付方式

    var onlinePayment = [];

    if (paymentPriceUnit === fixParams.CURRENCY_NAME.YUAN) {
        var onlinePayment_cny = [
            {
                name: 'alipay', str: req.__('onlinePayment_alipay'),
                img : 'https://beecloud.cn/demo/img/icon-ali.png'
            },
            {
                name: 'wechat', str: req.__('onlinePayment_wechat'),
                img : 'https://beecloud.cn/demo/img/icon-wechat.png'
            },
        ];// 人民币线上支付方式

        _.each(paymentMethod, function (method) {
            var paymentDetail = _.find(onlinePayment_cny, {name: method});
            if (paymentDetail) {
                onlinePayment.push(paymentDetail);
            }
        });
    }

    if (paymentPriceUnit === fixParams.CURRENCY_NAME.DOLLAR) {
        var onlinePayment_usd = [
            {
                name: 'paypal', str: req.__('onlinePayment_paypal'),
                img : 'https://www.paypalobjects.com/webstatic/i/logo/rebrand/ppcom.svg'
            },
        ];// 美元线上支付方式

        _.each(paymentMethod, function (method) {
            var paymentDetail = _.find(onlinePayment_usd, {name: method});
            if (paymentDetail) {
                onlinePayment.push(paymentDetail);
            }
        });
    }

    return onlinePayment;
}

// 根据货币单位获取线下支付方式
async function __getOfflinePayment(req, orderInfo) {
    const paymentPriceUnit = orderInfo.paymentPriceUnit;// 活动支持的货币单位
    const paymentMethod    = orderInfo.paymentMethod;// 活动支持的支付方式
    let offlinePayment     = [];

    if (paymentPriceUnit === fixParams.CURRENCY_NAME.YUAN) {

        const offlinePayment_cny = [
            {name: 'onsite', str: req.__('offlinePayment_onsite')},
            {name: 'transfer', str: req.__('offlinePayment_transfer')},
        ];// 人民币线下支付方式

        for (let method of paymentMethod) {

            let paymentDetail = _.find(offlinePayment_cny, {name: method});
            if (paymentDetail) {

                // 如果线下支付方式是method=transfer将paymentAccountInfoArr信息存储进线下支付方式中
                if (paymentDetail.name === 'transfer') {

                    try {
                        let walletInfo            = await __getWalletByEventId(req, orderInfo.eventId);
                        let paymentAccountIds     = walletInfo['paymentAccountIds'];
                        let paymentAccountInfoArr = [];

                        for (let paymentAccountId of paymentAccountIds) {

                            try {
                                let bankAccountInfo = Wallet.getBankAccountById(req, paymentAccountId, walletInfo);
                                paymentAccountInfoArr.push(bankAccountInfo);
                            } catch (e) {
                            }

                        }

                        paymentDetail.paymentAccountInfoArr = paymentAccountInfoArr;
                    } catch (e) {
                        paymentDetail.paymentAccountInfoArr = [];
                    }

                }

                offlinePayment.push(paymentDetail);
            }
        }

    }

    if (paymentPriceUnit === fixParams.CURRENCY_NAME.DOLLAR) {

        const offlinePayment_usd = [
            {name: 'onsite', str: req.__('offlinePayment_onsite')},
        ];// 美元线下支付方式

        _.each(paymentMethod, function (method) {
            let paymentDetail = _.find(offlinePayment_usd, {name: method});
            if (paymentDetail) {
                offlinePayment.push(paymentDetail);
            }
        });
    }

    return offlinePayment;
}

// 准备购买门票订单的支付信息
async function preparePay(req, res, next) {
    const locale  = req.getLocale();// 获取当前用户的语言zh,en
    const body    = req.body;
    const orderId = body.orderId;

    if (_.isEmpty(orderId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderId")
        });
    }

    try {
        const orderInfoArr = await Order.getOrderInfoAndEventInfoByOrderId(orderId);
        const orderInfo    = orderInfoArr[0];
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", "orderId")
            });
        }

        if (orderInfo.orderStatus === fixParams.ORDER_STATUS.ORDER_STATUS_PAID) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__('already_paid', 'orderNumber' + orderInfo.orderNumber),
            });
        }

        // 取出该活动支持的支付方式
        // 组装成对应的数据返回给前端
        const onlinePayment  = __getOnlinePayment(req, orderInfo);
        const offlinePayment = await __getOfflinePayment(req, orderInfo);

        const returnObj = {
            eventId             : orderInfo.eventId,// 活动id
            payee               : req.__('payee'),// 收款方
            paymentPurposes     : orderInfo.title + req.__('buy_ticket'),// 付款用途
            orderNumber         : orderInfo.orderNumber,// 订单号
            totalPrice          : orderInfo.totalPrice,// 订单应付金额
            cTime               : orderInfo.cTime,// 订单创建时间
            paymentMethod       : orderInfo.paymentMethod,// 支持的支付方式
            paymentPriceUnit    : orderInfo.paymentPriceUnit,// 货币单位
            paymentPriceUnitSign: orderInfo.paymentPriceUnitSign,// 货币单位符号
            onlinePayment       : onlinePayment,// 线上支付方式
            offlinePayment      : offlinePayment,// 线下支付方式,
        };

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

// 获取门票订单支付结果要跳转的页面
function __getTicketOrderPayResultPage(paymentMethod) {
    var jumpPage                = '';
    const ONLINE_PAYMENT_METHOD = [
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_EBANK,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL
    ];

    // 线上支付订单===>恭喜报名成功,期待参与
    if (myutil.inArray(paymentMethod, ONLINE_PAYMENT_METHOD)) {
        jumpPage = 'successfulRegistrationPage';
    }

    // 线下支付订单,银行转账支付===>报名成功,请在30分钟内完成银行转账支付
    if (paymentMethod === fixParams.PAYMENT_METHOD.PAYMENT_METHOD_TRANSFER) {
        jumpPage = 'toBeTransferPage';
    }
    // 线下支付订单,现场缴费===>报名成功,期待参与,现场缴费
    if (paymentMethod === fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ONSITE) {
        jumpPage = 'toBeOnsitePage';
    }

    return jumpPage;
}

// 发送邮件/短信通知
async function __sendNotice(req, orderInfo) {
    try {

        // 查询活动的所有者的邮件偏好设置,是否需要发送电子票
        const emailSetting = await User.getUserEmailSetting(orderInfo.userId);
        if (emailSetting.isNeedAttendeeNotice) {
            __sendETicketEmailAfterPay(req, orderInfo);
        }

        // 查看活动的短信设置,是否需要发送短信通知
        const isNeedSmsNotice = await Event.isNeedSmsNotice(orderInfo.eventId);
        if (isNeedSmsNotice) {
            __sendETicketSmsAfterPay(req, orderInfo);
        }

    } catch (err) {
        logger.error('__sendNotice ', err);
    }
}

// 获取门票订单支付结果
async function getTicketOrderPayResult(req, res, next) {
    var query       = req.query;
    var orderNumber = query.orderNumber;

    if (_.isEmpty(orderNumber)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderNumber")
        });
    }

    try {
        // 查询订单详情
        var orderInfoArr = await Order.getOrderInfo4TicketOrderPayResult(orderNumber);
        var orderInfo    = orderInfoArr[0];
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", "orderNumber")
            });
        }

        // 订单跳转页
        orderInfo.ticketOrderPayResultPage = __getTicketOrderPayResultPage(orderInfo.paymentMethod);
        // 订单是否支付成功
        orderInfo.isPaySuccess             = (orderInfo.orderStatus === fixParams.ORDER_STATUS.ORDER_STATUS_PAID);

        // if (orderInfo.isPaySuccess) {
        //     __sendNotice(req, orderInfo);
        // }

        return res.status(200).send(
            _.pick(orderInfo,
                [
                    'orderId', 'eventId', 'orderNumber',
                    'currencyType', 'paymentPriceUnitSign', 'paymentMethod',
                    'totalPrice', 'cTime', 'buyer',
                    'orderStatus', 'title', 'startTime',
                    'endTime', 'logoUrl', 'bannerUrl', 'ticketOrderPayResultPage', 'isPaySuccess',
                    'onlineAddress', 'detailedAddress',
                ]
            )
        );
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

async function __sendETicketSmsAfterPay(req, orderInfo) {

    try {

        // 根据活动短信通知模板转换成短信的内容
        const customSmsContent = orderInfo.customSmsContent;
        if ((_.isUndefined(customSmsContent)) || (_.isEmpty(customSmsContent))) { return; }

        const attendees = orderInfo.attendees;
        const eventUrl  = await Order.getEventShortUrl(orderInfo.eventId);

        for (let attendeeInfo of attendees) {

            const ticketUrl = await Order.getTicketShortUrl(orderInfo.orderNumber, attendeeInfo.attendeeId);

            let newOrderInfo = {

                mobile    : attendeeInfo.collectInfo.mobile || attendeeInfo.collectInfo.phone,
                eventId   : orderInfo.eventId,
                userId    : orderInfo.userId,
                name      : attendeeInfo.collectInfo.name,
                attendeeId: attendeeInfo.attendeeId,
                ticketUrl : ticketUrl,
                eventUrl  : eventUrl,

            };

            newOrderInfo.content = await Event.getSmsNoticeContent(customSmsContent, newOrderInfo);

            Order.sendETicketSmsAfterPay(req, newOrderInfo);

        }

    } catch (err) {
        logger.error('__sendETicketSmsAfterPay ', err);
    }

}

async function __sendETicketEmailAfterPay(req, orderInfo) {

    try {

        const newOrderInfo = {
            'id'         : orderInfo.orderId,
            'orderNumber': orderInfo.orderNumber,
            'attendees'  : orderInfo.attendees,
            'cTime'      : orderInfo.cTime,
            'eventId'    : orderInfo.eventId,
            'buyer'      : orderInfo.buyer
        };

        const eventInfo = {
            'id'             : orderInfo.eventId,
            'userId'         : orderInfo.userId,
            'title'          : orderInfo.title,
            'organizers'     : orderInfo.organizers,
            'tickets'        : orderInfo.tickets,
            'onlineAddress'  : orderInfo.onlineAddress,
            'detailedAddress': orderInfo.detailedAddress,
            'bannerUrl'      : orderInfo.bannerUrl,
            'contact'        : orderInfo.contact,
        };

        const attendees = newOrderInfo.attendees;

        for (let attendeeInfo of attendees) {

            const toReplaceData = await Order.getTicketReplaceData(eventInfo, newOrderInfo, attendeeInfo, req);// 拼装要进行替换的变量
            await Order.createETicket(newOrderInfo, attendeeInfo, toReplaceData, req);
            Order.sendETicketEmail(eventInfo, newOrderInfo, attendeeInfo, toReplaceData, req);
            Order.updateETicketSent(newOrderInfo, attendeeInfo.attendeeId);

        }

    } catch (err) {
        logger.error('__sendETicketEmailAfterPay ', err);
    }

}

// 单独给购票者发送邮件
async function __sendETicketEmailToBuyer(req, orderInfo) {

    try {

        const newOrderInfo = {
            'id'         : orderInfo.orderId,
            'orderNumber': orderInfo.orderNumber,
            'attendees'  : orderInfo.attendees,
            'cTime'      : orderInfo.cTime,
            'eventId'    : orderInfo.eventId,
            'buyer'      : orderInfo.buyer
        };

        const eventInfo = {
            'id'             : orderInfo.eventId,
            'userId'         : orderInfo.userId,
            'title'          : orderInfo.title,
            'organizers'     : orderInfo.organizers,
            'tickets'        : orderInfo.tickets,
            'onlineAddress'  : orderInfo.onlineAddress,
            'detailedAddress': orderInfo.detailedAddress
        };

        const toReplaceData =
                  {
                      eventName: eventInfo.title,
                      organizer: Event.getOrgNameArr(eventInfo).toString() || '',
                      eventTime: Event.getEventTimeStr(eventInfo),
                      address  : Event.getEventLocation(req, eventInfo),
                      name     : orderInfo.buyer.name || '',
                      buyerName: orderInfo.buyer.name || '',
                      buyTime  : moment(newOrderInfo.cTime).format('YYYY-MM-DD HH:mm'),
                  };

        Order.sendETicketEmailToBuyer(eventInfo, newOrderInfo, newOrderInfo.buyer.email, toReplaceData, req);

    } catch (err) {
        logger.error('__sendETicketEmailToBuyer ', err);
    }

}

// 准备后台管理员添加参会人员需要的信息
async function prepareAdminAddAttendee(req, res, next) {
    var query   = req.query;
    var userId  = req.user.id;// 准备创建此订单的用户
    var eventId = query.eventId;// 活动主键id

    if (_.isEmpty(eventId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "eventId")
        });
    }

    try {

        // 根据活动id查询活动是否存在
        var eventAttributeNames = ['tickets', 'collectItems'];
        var eventInfo           = await Event.getEventById(eventId, eventAttributeNames);

        var normalCollectItems = _.filter(eventInfo.collectItems, {isDeleted: false});

        // 查询所有在售门票列表
        var normalTickets = _.filter(eventInfo.tickets, {status: 'normal'});
        var ticketList    = _.map(normalTickets, function (ticketInfo) {
            return {name: ticketInfo.ticketId, str: ticketInfo.name};
        });

        // 查询支付方式列表
        var adminPaymentMethodList = Order.getAdminPaymentMethodList(req);

        var returnObj = {
            collectItems          : normalCollectItems,
            ticketList            : ticketList,
            adminPaymentMethodList: adminPaymentMethodList,
        };

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

// 获取订单excel文件的路径
function __getOrdersExcelPath(eventId) {
    var appDir     = myutil.getAppDir();
    var folderName = 'orders';
    var fileName   = eventId + '.xlsx';
    var filePath   = path.join("public/files/", folderName, fileName);
    return filePath;
}

// 获取导出订单列表的excel表头
function __getOrdersHeaders(req, eventInfo) {
    var headers = [
        req.__('orders_headers_orderNumber'), req.__('orders_headers_ticketCount'),
        req.__('orders_headers_amount', eventInfo.paymentPriceUnitSign), req.__('orders_headers_name'),
        req.__('orders_headers_email'), req.__('orders_headers_orderTime'),
        req.__('orders_headers_paymentStatus'), req.__('orders_headers_paymentType'),
        req.__('orders_headers_discountCode'), req.__('orders_headers_orderStatus'),
        req.__('orders_headers_orderNote'), req.__('orders_headers_invoiceType'),
        req.__('orders_headers_serviceItem'), req.__('orders_headers_attendees'),
        req.__('orders_headers_invoiceTitle'), req.__('orders_headers_taxID'),
        req.__('orders_headers_companyAddress'), req.__('orders_headers_companyPhoneNumber'),
        req.__('orders_headers_companyBank'), req.__('orders_headers_companyBankAccount'),
        req.__('orders_headers_receiver'), req.__('orders_headers_receiverPhone'),
        req.__('orders_headers_receiverAddress')
    ];
    return headers;
}

// 获取参会人员的名字数组
function __getAttendeesNameStr(attendees) {

    return _.reduce(attendees, function (attendeesNameArr, attendeeInfo) {

        var collectInfo = attendeeInfo.collectInfo;

        return collectInfo.name ? attendeesNameArr.concat(collectInfo.name) : attendeesNameArr;

    }, []);
}

// 获取订单列表的excel数据
async function __getOrdersData(req, eventInfo) {

    // [
    //     "订单号", "门票数量(张)", "金额(¥)", "姓名", "邮箱", "下单时间",
    //     "支付状态", "支付方式", "优惠码", "订单状态", "订单备注", "发票类型",
    //     "服务项目", "参会人", "发票抬头", "税务登记证号码", "公司注册地址", "公司财务电话",
    //     "公司开户行(详细到支行)", "银行账号", "收件人", "联系电话", "收件人地址",
    // ]

    var ordersData = [];

    var params  = req.query;
    var eventId = params.eventId;

    var headers = __getOrdersHeaders(req, eventInfo);

    // 根据活动id查询所有订单
    var orderAttributeNames = [
        'orderNumber', 'orderDetails', 'totalPrice', 'buyer', 'attendees',
        'cTime', 'status', 'paymentMethod', 'orderNote', 'isNeedInvoice',
        'invoiceSetting', 'invoice', 'discount'
    ];
    var orderList           = await Order.getOrderByEventId(eventId, orderAttributeNames);

    var orderStatusList   = Order.getOrderStatusList(req);// 查询所有订单状态
    var paymentMethodList = Order.getPaymentMethodList(req, false);// 查询所有支付方式
    var invoiceTypeList   = Event.getInvoiceTypeList(req);// 所有开票类型

    for (var orderInfo of orderList) {

        var orderNumber = orderInfo.orderNumber || '';// 订单号
        var ticketCount = Order.getTicketCount(orderInfo.orderDetails) || '';// 门票数量
        var totalPrice  = orderInfo.totalPrice || '';// 金额
        var name        = orderInfo.buyer.name || '';// 姓名
        var email       = orderInfo.buyer.email || '';// 邮箱
        var orderCTime  = moment(orderInfo.cTime).format('YYYY-MM-DD HH:mm') || '';// 下单时间

        var i18nOrderStatus = _.find(orderStatusList, {name: orderInfo.status});
        var paymentStatus   = i18nOrderStatus.str || '';// 支付状态

        var i18nPayMethod = _.find(paymentMethodList, {name: orderInfo.paymentMethod});
        var paymentMethod = i18nPayMethod.str || '';// 支付方式

        var discountCode = _.isUndefined(orderInfo.discount) ? '' : orderInfo.discount.discountCode;// 优惠码
        var orderStatus  = i18nOrderStatus.str || '';// 订单状态
        var orderNote    = orderInfo.orderNote || '';// 订单备注

        var i18nInvoiceType = _.find(invoiceTypeList, {name: orderInfo.invoiceSetting.type});
        var invoiceType     = _.isUndefined(i18nInvoiceType) ? '' : i18nInvoiceType.str;// 发票类型

        var serviceItems = orderInfo.serviceItems || '';// 服务项目

        var attendees = __getAttendeesNameStr(orderInfo.attendees) || '';// 参会人

        var oneOrderInfo = [];
        oneOrderInfo.push(orderNumber);
        oneOrderInfo.push(ticketCount);
        oneOrderInfo.push(totalPrice);
        oneOrderInfo.push(name);
        oneOrderInfo.push(email);
        oneOrderInfo.push(orderCTime);
        oneOrderInfo.push(paymentStatus);
        oneOrderInfo.push(paymentMethod);
        oneOrderInfo.push(discountCode);
        oneOrderInfo.push(orderStatus);
        oneOrderInfo.push(orderNote);
        oneOrderInfo.push(invoiceType);
        oneOrderInfo.push(serviceItems);
        oneOrderInfo.push(attendees);

        var invoice          = orderInfo.invoice;
        var resultOrdersData = [];
        _.each(invoice, function (invoiceInfo) {

            var newOneOrderInfo = _.cloneDeep(oneOrderInfo);

            var invoiceTitle              = invoiceInfo.title || '';// 发票抬头
            var taxID                     = invoiceInfo.taxRegistrationCertificateNumber || '';// 税务登记证号码
            var companyRegisteredAddress  = invoiceInfo.companyRegisteredAddress || '';// 公司注册地址
            var companyFinancialTelephone = invoiceInfo.companyFinancialTelephone || '';// 公司财务电话
            var companyAccountName        = invoiceInfo.companyAccountName || '';// 公司开户行(详细到支行)
            var companyAccount            = invoiceInfo.companyAccount || '';// 银行账号
            var receiver                  = invoiceInfo.receiver || '';// 收件人
            var contact                   = invoiceInfo.contact || '';// 联系电话
            var address                   = invoiceInfo.address || '';// 收件人地址

            newOneOrderInfo.push(invoiceTitle);
            newOneOrderInfo.push(taxID);
            newOneOrderInfo.push(companyRegisteredAddress);
            newOneOrderInfo.push(companyFinancialTelephone);
            newOneOrderInfo.push(companyAccountName);
            newOneOrderInfo.push(companyAccount);
            newOneOrderInfo.push(receiver);
            newOneOrderInfo.push(contact);
            newOneOrderInfo.push(address);

            resultOrdersData.push(newOneOrderInfo);
        });

        if (_.isEmpty(resultOrdersData)) {

            var newOneOrderInfo = _.cloneDeep(oneOrderInfo);

            newOneOrderInfo.push('');
            newOneOrderInfo.push('');
            newOneOrderInfo.push('');
            newOneOrderInfo.push('');
            newOneOrderInfo.push('');
            newOneOrderInfo.push('');
            newOneOrderInfo.push('');
            newOneOrderInfo.push('');
            newOneOrderInfo.push('');

            resultOrdersData.push(newOneOrderInfo);
        }

        _.each(resultOrdersData, function (tmpOneOrderInfo) {
            ordersData.push(tmpOneOrderInfo);
        });

    }

    console.log(ordersData);

    return {data: ordersData, headers: _.uniq(headers)};
}

function __createOrdersExcel(req, filePath) {
    Promise.coroutine(function*() {

        var params  = req.query;
        var eventId = params.eventId;

        logger.debug('eventId=' + eventId + '正在创建导出订单excel数据...');

        var eventAttributeNames = ['id', 'title', 'startTime', 'endTime', 'detailedAddress', 'onlineAddress', 'paymentPriceUnitSign'];
        var eventInfo           = yield Event.getEventById(eventId, eventAttributeNames);

        var eventTitle    = eventInfo.title;
        var eventTime     = Event.getEventTimeStr(eventInfo);
        var eventLocation = Event.getEventLocation(req, eventInfo);
        var excelData     = yield __getOrdersData(req, eventInfo);
        var sheets        = [
            {
                name   : req.__('orders_sheet_name'),
                info   : [
                    req.__('orders_event_name', eventTitle),
                    req.__('orders_event_time', eventTime),
                    req.__('orders_event_location', eventLocation),
                ],
                headers: excelData.headers,
                data   : excelData.data
            }
        ];

        logger.debug('eventId=' + eventId + '导出订单excel数据完成...');

        myutil.createExcel(sheets, filePath);
    })();
}

async function prepareExportOrders(req, res, next) {
    var params  = req.query;
    var eventId = params.eventId;

    if (_.isEmpty(eventId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'eventId')
        });
    }

    try {

        var filePath = __getOrdersExcelPath(eventId);

        __createOrdersExcel(req, filePath);

        return res.status(200).send({filePath: filePath});
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

// 根据活动id获取钱包详情
async function __getWalletByEventId(req, eventId) {
    try {
        // 根据eventId查询创建活动时选择的paymentAccountIds和userId
        var eventInfo = await Event.getEventById(eventId, ['userId', 'paymentAccountIds']);
        if (_.isEmpty(eventInfo['paymentAccountIds'])) {
            throw new Error(req.__('NotExists', 'event paymentAccountIds'));
        }

        var walletInfo = await Wallet.getWalletByUserId(eventInfo.userId, ['userId', 'personalAccount', 'businessAccount', 'paypalAccount']);
        if (
            _.isEmpty(walletInfo['personalAccount']) &&
            _.isEmpty(walletInfo['businessAccount']) &&
            _.isEmpty(walletInfo['paypalAccount'])
        ) {
            throw new Error(req.__('NotExists', 'wallet personalAccount,businessAccount,paypalAccount'));
        }

        var paymentAccountIds = eventInfo['paymentAccountIds'];
        var personalAccount   = walletInfo['personalAccount'];
        var businessAccount   = walletInfo['businessAccount'];
        var paypalAccount     = walletInfo['paypalAccount'];

        return {
            eventId          : eventId,
            userId           : eventInfo.userId,
            paymentAccountIds: paymentAccountIds,
            personalAccount  : personalAccount,
            businessAccount  : businessAccount,
            paypalAccount    : paypalAccount,
        };
    } catch (e) {
        throw e;
    }
}

// 获取PalPal账户详情
async function __getPayPalAccount(req, eventId) {
    try {
        let walletInfo        = await __getWalletByEventId(req, eventId);
        let paymentAccountIds = walletInfo['paymentAccountIds'];
        let payPalInfo        = {};

        for (let paymentAccountId of paymentAccountIds) {
            try {
                payPalInfo = Wallet.getPayPalAccountById(req, paymentAccountId, walletInfo);
            } catch (e) {
            }
        }

        if (_.isEmpty(payPalInfo)) {
            throw new Error(req.__('NotExists', 'wallet payPalInfo'));
        }
        return payPalInfo;
    } catch (e) {
        throw e;
    }
}

// 门票订单支付,适用于支付宝和PayPal两种支付方式
exports.payTicketOrder = async function (req, res, next) {
    const body          = req.body;
    const orderNumber   = body.orderNumber;
    const productName   = body.productName;
    const paymentMethod = body.paymentMethod;

    if (_.isEmpty(orderNumber)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'orderNumber')
        });
    }

    if (_.isEmpty(productName)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'productName')
        });
    }

    if (_.isEmpty(paymentMethod)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'paymentMethod')
        });
    }

    try {

        var attributeNames = ['orderNumber', 'eventId', 'totalPrice', 'serviceFee', 'status'];
        var orderInfo      = await Order.getOrderByOrderNum(orderNumber, attributeNames);
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__('NotExists', 'orderNumber'),
            });
        }

        if (orderInfo.status === fixParams.ORDER_STATUS.ORDER_STATUS_PAID) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__('already_paid', 'orderNumber=' + orderNumber),
            });
        }

        // 使用支付宝进行支付
        if (fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY === paymentMethod) {
            const data = {
                out_trade_no: orderNumber,
                subject     : productName,
                total_fee   : orderInfo.totalPrice,
            };

            res.contentType('text/html');
            return res.send(Alipay.directPayByUser(data));
        }

        // 使用PayPal进行支付
        if (fixParams.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL === paymentMethod) {
            var payPalInfo = await __getPayPalAccount(req, orderInfo.eventId);
            if (_.isEmpty(payPalInfo.account)) {
                return next({
                    errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                    responseText: req.__('NotExists', 'payPalInfo.account'),
                });
            }
            const data = {
                orderId     : orderNumber,
                memo        : productName,
                email       : payPalInfo.account,// 主办方的贝宝邮箱账号
                amount      : orderInfo.totalPrice,
                eventdoveFee: orderInfo.serviceFee
            };

            const redirectUrl = await PayPal.sharePay(data);
            logger.debug('user select paypal method and it will be Redirect to %s', redirectUrl);
            return res.redirect(redirectUrl);
        }

    } catch (e) {
        logger.error(e);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

// 分页获取用户下所有定单
exports.getOrderByUserIdAndPageIndex = async function (req, res, next) {
    var params = req.query;

    if (_.isEmpty(params.userId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "userId")
        });
    }

    try {
        var data                 = await Order.getOrderByUserIdAndPageIndex(params);
        var paginate             = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);
        paginate.orderStatusList = Order.getOrderStatusList(req);// 查询所有订单状态

        return res.status(200).send(paginate);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// 线下订单确认收款
exports.confirmOfflineOrder = async function (req, res, next) {
    const body    = req.body;
    const orderId = body.orderId;

    if (_.isEmpty(orderId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderId")
        });
    }

    try {
        const orderRet = await Order.confirmOfflineOrder(orderId);
        return res.status(200).send(orderRet);
    } catch (err) {
        logger.error(err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// 确认某个参会者收款
exports.confirmAttendee = async function (req, res, next) {
    const body       = req.body;
    const orderId    = body.orderId;
    const attendeeId = body.attendeeId;

    if (_.isEmpty(orderId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderId")
        });
    }

    if (_.isEmpty(attendeeId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "attendeeId")
        });
    }

    try {
        const orderRet = await Order.confirmAttendee(orderId, attendeeId);
        return res.status(200).send(orderRet);
    } catch (err) {
        logger.error(err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// 更新订单的支付方式
exports.updatePaymentMethod = async function (req, res, next) {
    const body          = req.body;
    const orderId       = body.orderId;
    const paymentMethod = body.paymentMethod;

    if (_.isEmpty(orderId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderId")
        });
    }

    if (_.isEmpty(paymentMethod)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "paymentMethod")
        });
    }

    try {

        const PAYMENT_METHOD_ARR = _.values(fixParams.PAYMENT_METHOD);

        if (!myutil.inArray(paymentMethod, PAYMENT_METHOD_ARR)) {

            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("invalid_something", "paymentMethod")
            });

        }

        const toBeUpdateData = {
            paymentMethod: paymentMethod
        };

        const orderRet = await Order.updateOrderById(orderId, toBeUpdateData);
        return res.status(200).send(orderRet);
    } catch (err) {
        logger.error('updatePaymentMethod ', err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};
