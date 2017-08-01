/**
 * 处理微信支付的回调,以及组装微信相关的参数
 * Created by zhaohongyu on 2017/7/21.
 */

'use strict';

const _              = require('lodash');
const Big            = require('big.js');
const loggerSettings = require('../../../logger');
const logger         = loggerSettings.winstonLogger;
const WxPayConfig    = require('./config').WxPayConfig;
const myutil         = require('../../../util/util');
const errorCodes     = require('../../../util/errorCodes.js').ErrorCodes;
const fixParams      = require('../../../util/fixParams');
const r              = require('../../../util/thinky.js').r;

const Event       = require('../../../model/event');
const Order       = require('../../../model/order');
const Transaction = require('../../../model/transaction');
const sysNotice   = require('../../../model/admin/sysNotice');
const Notice      = require('../../../model/notice');

// 验证微信异步通知结果的签名
exports.verifyWxSign = function (result, wxpayObj) {
    let newResult = _.cloneDeep(result);
    const wxSign  = newResult.sign;// 微信返回的签名
    delete newResult.sign;
    const localSign = wxpayObj.sign(newResult);// 本地的签名
    return wxSign === localSign;
};

// 短信邮件订单的微信请求参数
exports.makeWxSmsEmailOrderReqParams = async function (req, res, next) {
    const body        = req.body;
    const orderNumber = body.orderNumber;
    const orderInfo   = await Notice.getSmsEmailOrderByOrderNum(orderNumber);
    if (_.isEmpty(orderInfo)) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: req.__('NotExists', 'orderNumber'),
        });
    }
    return Notice.getWxSmsEmailOrderReqParams(req, orderInfo, WxPayConfig);
};

// 门票订单的微信请求参数
exports.makeWxTicketOrderReqParams = async function (req, res, next) {
    const body           = req.body;
    const orderNumber    = body.orderNumber;
    const attributeNames = ['orderNumber', 'eventId', 'totalPrice'];
    const orderInfo      = await Order.getOrderByOrderNum(orderNumber, attributeNames);
    if (_.isEmpty(orderInfo)) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: req.__('NotExists', 'orderNumber'),
        });
    }
    return Order.getWxTicketOrderReqParams(req, orderInfo, WxPayConfig);
};

// 处理门票订单微信支付结果异步通知
exports.dealWxTicketOrderNotify = async function (result, WxReq, WxRes, WxNext, OriginReq) {
    try {
        const orderNumber       = result.out_trade_no;// 商户订单号
        const source            = result.openid;// 订单来源账户
        const destination       = result.mch_id;// 订单目标账户
        const paymentPlatformId = result.transaction_id;// 支付平台流水号
        const total_fee         = Number(result.total_fee);// 订单总金额，单位为分

        logger.debug('orderNumber = ', orderNumber, ' 处理门票订单微信支付结果异步通知被调用');

        const attributeNames = ['id', 'orderNumber', 'eventId', 'totalPrice', 'serviceFee', 'status', 'currencyType'];
        const orderInfo      = await Order.getOrderByOrderNum(orderNumber, attributeNames);
        if (_.isEmpty(orderInfo)) {
            logger.error('orderNumber = ', orderNumber, ' 门票订单不存在');
            return WxRes.fail();
        }

        const eventInfo = await Event.tryGetEventInfo(orderInfo.eventId, ['userId']);
        if (_.isEmpty(eventInfo)) {
            logger.error('orderNumber = ', orderNumber, ',eventId = ' + orderInfo.eventId + ' 门票订单对应的活动详情不存在');
            return WxRes.fail();
        }

        // 检查订单状态,如果为已支付直接返回成功
        if (orderInfo.status === 'paid') {
            logger.debug('orderNumber = ', orderNumber, ' 门票订单已经支付过了');
            return WxRes.success();
        }

        // 校验返回的订单金额是否与商户侧的订单金额一致
        if ((orderInfo.totalPrice * 100) !== total_fee) {
            logger.error('orderNumber = ', orderNumber, ' 门票订单金额与支付金额不符');
            logger.error('orderNumber = ', orderNumber, ' 门票订单实际应该支付的金额是' + orderInfo.totalPrice * 100, '分');
            logger.error('orderNumber = ', orderNumber, ' 微信返回的用户支付的门票订单金额是' + total_fee, '分');
            return WxRes.fail();
        }

        const duplicatedTransaction = await Transaction.getTransactionByPaymentPlatformId(paymentPlatformId);
        if (!_.isEmpty(duplicatedTransaction)) {
            logger.debug('orderNumber = ', orderNumber, 'paymentPlatformId = ', paymentPlatformId + ' 已经插入过事物表了,所以标记为支付成功');
            return WxRes.success();
        }

        // 构造事物数据
        const amount             = Big(total_fee).div(Big(100));// 订单支付总金额单位,元
        const eventdoveNetIncome = Big(orderInfo.serviceFee);// 会鸽净收入
        const channelFee         = amount.times(Big(fixParams.CHANNEL_FEE_TYPE.CHANNEL_FEE_TYPE_WECHAT));// 支付通道费
        const netIncome          = amount.minus(eventdoveNetIncome).minus(channelFee);// 主办方净收入
        const transaction        = {
            type              : 'TICKET',// 订单类型
            refId             : orderInfo.eventId,// 活动主键id
            userId            : eventInfo.userId,// 活动主办方用户id
            paymentMethod     : fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,// 支付方式
            source            : source,// 订单来源账户
            destination       : destination,// 订单目标账户
            orderId           : orderNumber,// 订单号
            paymentPlatformId : paymentPlatformId,// 支付平台流水号
            amount            : Number(amount),// 支付总额
            eventdoveNetIncome: Number(eventdoveNetIncome),// 会鸽净收入,即收取的服务费
            channelFee        : Number(channelFee),// 协议通道费 = 支付总金额 * 0.006
            netIncome         : Number(netIncome),// 主办方净收入、支出 净收入 = 支付总金额 - eventdoveNetIncome - channelFee
            currency          : orderInfo.currencyType,// 货币单位
            rawNotification   : JSON.stringify(result),// 支付回调原始数据
        };
        const insertTransaction  = await Transaction.addTransaction(transaction);
        if (_.isEmpty(insertTransaction)) {
            logger.error('orderNumber = ', orderNumber, ' 微信支付后,插入事物失败了,待插入的数据信息是');
            logger.error(transaction);
            logger.error('orderNumber = ', orderNumber, ' 微信支付后,插入事物失败了,微信返回的原始信息是');
            logger.error(result);
            return WxRes.fail();
        }

        // 门票订单后续处理逻辑,更改订单状态status为paid,更改订单支付方式paymentMethod为wechat,等其他操作
        const updateTicketOrder = {
            status          : fixParams.ORDER_STATUS.ORDER_STATUS_PAID,// 更改订单状态status为paid
            paymentMethod   : fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,// 更改订单支付方式paymentMethod为wechat
            thirdPartyCharge: Number(channelFee),// 第三方通道费
            attendees       : r.row("attendees").map(
                function (attendeeInfo) {
                    return attendeeInfo.merge({payStatus: 'paid'});
                })
        };
        Order.updateOrderById(orderInfo.id, updateTicketOrder);

        logger.debug('orderNumber = ', orderNumber, ',orderId = ' + orderInfo.id + ' 的订单,微信支付成功了!!!');

        // 发送通知
        logger.debug('orderNumber = ', orderNumber, " 微信门票支付成功，发送邮件相关通知");
        sysNotice.sendNoticeAfterOrderPay(OriginReq, orderInfo.id);

        return WxRes.success();
    } catch (err) {
        logger.error('dealWxTicketOrderNotify ', err);
        return WxRes.fail();
    }
};

// 处理短信或者邮件订单微信支付结果异步通知
exports.dealWxSmsEmailOrderNotify = async function (result, WxReq, WxRes, WxNext, OriginReq) {
    try {
        const transactionType   = result.transactionType;// 事务的类型
        const orderNumber       = result.out_trade_no;// 商户订单号
        const source            = result.openid;// 订单来源账户
        const destination       = result.mch_id;// 订单目标账户
        const paymentPlatformId = result.transaction_id;// 支付平台流水号
        const total_fee         = Number(result.total_fee);// 订单总金额，单位为分

        logger.debug('orderNumber = ', orderNumber, ' 处理短信或者邮件订单微信支付结果异步通知被调用');

        const attributeNames = ['id', 'orderNumber', 'userId', 'totalPrice', 'rechargeNumber', 'type', 'currencyType', 'status'];
        const orderInfo      = await Notice.getSmsEmailOrderByOrderNum(orderNumber, attributeNames);
        if (_.isEmpty(orderInfo)) {
            logger.error('orderNumber = ', orderNumber, ' 短信邮件充值订单不存在');
            return WxRes.fail();
        }

        // 检查订单状态,如果为已支付直接返回成功
        if (orderInfo.status === 'paid') {
            logger.debug('orderNumber = ', orderNumber, ' 短信邮件充值订单已经支付过了');
            return WxRes.success();
        }

        // 校验返回的订单金额是否与商户侧的订单金额一致
        if ((orderInfo.totalPrice * 100) !== total_fee) {
            logger.error('orderNumber = ', orderNumber, ' 短信邮件充值订单金额与支付金额不符');
            logger.error('orderNumber = ', orderNumber, ' 短信邮件充值订单实际应该支付的金额是' + orderInfo.totalPrice * 100, '分');
            logger.error('orderNumber = ', orderNumber, ' 微信返回的用户支付的短信邮件充值订单金额是' + total_fee, '分');
            return WxRes.fail();
        }

        const duplicatedTransaction = await Transaction.getTransactionByPaymentPlatformId(paymentPlatformId);
        if (!_.isEmpty(duplicatedTransaction)) {
            logger.debug('orderNumber = ', orderNumber, ' paymentPlatformId = ', paymentPlatformId, ' 已经插入过事物表了,所以标记为支付成功');
            return WxRes.success();
        }

        // 构造事物数据
        const amount             = Big(total_fee).div(Big(100));// 订单支付总金额单位,元
        const eventdoveNetIncome = amount;// 会鸽净收入
        const channelFee         = 0;// 支付通道费
        const netIncome          = 0;// 主办方净收入
        const transaction        = {
            type              : transactionType,// 订单类型
            refId             : orderInfo.userId,// userId,需要充值的主办方用户id
            userId            : orderInfo.userId,// userId,需要充值的主办方用户id
            paymentMethod     : fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,// 支付方式
            source            : source,// 订单来源账户
            destination       : destination,// 订单目标账户
            orderId           : orderNumber,// 订单号
            paymentPlatformId : paymentPlatformId,// 支付平台流水号
            amount            : Number(amount),// 支付总额
            eventdoveNetIncome: Number(eventdoveNetIncome),// 会鸽净收入,充值的金额都属于会鸽
            channelFee        : Number(channelFee),// 协议通道费 = 0
            netIncome         : Number(netIncome),// 主办方净收入 = 0
            currency          : orderInfo.currencyType,// 货币单位
            orderDetail       : orderInfo,
            rawNotification   : JSON.stringify(result),// 支付回调原始数据
        };
        const insertTransaction  = await Transaction.addTransaction(transaction);
        if (_.isEmpty(insertTransaction)) {
            logger.error('orderNumber = ', orderNumber, ' 微信支付后,插入事物失败了,待插入的数据信息是');
            logger.error(transaction);
            logger.error('orderNumber = ', orderNumber, ' 微信支付后,插入事物失败了,微信返回的原始信息是');
            logger.error(result);
            return WxRes.fail();
        }

        // 短信邮件订单后续处理逻辑,更改订单状态status为paid,更改订单支付方式paymentMethod为wechat,等其他操作
        const updateOrder = {
            status       : fixParams.ORDER_STATUS.ORDER_STATUS_PAID,// 更改订单状态status为paid
            paymentMethod: fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,// 更改订单支付方式paymentMethod为wechat
        };
        Notice.updateSmsEmailOrderById(orderInfo.id, updateOrder);

        logger.debug('orderNumber = ', orderNumber, ',orderId = ' + orderInfo.id + ' 的 transactionType = ' + transactionType + ' 短信邮件充值订单,微信支付成功了!!!');

        logger.debug('orderNumber = ', orderNumber, " 微信短信邮件充值成功，发送相关通知");
        sysNotice.sendSmsEmailNoticeAfterOrderPay(OriginReq, orderInfo.id);

        return WxRes.success();
    } catch (err) {
        logger.error('dealWxSmsEmailOrderNotify ', err);
        return WxRes.fail();
    }
};
