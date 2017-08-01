'use strict';

const myutil         = require('../util/util');
const nextId         = myutil.nextId;
const thinky         = require('../util/thinky');
const type           = thinky.type;
const r              = thinky.r;
const fixParams      = require('../util/fixParams');
const _              = require('lodash');
const moment         = require('moment');
const Promise        = require('bluebird');
const Big            = require('big.js');
const Event          = require('../model/event');
const assert         = require('assert');
const settings       = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const Wallet         = require('./wallet');
const DailyBalance   = require('./dailyBalance.js');

const TransactionFields = {
    id                : type.string(),
    type              : type.string().enum(
        fixParams.ORDER_TYPE.ORDER_TYPE_MEMBER,
        fixParams.ORDER_TYPE.ORDER_TYPE_TICKET,
        fixParams.ORDER_TYPE.ORDER_TYPE_SMS,
        fixParams.ORDER_TYPE.ORDER_TYPE_EMAIL,
        fixParams.ORDER_TYPE.ORDER_TYPE_UNKNOWN,
        fixParams.ORDER_TYPE.ORDER_TYPE_REFUND_TICKET,
        fixParams.ORDER_TYPE.ORDER_TYPE_WITHDRAWALS,
        fixParams.ORDER_TYPE.ORDER_TYPE_SEND_SMS,        // 短信扣费类型
        fixParams.ORDER_TYPE.ORDER_TYPE_SEND_EMAIL,       // 邮件扣费类型
        fixParams.ORDER_TYPE.ORDER_TYPE_EVENT_SEND_EMAIL  // 活动邮件扣费类型
    ),// 事物记录的类型
    refId             : type.string(),// 关联的活动id,或者会员组id,或者其他id,为了聚合数据做准备
    userId            : type.string(),// 活动主办方用户id
    paymentMethod     : type.string().enum(
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WALLET
    ),
    source            : type.string(),// 订单来源账户
    destination       : type.string(),// 订单目标账户
    orderId           : type.string(),// 订单号
    paymentPlatformId : type.string(),// 支付平台流水号
    amount            : type.number(),// 支付的总金额
    eventdoveNetIncome: type.number(),// 会鸽净收入的服务费金额
    channelFee        : type.number(),// 协议通道费 = amount * 0.006
    netIncome         : type.number(),// 主办方净收入、支出 净收入 = amount - eventdoveNetIncome - channelFee,如果是退票或者提现,此金额记为负数
    currency          : type.string()
                            .enum(
                                fixParams.CURRENCY_NAME.YUAN, fixParams.CURRENCY_NAME.DOLLAR, fixParams.CURRENCY_NAME.TIAO
                            ),// 币种单位

    rawNotification: type.string(),// 支付回调的原始数据或者存储相关事物信息的json串
    orderDetail    : {},// 存储的订单相关的信息
    audited        : type.boolean().default(false),// 该条记录是否已经审计过,并将收款金额计算到钱包余额中了
    isHistory      : type.boolean().default(false),  // 该条记录是否历史数据
    timestamp      : type.number(),// 时间戳
    cTime          : type.date().default(function () { return new Date();}),// 记录创建时间
    uTime          : type.date().default(function () { return new Date();})// 记录更新时间
};

const TRANSACTION_TABLE = 'Transaction';
const Transaction       = thinky.createModel(TRANSACTION_TABLE, TransactionFields);
Transaction.ensureIndex('cTime');
Transaction.ensureIndex('type');
Transaction.ensureIndex('userId');
Transaction.ensureIndex('orderId');
Transaction.ensureIndex('paymentPlatformId');
Transaction.ensureIndex('currency');

// 提现记录表
const WithdrawFields = {
    id        : type.string(),
    withdrawNo: type.string(),// 提现流水号
    hash      : type.string(),// 本次提现的唯一标识是由transactionRecords.join()生成的

    withdrawType: type.string().enum(
        fixParams.ORDER_TYPE.ORDER_TYPE_MEMBER,
        fixParams.ORDER_TYPE.ORDER_TYPE_TICKET
    ),// 提现类型

    refId         : type.string(),// 提现金额来源id
    refName       : type.string(),// 提现金额来源
    withdrawAmount: type.number(),// 提现金额
    currency      : type.string(),// 币种单位
    walletId      : type.string(),// 提现的钱包主键id
    accountId     : type.string(),// 提现的银行卡主键id
    bankAccount   : type.string(),// 提现的银行卡帐号
    accountType   : type.string().enum(
        fixParams.WITHDRAW_ACCOUNT_TYPE.WITHDRAW_ACCOUNT_TYPE_PERSONAL,
        fixParams.WITHDRAW_ACCOUNT_TYPE.WITHDRAW_ACCOUNT_TYPE_BUSINESS
    ),// 提现的银行卡类型,对私,对公

    status: type.string().enum(
        fixParams.WITHDRAW_STATUS.WITHDRAW_STATUS_SUBMIT_APPLICATION,
        fixParams.WITHDRAW_STATUS.WITHDRAW_STATUS_SUCCESS,
        fixParams.WITHDRAW_STATUS.WITHDRAW_STATUS_FAIL
    ).default(
        fixParams.WITHDRAW_STATUS.WITHDRAW_STATUS_SUBMIT_APPLICATION
    ),// 提现的状态,提交申请,提现成功,提现失败

    note              : type.string(),// 备注,提现失败原因等
    operateUserId     : type.string(),// 提交此次提现申请的用户主键id
    adminUserId       : type.string(),// 执行提现操作的会鸽系统管理员用户主键id
    transactionRecords: [],// 此次提现包含的事物记录主键id
    audited           : type.boolean().default(false),// 该条记录是否已经审计过,并将提现金额计算到钱包余额中了
    timestamp         : type.number(),// 时间戳
    cTime             : type.date().default(function () { return new Date();}),// 记录创建时间
    uTime             : type.date().default(function () { return new Date();})// 记录更新时间
};

const WITHDRAW_TABLE = 'Withdraw';
const Withdraw       = thinky.createModel(WITHDRAW_TABLE, WithdrawFields);
Withdraw.ensureIndex('withdrawNo');
Withdraw.ensureIndex('hash');

exports.addTransaction = function (transaction) {
    transaction.id        = nextId();
    transaction.timestamp = r.now().toEpochTime();
    return Transaction.save(transaction);
};

exports.updateTransactionByIds = function (transactionIds, update, options) {
    update.uTime = new Date();
    return Transaction
        .filter(
            function (record) {
                return r.expr(transactionIds)
                        .contains(record("id"));
            }
        ).update(update).run();
};

exports.getTransactionById = function (id) {
    return r.table(TRANSACTION_TABLE).get(id);
};

exports.getTransactionByOrderId = async function (orderId, attributeNames) {
    try {
        attributeNames           = _.isEmpty(attributeNames) ? _.keys(TransactionFields) : attributeNames;
        const transactionInfoArr = await r.table(TRANSACTION_TABLE).getAll(orderId, {index: "orderId"}).pluck(attributeNames);
        return transactionInfoArr[0];
    } catch (err) {
        return {};
    }
};

exports.getTransactionRecordList = function (params, attributeNames) {
    attributeNames        = _.isEmpty(attributeNames) ? _.keys(TransactionFields) : attributeNames;
    var transactionFilter = __buildTransactionFilter(params);
    var totalCount        = parseInt(params.total) || -1;// 总记录数
    var page              = parseInt(params.page) || 1;// 第几页
    var limit             = parseInt(params.limit) || 10;// 每页显示记录数
    var skip              = ( page - 1 ) * limit;
    var orderBy           = params.orderBy || "cTime";

    var items = transactionFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit).pluck(attributeNames).run();

    if (totalCount === -1) {
        totalCount = transactionFilter.count().execute();
    }

    return Promise.props({items: items, count: totalCount});
};

// 拼装搜索条件
function __buildTransactionFilter(params) {
    var userId            = params.userId;
    var orderNumber       = params.orderNumber;// 根据订单号查
    var startDate         = params.startDate;
    var endDate           = params.endDate;
    var transactionFilter = Transaction;

    // 目前交易记录只保留以下几种
    const typeArr     = ['REFUND_TICKET', 'TICKET'];
    transactionFilter = transactionFilter.filter(function (doc) { return r.expr(typeArr).contains(doc("type")) });

    if ((!_.isUndefined(userId)) && (!_.isEmpty(userId))) {
        transactionFilter = transactionFilter.filter({userId: userId});
    }

    if ((!_.isUndefined(orderNumber)) && (!_.isEmpty(orderNumber))) {
        transactionFilter = transactionFilter.filter({orderId: orderNumber});
    }

    if (startDate && endDate) {
        var startDate  = moment(startDate);
        var endDate    = moment(endDate);
        var startYear  = Number(startDate.format('YYYY'));
        var startMonth = Number(startDate.format('MM'));
        var startDay   = Number(startDate.format('DD'));
        var endYear    = Number(endDate.format('YYYY'));
        var endMonth   = Number(endDate.format('MM'));
        var endDay     = Number(endDate.format('DD'));

        var startRTime = r.time(startYear, startMonth, startDay, 'Z');
        var endRTime   = r.time(endYear, endMonth, endDay, 23, 59, 59, 'Z');

        transactionFilter = transactionFilter.filter(
            r.row('cTime').during(startRTime, endRTime, {leftBound: "open", rightBound: "open"})
        );
    }

    return transactionFilter;
}

// 获取事物记录类型
exports.getTransactionTypeList = function (req) {
    var transactionTypes    = _.values(fixParams.ORDER_TYPE);
    var transactionTypeList = [];
    _.each(transactionTypes, function (transactionType) {
        var i18nKey = "transaction_type_" + transactionType;
        transactionTypeList.push({name: transactionType, str: req.__(i18nKey)})
    });
    return transactionTypeList;
};

exports.getTransactionByPaymentPlatformId = function (paymentPlatformId) {
    return r.table(TRANSACTION_TABLE).getAll(paymentPlatformId, {index: 'paymentPlatformId'});
};

// 拼装可提现金额明细列表搜索条件
function __buildAvailableCashList(params) {
    var userId            = params.userId;
    var transactionFilter = Transaction;

    if (!_.isUndefined(userId)) {
        transactionFilter = transactionFilter.filter({userId: userId});
    }

    return transactionFilter;
}

exports.getAvailableCashList = async function (params) {
    var transactionFilter = __buildAvailableCashList(params);
    var totalCount        = parseInt(params.total) || -1;// 总记录数
    var page              = parseInt(params.page) || 1;// 第几页
    var limit             = parseInt(params.limit) || 10;// 每页显示记录数
    var skip              = ( page - 1 ) * limit;

    var allItems = await transactionFilter.group('refId').run();
    allItems     = await __makeCashItemsList(allItems);
    var items    = allItems.slice(skip, skip + limit);

    if (totalCount === -1) {
        totalCount = allItems.length;
    }

    return Promise.props({items: items, count: totalCount});
};

// todo 获取事物关联的活动或者群组等信息
async function __getRefInfo(cashInfo) {

    var type    = cashInfo.transactionType;// 事物记录类型
    var refId   = cashInfo.group;// 关联的id
    var refInfo = {refName: ''};

    switch (type) {
        case 'MEMBER':// 会员充值订单
            break;
        case 'TICKET':// 门票订单

            const eventInfo = await Event.tryGetEventInfo(refId, ['title', 'status', 'startTime', 'endTime']);
            if (!_.isEmpty(eventInfo)) {
                refInfo.refName        = eventInfo.title;
                refInfo.eventStatus    = eventInfo.status;
                refInfo.eventStartTime = eventInfo.startTime;
                refInfo.eventEndTime   = eventInfo.endTime;
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

    return refInfo;
}

// 处理可提现金额明细列表的数据
async function __makeCashItemsList(items) {

    for (let cashInfo of items) {

        // 组装可提现明细金额列表的数据

        for (let transactionRecord of cashInfo.reduction) {

            if (myutil.inArray(transactionRecord.type, ['MEMBER', 'TICKET'])) {

                cashInfo.transactionType      = transactionRecord.type;// 事物的组类型
                cashInfo.currency             = transactionRecord.currency;// 货币
                cashInfo.paymentPriceUnitSign = Event.getPaymentPriceUnitSign(cashInfo.currency);// 货币标识符
                break;
            }

        }

        // 根据transactionType和group获取对应的提现组名称
        const refInfo           = await __getRefInfo(cashInfo);
        cashInfo.refName        = refInfo.refName;
        cashInfo.refId          = cashInfo.group;
        cashInfo.eventStatus    = _.isUndefined(refInfo.eventStatus) ? 'unknown' : refInfo.eventStatus;
        cashInfo.eventStartTime = _.isUndefined(refInfo.eventStartTime) ? 'unknown' : refInfo.eventStartTime;
        cashInfo.eventEndTime   = _.isUndefined(refInfo.eventEndTime) ? 'unknown' : refInfo.eventEndTime;

        cashInfo.transactionRecords = [];
        _.each(cashInfo.reduction, function (transactionRecord) {

            if (myutil.inArray(transactionRecord.type, ['MEMBER', 'TICKET'])) {

                return cashInfo.transactionRecords.push(transactionRecord.id);

            }

        }, 0);

        // 线上收款总额
        cashInfo.eventTotalAmount = _.reduce(cashInfo.reduction, function (sum, transactionRecord) {

            if (myutil.inArray(transactionRecord.type, ['MEMBER', 'TICKET'])) {

                return Big(sum).plus(Big(transactionRecord.amount));

            }
            return Big(sum);

        }, 0);
        cashInfo.eventTotalAmount = cashInfo.eventTotalAmount.round(2);

        // 系统手续费
        cashInfo.sysTotalAmount = _.reduce(cashInfo.reduction, function (sum, transactionRecord) {

            if (myutil.inArray(transactionRecord.type, ['MEMBER', 'TICKET'])) {

                return Big(sum).plus(Big(transactionRecord.channelFee)).plus(Big(transactionRecord.eventdoveNetIncome));

            }
            return Big(sum);

        }, 0);
        cashInfo.sysTotalAmount = cashInfo.sysTotalAmount.round(2);

        // 可提现金额
        cashInfo.availableCashTotalAmount = _.reduce(cashInfo.reduction, function (sum, transactionRecord) {

            if (myutil.inArray(transactionRecord.type, ['MEMBER', 'TICKET'])) {

                return Big(sum).plus(Big(transactionRecord.netIncome));

            }
            return Big(sum);

        }, 0);
        cashInfo.availableCashTotalAmount = cashInfo.availableCashTotalAmount.round(2);

        // 已提现金额
        cashInfo.alreadyCashTotalAmount = _.reduce(cashInfo.reduction, function (sum, transactionRecord) {

            if (myutil.inArray(transactionRecord.type, ['WITHDRAWALS'])) {

                return Big(sum).plus(Big(transactionRecord.netIncome));

            }
            return Big(sum);

        }, 0);
        cashInfo.alreadyCashTotalAmount = cashInfo.alreadyCashTotalAmount.round(2);

        _.unset(cashInfo, 'reduction');

    }

    // 移除可提现金额为0的记录
    _.remove(items, function (item) { return item.availableCashTotalAmount == '0'; });

    return items;
}

exports.addWithdraw = function (withdraw) {
    withdraw.id        = nextId();
    withdraw.timestamp = r.now().toEpochTime();
    return Withdraw.save(withdraw);
};

/**
 * 根据提现记录流水号查询提现记录
 * @param withdrawNo         提现流水号
 * @param attributeNames     需要返回的属性名数组
 * @param options
 */
exports.getWithdrawByNo = async function (withdrawNo, attributeNames, options) {
    assert(!_.isArray(attributeNames) || !_.isEmpty(attributeNames));
    var resultArr = await r.table(WITHDRAW_TABLE).getAll(withdrawNo, {index: "withdrawNo"}).pluck(attributeNames).run();
    return resultArr[0];
};

// 通过hash获取提现记录
exports.getWithdrawalByHash = async function (hash, attributeNames, options) {
    assert(!_.isArray(attributeNames) || !_.isEmpty(attributeNames));
    var resultArr = await r.table(WITHDRAW_TABLE).getAll(hash, {index: "hash"}).pluck(attributeNames).run();
    return resultArr[0];
};

exports.getWithdrawList = function (params, attributeNames) {
    attributeNames     = _.isEmpty(attributeNames) ? _.keys(WithdrawFields) : attributeNames;
    var withdrawFilter = __buildWithdrawFilter(params);
    var totalCount     = parseInt(params.total) || -1;// 总记录数
    var page           = parseInt(params.page) || 1;// 第几页
    var limit          = parseInt(params.limit) || 10;// 每页显示记录数
    var skip           = ( page - 1 ) * limit;
    var orderBy        = params.orderBy || "cTime";

    var items = withdrawFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit).pluck(attributeNames).run();

    if (totalCount === -1) {
        totalCount = withdrawFilter.count().execute();
    }

    return Promise.props({items: items, count: totalCount});
};

// 拼装搜索条件
function __buildWithdrawFilter(params) {
    var userId         = params.userId;
    var withdrawNo     = params.withdrawNo;// 根据提现流水号
    var startDate      = params.startDate;
    var endDate        = params.endDate;
    var withdrawFilter = Withdraw;
    var withdrawType   = params.withdrawType;
    var status         = params.status;

    if (!_.isEmpty(userId)) {
        withdrawFilter = withdrawFilter.filter({userId: userId});
    }
    if (!_.isEmpty(withdrawNo)) {
        withdrawFilter = withdrawFilter.filter({withdrawNo: withdrawNo});
    }
    if (!_.isEmpty(withdrawType)) {
        withdrawFilter = withdrawFilter.filter({withdrawType: withdrawType});
    }
    if (!_.isEmpty(status)) {
        withdrawFilter = withdrawFilter.filter({status: status});
    }
    if (startDate && endDate) {
        var startDate  = moment(startDate);
        var endDate    = moment(endDate);
        var startYear  = Number(startDate.format('YYYY'));
        var startMonth = Number(startDate.format('MM'));
        var startDay   = Number(startDate.format('DD'));
        var endYear    = Number(endDate.format('YYYY'));
        var endMonth   = Number(endDate.format('MM'));
        var endDay     = Number(endDate.format('DD'));

        var startRTime = r.time(startYear, startMonth, startDay, 'Z');
        var endRTime   = r.time(endYear, endMonth, endDay, 'Z');

        withdrawFilter = withdrawFilter.filter(
            r.row('cTime').during(startRTime, endRTime, {leftBound: "open", rightBound: "open"})
        );
    }

    return withdrawFilter;
}

// 根据withdrawID修改审核状态
exports.updateWithdrawStatus = function (withdrawId, status) {
    const standard = [
        fixParams.WITHDRAW_STATUS.WITHDRAW_STATUS_SUBMIT_APPLICATION,
        fixParams.WITHDRAW_STATUS.WITHDRAW_STATUS_SUCCESS,
        fixParams.WITHDRAW_STATUS.WITHDRAW_STATUS_FAIL
    ];
    let uTime      = new Date();
    if (standard.indexOf(status) === -1)
        throw Error('status undefined');
    return Withdraw.get(withdrawId).update({status: status, uTime: uTime, 'audited': true}).run();
};

// 支付通道费用
exports.getChannelRevenue = function (eventId) {

    // 线上收款总额计算的类型
    const typeArr = ['TICKET'];

    return r.table("Transaction")
            .filter({"refId": eventId})
            .filter(function (doc) { return r.expr(typeArr).contains(doc("type")) })
            .sum('channelFee');
};

// 系统服务费
exports.getSystemRevenue = function (eventId) {

    // 线上收款总额计算的类型
    const typeArr = ['TICKET'];

    return r.table("Transaction")
            .filter({"refId": eventId})
            .filter(function (doc) { return r.expr(typeArr).contains(doc("type")) })
            .sum('eventdoveNetIncome');
};

// 可提现总额
exports.getAvailableCash = function (eventId) {

    // 线上收款总额计算的类型
    const typeArr = ['TICKET'];

    return r.table("Transaction")
            .filter({"refId": eventId})
            .filter(function (doc) { return r.expr(typeArr).contains(doc("type")) })
            .sum('netIncome');
};

// 净收入总额
exports.getNetIncome = function (eventId) {

    // 线上收款总额计算的类型
    const typeArr = ['TICKET'];

    return r.table("Transaction")
            .filter({"refId": eventId})
            .filter(function (doc) { return r.expr(typeArr).contains(doc("type")) })
            .sum('netIncome');
};

// this funtion return the sum value with the same (userId,type,currency)
async function __getSumOfDay(userId, transactionType, currency, year, month, day) {
    let dayBalance = 0;

    try {
        dayBalance = await r.table('Transaction')
                            .between(
                                r.time(year, month, day, "Z"),
                                r.time(year, month, day + 1, "Z"),
                                {index: "cTime"}
                            )
                            .filter(
                                {"type": transactionType, "currency": currency, "userId": userId}
                            )
                            .sum("amount");

        const reSql = r.table('Transaction').between(r.time(year, month, day, "Z"), r.time(year, month, day + 1, "Z"), {index: "cTime"}).filter({
            "type": transactionType, "currency": currency, "userId": userId
        }).sum("amount").toString();

        logger.debug('dayBalance = ', dayBalance, ' __getSumOfDay.reSql = ', reSql);

    } catch (err) {
        logger.error('__getSumOfDay ', err);
        dayBalance = 0;
    }

    return dayBalance;
}

// 添加到体现记录表
async function __auditWithdraw(transactionInfo) {
    try {

        // 先查询是否已经插入过
        const withdrawInfo = await exports.getWithdrawByNo(transactionInfo.orderId, ['id']);
        if (_.isEmpty(withdrawInfo)) {
            // 插入到提现记录表中
            await exports.addWithdraw(transactionInfo.orderDetail);
        }

    } catch (err) {
        logger.error('__auditWithdraw ', err);
    }
}

// 修改活动中的邮件额度
async function __auditEventBalance(transactionInfo) {
    try {
        // 扣除或退回活动中邮件发送数量 备: amount 正: 退款、负: 扣费
        await r.table("Event").get(transactionInfo.refId)
               .update(
                   {emailBalance: r.row("emailBalance").add(transactionInfo.amount).default(0)}
               ).run();
    } catch (err) {
        logger.error('__auditEventBalance ', err);
    }
}

// 短信充值订单,邮件充值订单
async function __auditSmsEmailRecharge(transactionInfo) {
    try {

        const currency        = transactionInfo.currency;
        const transactionType = transactionInfo.type;
        const currentDay      = new Date(transactionInfo.cTime);
        const year            = currentDay.getFullYear();
        const month           = currentDay.getMonth() + 1; // in RelQ the range is 1-12, but in JS it's 1-11
        const day             = currentDay.getDate();  // range 1-31 in both RelQ and JS
        const dayBalance      = await __getSumOfDay(transactionInfo.userId, transactionType, currency, year, month, day);

        let rechargeCount = 0;

        if (transactionType === 'SMS') {
            rechargeCount = dayBalance / fixParams.SMS_EMAIL_PRICE.SMS_PRICE;
        }

        if (transactionType === 'EMAIL') {
            rechargeCount = dayBalance / fixParams.SMS_EMAIL_PRICE.EMAIL_PRICE;
        }

        if (rechargeCount === 0) {return;}

        await DailyBalance.updateBalance4SmsEmailRecharge(transactionInfo, year, month, day, rechargeCount);

        const balance = await DailyBalance.getBalance(transactionInfo);

        await Wallet.updateWalletBalance(transactionInfo, balance);

    } catch (err) {
        logger.error('__auditSmsEmailRecharge ', err);
    }
}

async function __auditManyTran(transactionInfo) {
    try {

        const transactionType = transactionInfo.type;
        const currency        = transactionInfo.currency;
        const currentDay      = new Date(transactionInfo.cTime);
        const year            = currentDay.getFullYear();
        const month           = currentDay.getMonth() + 1; // in RelQ the range is 1-12, but in JS it's 1-11
        const day             = currentDay.getDate();  // range 1-31 in both RelQ and JS

        // 每个用户每天每种事务类型的金额总和
        const dayBalance = await __getSumOfDay(transactionInfo.userId, transactionType, currency, year, month, day);

        // update the daily balance
        await DailyBalance.updateBalance(transactionInfo, year, month, day, dayBalance);

        const balance = await DailyBalance.getBalance(transactionInfo);

        // update the balance
        await Wallet.updateWalletBalance(transactionInfo, balance);

    } catch (err) {
        logger.error('__auditManyTran ', err);
    }
}

exports.auditTransaction = async function (transactionInfo) {

    logger.debug('正在处理 transactionId = ' + transactionInfo.id + ' 的 transactionType=' + transactionInfo.type + ' 的事务记录...');

    try {

        const transactionType = transactionInfo.type;

        // 添加提现记录
        if (myutil.inArray(transactionType, ['WITHDRAWALS'])) {
            await __auditWithdraw(transactionInfo);
        }

        // 直接增减活动邮件额度
        if (myutil.inArray(transactionType, ['EVENT_SEND_EMAIL'])) {
            await __auditEventBalance(transactionInfo);
        }

        // 短信充值订单,邮件充值订单
        if (myutil.inArray(transactionType, ['SMS', 'EMAIL'])) {
            await __auditSmsEmailRecharge(transactionInfo);
        }

        // 提现,会员订单,门票订单,退票,短信邮件扣减
        if (myutil.inArray(transactionType, ['WITHDRAWALS', 'MEMBER', 'TICKET', 'REFUND_TICKET', 'SEND_SMS', 'SEND_EMAIL'])) {
            await __auditManyTran(transactionInfo);
        }

        await r.table(TRANSACTION_TABLE).get(transactionInfo.id).update({audited: true}).run();

    } catch (err) {
        logger.error(err);
        logger.error('处理 transactionId = ' + transactionInfo.id + '时出错了,报错信息是:' + err.message);
    }

};

