/**
 * 处理支付宝支付的回调,以及组装支付宝相关的参数
 * Created by zhaohongyu on 2017/7/21.
 */

'use strict';

const _              = require('lodash');
const Big            = require('big.js');
const moment         = require('moment');
const loggerSettings = require('../../../logger');
const logger         = loggerSettings.winstonLogger;
const myutil         = require('../../../util/util');
const errorCodes     = require('../../../util/errorCodes.js').ErrorCodes;
const fixParams      = require('../../../util/fixParams');
const r              = require('../../../util/thinky.js').r;

const Event       = require('../../../model/event');
const Order       = require('../../../model/order');
const Transaction = require('../../../model/transaction');
const sysNotice   = require('../../../model/admin/sysNotice');
const Notice      = require('../../../model/notice');
const Member      = require('../../../model/member');

// 处理会员订单支付宝支付结果异步通知
exports.dealWithMemberOrderByAliPay = async function (result) {

    try {

        /**
         * 0. 验证订单核对交易金额
         * 1. 插入一条Transaction
         * 2. 插入成功 异步修改订单 返回true
         * 3. 插入失败 返回false
         */

        const orderNumber       = result.out_trade_no;// 商户订单号
        const source            = result.buyer_email;// 订单来源账户
        const destination       = result.seller_email;// 订单目标账户
        const paymentPlatformId = result.trade_no;// 支付平台流水号
        const total_fee         = Number(result.total_fee);// 订单总金额，单位为元
        const paymentTime       = result.gmt_payment;

        logger.debug('orderNumber = ', orderNumber, ' 处理会员订单支付宝支付结果异步通知被调用');

        const memberOrderInfo = await Member.getMemberOrderById(orderNumber);// 会员订单详情
        if (_.isEmpty(memberOrderInfo)) {
            logger.error('orderNumber = ', orderNumber, ' 会员订单不存在');
            return false;
        }

        // 检查订单状态,如果为已支付直接返回成功
        if (memberOrderInfo.payStatus === 'paid') {
            logger.debug('orderNumber = ', orderNumber, ' 会员订单已经支付过了');
            return true;
        }

        // 校验返回的订单金额是否与商户侧的订单金额一致
        if ((memberOrderInfo.totalPrice) !== total_fee) {
            logger.error('orderNumber = ', orderNumber, ' 会员订单金额与支付金额不符');
            logger.error('orderNumber = ', orderNumber, ' 会员订单实际应该支付的金额是' + memberOrderInfo.totalPrice, '元');
            logger.error('orderNumber = ', orderNumber, ' 支付宝返回的用户支付的会员订单金额是' + total_fee, '元');
            return false;
        }

        const duplicatedTransaction = await Transaction.getTransactionByPaymentPlatformId(paymentPlatformId);
        if (!_.isEmpty(duplicatedTransaction)) {
            logger.debug('orderNumber = ', orderNumber, 'paymentPlatformId = ', paymentPlatformId, ' 已经插入过事物表了,所以标记为支付成功');
            return true;
        }

        let membershipInfo = await Member.tryGetMembershipById(memberOrderInfo.membershipId);// 会员组
        if (_.isEmpty(membershipInfo)) {
            logger.error('orderNumber = ', orderNumber, ',membershipId = ', memberOrderInfo.membershipId, ' 会员订单查询不到会员组信息');
            return false;
        }

        let memberInfo = await Member.tryGetMemberById(memberOrderInfo.memberId);// 会员详情
        if (_.isEmpty(memberInfo)) {
            logger.error('orderNumber = ', orderNumber, ',memberId = ', memberOrderInfo.memberId, ' 会员订单查询不到会员详情信息');
            return false;
        }

        // 构造事物数据
        const amount             = Big(total_fee);
        const eventdoveNetIncome = Big(memberOrderInfo.eventdoveFee);// 会鸽服务费
        const channelFee         = amount.times(Big(fixParams.CHANNEL_FEE_TYPE.CHANNEL_FEE_TYPE_ALIPAY));// 第三方通道费
        const netIncome          = amount.minus(channelFee).minus(eventdoveNetIncome);// 净收入
        const transaction        = {
            type              : 'MEMBER',
            refId             : memberInfo.id,// 会员信息主键id
            userId            : membershipInfo.userId,// 创建此会员组的用户id
            paymentMethod     : fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
            source            : source,
            destination       : destination,
            orderId           : orderNumber,
            paymentPlatformId : paymentPlatformId,
            amount            : Number(amount),
            eventdoveNetIncome: Number(eventdoveNetIncome),// 会鸽净收入,即收取的服务费
            channelFee        : Number(channelFee),// 协议通道费 = 支付总金额 * 0.01
            netIncome         : Number(netIncome),// 主办方净收入
            currency          : fixParams.CURRENCY_NAME.YUAN,
            rawNotification   : JSON.stringify(result),
            orderDetail       : {
                memberId  : memberInfo.id,
                expireTime: memberInfo.expireTime,
                addDays   : memberOrderInfo.addDays
            }
        };
        const insertTransaction  = await Transaction.addTransaction(transaction);
        if (_.isEmpty(insertTransaction)) {
            logger.error('orderNumber = ', orderNumber, ' 支付宝支付后,插入事物失败了,待插入的数据信息是');
            logger.error(transaction);
            logger.error('orderNumber = ', orderNumber, ' 支付宝支付后,插入事物失败了,支付宝返回的原始信息是');
            logger.error(result);
            return false;
        }

        try {

            // 会员订单后续处理逻辑,更改订单状态payStatus为paid,更改订单支付方式payMethod为alipay,等其他操作
            const updateMemberOrder = {
                payMethod     : fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
                payStatus     : fixParams.ORDER_STATUS.ORDER_STATUS_PAID,
                returnOrderNum: paymentPlatformId,
                paymentTime   : paymentTime,
                channelFee    : channelFee
            };
            Member.updateMemberOrder(memberOrderInfo.id, updateMemberOrder);

            // 更新会员过期时间
            let newExpTime = moment();
            let addDays    = memberOrderInfo.addDays;
            if (newExpTime.isAfter(memberInfo.expireTime)) {
                // 在会员过期时间之后,直接在当前时间上增加对应的天数
                newExpTime.add(addDays, 'days');
            } else {
                // 在会员过期时间之前,直接在会员过期时间上增加对应的天数
                newExpTime = moment(memberInfo.expireTime).add(addDays, 'days');
            }

            const updateMember = {expireTime: newExpTime.toDate()};
            Member.updateMember(memberInfo.id, updateMember);

        } catch (err) {
            logger.error('会员订单后续处理逻辑出错了,信息是 ', err);
        }

        logger.debug('orderNumber = ', orderNumber, ' 的会员订单,支付宝支付成功了!!!');

        // todo 发送相应的通知

        return true;
    } catch (err) {
        logger.error('dealWithMemberOrderByAliPay ', err);
        return false;
    }

};

// 处理门票订单支付宝支付结果异步通知
exports.dealAliPayTicketOrderNotify = async function (req, result) {
    try {

        const orderNumber       = result.out_trade_no;// 商户订单号
        const source            = result.buyer_email;// 订单来源账户
        const destination       = result.seller_email;// 订单目标账户
        const paymentPlatformId = result.trade_no;// 支付平台流水号
        const total_fee         = Number(result.total_fee);// 订单总金额，单位为元

        logger.debug('orderNumber = ', orderNumber, ' 处理门票订单支付宝支付结果异步通知被调用');

        const attributeNames = ['id', 'orderNumber', 'eventId', 'totalPrice', 'serviceFee', 'status', 'currencyType'];
        const orderInfo      = await Order.getOrderByOrderNum(orderNumber, attributeNames);
        if (_.isEmpty(orderInfo)) {
            logger.error('orderNumber = ', orderNumber, ' 门票订单不存在');
            return false;
        }

        const eventInfo = await Event.tryGetEventInfo(orderInfo.eventId, ['userId']);
        if (_.isEmpty(eventInfo)) {
            logger.error('orderNumber = ', orderNumber, ',eventId = ', orderInfo.eventId, ' 门票订单对应的活动详情不存在');
            return false;
        }

        // 检查订单状态,如果为已支付直接返回成功
        if (orderInfo.status === 'paid') {
            logger.debug('orderNumber = ', orderNumber, ' 门票订单已经支付过了');
            return true;
        }

        // 校验返回的订单金额是否与商户侧的订单金额一致
        if ((orderInfo.totalPrice) !== total_fee) {
            logger.error('orderNumber = ', orderNumber, ' 门票订单金额与支付金额不符');
            logger.error('orderNumber = ', orderNumber, ' 门票订单实际应该支付的金额是' + orderInfo.totalPrice, '元');
            logger.error('orderNumber = ', orderNumber, ' 支付宝返回的用户支付的门票订单金额是' + total_fee, '元');
            return false;
        }

        const duplicatedTransaction = await Transaction.getTransactionByPaymentPlatformId(paymentPlatformId);
        if (!_.isEmpty(duplicatedTransaction)) {
            logger.debug('orderNumber = ', orderNumber, 'paymentPlatformId = ', paymentPlatformId, ' 已经插入过事物表了,所以标记为支付成功');
            return true;
        }

        // 构造事物数据
        const amount             = Big(total_fee);// 订单支付总金额单位,元
        const eventdoveNetIncome = Big(orderInfo.serviceFee);// 会鸽净收入
        const channelFee         = amount.times(Big(fixParams.CHANNEL_FEE_TYPE.CHANNEL_FEE_TYPE_ALIPAY));// 支付通道费
        const netIncome          = amount.minus(eventdoveNetIncome).minus(channelFee);// 主办方净收入
        const transaction        = {
            type              : 'TICKET',// 订单类型
            refId             : orderInfo.eventId,// 活动主键id
            userId            : eventInfo.userId,// 活动主办方用户id
            paymentMethod     : fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,// 支付方式
            source            : source,// 订单来源账户
            destination       : destination,// 订单目标账户
            orderId           : orderNumber,// 订单号
            paymentPlatformId : paymentPlatformId,// 支付平台流水号
            amount            : Number(amount),// 支付总额
            eventdoveNetIncome: Number(eventdoveNetIncome),// 会鸽净收入,即收取的服务费
            channelFee        : Number(channelFee),// 协议通道费 = 支付总金额 * 0.01
            netIncome         : Number(netIncome),// 主办方净收入、支出 净收入 = 支付总金额 - eventdoveNetIncome - channelFee
            currency          : orderInfo.currencyType,// 货币单位
            rawNotification   : JSON.stringify(result),// 支付回调原始数据
        };
        const insertTransaction  = await Transaction.addTransaction(transaction);
        if (_.isEmpty(insertTransaction)) {
            logger.error('orderNumber = ', orderNumber, ' 支付宝支付后,插入事物失败了,待插入的数据信息是');
            logger.error(transaction);
            logger.error('orderNumber = ', orderNumber, ' 支付宝支付后,插入事物失败了,支付宝返回的原始信息是');
            logger.error(result);
            return false;
        }

        // 门票订单后续处理逻辑,更改订单状态status为paid,更改订单支付方式paymentMethod为alipay,等其他操作
        const updateTicketOrder = {
            status          : fixParams.ORDER_STATUS.ORDER_STATUS_PAID,// 更改订单状态status为paid
            paymentMethod   : fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,// 更改订单支付方式paymentMethod为alipay
            thirdPartyCharge: Number(channelFee),// 第三方通道费
            attendees       : r.row("attendees").map(
                function (attendeeInfo) {
                    return attendeeInfo.merge({payStatus: 'paid'});
                })
        };
        Order.updateOrderById(orderInfo.id, updateTicketOrder);

        logger.debug('orderNumber = ', orderNumber, ',orderId = ', orderInfo.id, ' 的订单,支付宝支付成功了!!!');

        // 发送通知
        logger.debug('orderNumber = ', orderNumber, " 门票支付宝支付成功，发送邮件相关通知");
        sysNotice.sendNoticeAfterOrderPay(req, orderInfo.id);

        return true;
    } catch (err) {
        logger.error('dealAliPayTicketOrderNotify ', err);
        return false;
    }
};

// 处理短信或者邮件订单支付宝支付结果异步通知
exports.dealAliPaySmsEmailOrderNotify = async function (req, result) {
    try {
        const transactionType   = result.transactionType;// 事务的类型
        const orderNumber       = result.out_trade_no;// 商户订单号
        const source            = result.buyer_email;// 订单来源账户
        const destination       = result.seller_email;// 订单目标账户
        const paymentPlatformId = result.trade_no;// 支付平台流水号
        const total_fee         = Number(result.total_fee);// 订单总金额，单位为元

        logger.debug('orderNumber = ', orderNumber, ' 处理短信或者邮件订单支付宝支付结果异步通知被调用');

        const attributeNames = ['id', 'orderNumber', 'userId', 'totalPrice', 'rechargeNumber', 'type', 'currencyType', 'status'];
        const orderInfo      = await Notice.getSmsEmailOrderByOrderNum(orderNumber, attributeNames);
        if (_.isEmpty(orderInfo)) {
            logger.error('orderNumber = ', orderNumber, ' 短信邮件充值订单不存在');
            return false;
        }

        // 检查订单状态,如果为已支付直接返回成功
        if (orderInfo.status === 'paid') {
            logger.debug('orderNumber = ', orderNumber, ' 短信邮件充值订单已经支付过了');
            return true;
        }

        // 校验返回的订单金额是否与商户侧的订单金额一致
        if ((orderInfo.totalPrice) !== total_fee) {
            logger.error('orderNumber = ', orderNumber, ' 短信邮件充值订单金额与支付金额不符');
            logger.error('orderNumber = ', orderNumber, ' 短信邮件充值订单实际应该支付的金额是' + orderInfo.totalPrice, '元');
            logger.error('orderNumber = ', orderNumber, ' 支付宝返回的用户支付的短信邮件充值订单金额是' + total_fee, '元');
            return false;
        }

        const duplicatedTransaction = await Transaction.getTransactionByPaymentPlatformId(paymentPlatformId);
        if (!_.isEmpty(duplicatedTransaction)) {
            logger.debug('orderNumber = ', orderNumber, ',paymentPlatformId = ', paymentPlatformId, ' 已经插入过事物表了,所以标记为支付成功');
            return true;
        }

        // 构造事物数据
        const amount             = Big(total_fee);// 订单支付总金额单位,元
        const eventdoveNetIncome = amount;// 会鸽净收入
        const channelFee         = 0;// 支付通道费
        const netIncome          = 0;// 主办方净收入
        const transaction        = {
            type              : transactionType,// 订单类型
            refId             : orderInfo.userId,// userId,需要充值的主办方用户id
            userId            : orderInfo.userId,// userId,需要充值的主办方用户id
            paymentMethod     : fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,// 支付方式
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
            logger.error('orderNumber = ', orderNumber, ' 支付宝支付后,插入事物失败了,待插入的数据信息是');
            logger.error(transaction);
            logger.error('orderNumber = ', orderNumber, ' 支付宝支付后,插入事物失败了,支付宝返回的原始信息是');
            logger.error(result);
            return false;
        }

        // 短信邮件订单后续处理逻辑,更改订单状态status为paid,更改订单支付方式paymentMethod为alipay,等其他操作
        const updateOrder = {
            status       : fixParams.ORDER_STATUS.ORDER_STATUS_PAID,// 更改订单状态status为paid
            paymentMethod: fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,// 更改订单支付方式paymentMethod为alipay
        };
        Notice.updateSmsEmailOrderById(orderInfo.id, updateOrder);

        logger.debug('orderNumber = ', orderNumber, ',orderId = ', orderInfo.id, ' 的 transactionType = ', transactionType, ' 短信邮件充值订单,支付宝支付成功了!!!');

        //发送通知
        logger.debug('orderNumber = ', orderNumber, " 支付宝短信邮件充值成功，发送相关通知");
        sysNotice.sendSmsEmailNoticeAfterOrderPay(req, orderInfo.id);

        return true;
    } catch (err) {
        logger.error('dealAliPaySmsEmailOrderNotify ', err);
        return false;
    }
};
