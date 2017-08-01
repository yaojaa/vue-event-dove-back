'use strict';

const _              = require('lodash');
const Promise        = require('bluebird');
const settings       = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const Transaction    = require('../model/transaction');
const Order          = require('../model/order');
const Event          = require('../model/event');
const User           = require('../model/user');
const fixParams      = require('../util/fixParams');
const errorCodes     = require('../util/errorCodes.js').ErrorCodes;
const myutil         = require('../util/util.js');
const Big            = require('big.js');
const sysNotice      = require('../model/admin/sysNotice');


// 交易记录
exports.getTransactionRecordList = async function (req, res, next) {
    var query        = req.query;
    req.query.userId = req.user.id;

    try {

        var attributeNames = [
            "id", "userId", "type", "ctime", "orderId", "refId",
            "source", "amount", "eventdoveNetIncome", "currency"
        ];
        var data           = await Transaction.getTransactionRecordList(req.query, attributeNames);
        var paginate       = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        var transactionTypeList = Transaction.getTransactionTypeList(req);

        for (var transactionInfo of data.items) {

            // 在事物记录中添加事物类型字符串
            var transactionTypeInfo    = _.find(transactionTypeList, {name: transactionInfo.type});
            transactionInfo['typeStr'] = transactionTypeInfo.str;

            // 查询事物关联的订单的相关信息
            var transactionOrder            = await __getTransactionOrderInfo(transactionInfo);
            transactionInfo.transactionName = transactionOrder.transactionName;
            transactionInfo.eventName       = transactionOrder.eventName;

        }

        return res.status(200).send(paginate);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// todo 整理事物相关的订单信息统一化后返给前端
async function __getTransactionOrderInfo(transaction) {

    const transactionOrder = {transactionName: '', eventName: ''};
    const orderNum         = transaction.orderId;// 事物关联的订单号
    const type             = transaction.type;// 事物记录类型

    switch (type) {
        case 'MEMBER':// 会员充值订单
            break;
        case 'TICKET':// 门票订单

            const orderInfo = await Order.tryGetOrderByOrderNum(orderNum, ['buyer', 'eventId']);
            if (!_.isEmpty(orderInfo)) {
                transactionOrder.transactionName = orderInfo.buyer.name;
            }

            const eventInfo = await Event.tryGetEventInfo(transaction.refId, ['title']);
            if (!_.isEmpty(eventInfo)) {
                transactionOrder.eventName = eventInfo.title;
            }

            break;
        case 'SMS_EMAIL':// 短信邮件充值订单
            break;
        case 'UNKNOWN':// 未知类型订单
            break;
        case 'REFUND_TICKET':// 退票费用类型
            break;
        default:
    }

    return transactionOrder;
}

// 可提现金额明细列表
exports.getAvailableCashList = async function (req, res, next) {
    req.query.userId = req.user.id;

    try {

        var data     = await Transaction.getAvailableCashList(req.query);
        var paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        return res.status(200).send(paginate);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// 提现申请接口
exports.submitCashApplication = async function (req, res, next) {
    var body   = req.body;
    var userId = req.user.id;// 提交提现申请的用户id

    // 验证规则数组
    var validArr = [
        {fieldName: 'refId', type: 'string'},
        {fieldName: 'refName', type: 'string'},
        {fieldName: 'transactionType', type: 'string'},
        {fieldName: 'withdrawAmount', type: 'string'},
        {fieldName: 'currency', type: 'string'},
        {fieldName: 'walletId', type: 'string'},
        {fieldName: 'accountId', type: 'string'},
        {fieldName: 'bankAccount', type: 'string'},
        {fieldName: 'accountType', type: 'string'},
        {fieldName: 'transactionRecords', type: 'array'},
        {fieldName: 'password', type: 'string'}
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        if (!(await User.checkWalletPwd(userId, body.password))) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("wrong_password")
            });
        }

        var insertWithdrawData    = await __dealCashApplyData(req, res, next);
        var insertTransactionData = await __dealTransactionData(insertWithdrawData);
        var withdrawalInfo        = await Transaction.getWithdrawalByHash(insertWithdrawData.hash, ['id']);

        if (!_.isEmpty(withdrawalInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("already_apply_cashed", insertWithdrawData.refName)
            });
        }

        var result = await Transaction.addTransaction(insertTransactionData);

        //发送提现申请通知
        const userInfo     = await User.getUserById(userId, ['id', 'phone']);
        const functionType = fixParams.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
        sysNotice.sendNotice(req, functionType, 'transaction_type_WITHDRAWALS', 'sms', {}, userInfo);

        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }

};

// 处理待插入事物表的记录
async function __dealTransactionData(insertWithdrawData) {
    try {

        var withdrawAmount = Big(insertWithdrawData.withdrawAmount);
        var netIncome      = Number(withdrawAmount.round(2));

        var transaction = {
            type       : 'WITHDRAWALS',// 提现类型
            refId      : insertWithdrawData.refId,// 引用的类型id
            userId     : insertWithdrawData.operateUserId,// 此次操作的用户id
            orderId    : insertWithdrawData.withdrawNo,// 订单号
            netIncome  : -netIncome,
            amount     : -netIncome,
            currency   : insertWithdrawData.currency,// 货币单位
            orderDetail: insertWithdrawData,
        };

        return transaction;
    } catch (err) {
        throw err;
    }
}

// 处理提现申请数据
async function __dealCashApplyData(req, res, next) {
    var body   = req.body;
    var userId = req.user.id;// 提交提现申请的用户id

    try {

        if (_.isEmpty(userId)) {
            throw new Error(req.__("Empty", 'userId'));
        }

        if (_.isEmpty(body.transactionType)) {
            throw new Error(req.__("Empty", 'transactionType'));
        }

        if (_.isEmpty(body.refId)) {
            throw new Error(req.__("Empty", 'refId'));
        }

        if (_.isEmpty(body.refName)) {
            throw new Error(req.__("Empty", 'refName'));
        }

        if (_.isEmpty(body.withdrawAmount)) {
            throw new Error(req.__("Empty", 'withdrawAmount'));
        }

        if (_.isEmpty(body.currency)) {
            throw new Error(req.__("Empty", 'currency'));
        }

        if (_.isEmpty(body.walletId)) {
            throw new Error(req.__("Empty", 'walletId'));
        }

        if (_.isEmpty(body.accountId)) {
            throw new Error(req.__("Empty", 'accountId'));
        }

        if (_.isEmpty(body.bankAccount)) {
            throw new Error(req.__("Empty", 'bankAccount'));
        }

        if (_.isEmpty(body.accountType)) {
            throw new Error(req.__("Empty", 'accountType'));
        }

        if (_.isEmpty(body.transactionRecords)) {
            throw new Error(req.__("Empty", 'transactionRecords'));
        }

        var insertWithdrawData = {
            withdrawNo        : myutil.getOrderNum('TX'),
            withdrawType      : body.transactionType,
            refId             : body.refId,
            refName           : body.refName,
            withdrawAmount    : body.withdrawAmount,
            currency          : body.currency,
            walletId          : body.walletId,
            accountId         : body.accountId,
            bankAccount       : body.bankAccount,
            accountType       : body.accountType,
            operateUserId     : userId,
            transactionRecords: body.transactionRecords,
            hash              : body.transactionRecords.join(),
        };

        return insertWithdrawData;
    } catch (err) {
        throw err;
    }
}

// 提现记录
exports.getWithdrawList = async function (req, res, next) {
    var query        = req.query;
    req.query.userId = req.user.id;

    try {

        var attributeNames = [
            "id", "withdrawNo", "ctime", "withdrawType", "refName",
            "withdrawAmount", "currency", "bankAccount", "accountType",
            "status", "note", "transactionRecords",
        ];
        var data           = await Transaction.getWithdrawList(req.query, attributeNames);
        var paginate       = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        return res.status(200).send(paginate);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};
