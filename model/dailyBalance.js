'use strict';

const _              = require('lodash');
const myutil         = require('../util/util');
const thinky         = require('../util/thinky.js');
const r              = thinky.r;
const type           = thinky.type;
const settings       = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const fixParams      = require('../util/fixParams.js');

const DailyBalanceFields = {
    id           : type.date(),
    userId       : type.string().required(),
    balanceRMB   : type.number().default(0),
    balanceDollar: type.number().default(0),
    balanceEmail : type.number().default(0),
    balanceSMS   : type.number().default(0),
    cTime        : type.date().default(function () {return new Date();}),// 创建时间
    uTime        : type.date().default(function () {return new Date();}),// 修改时间
};

const DailyBalanceModelName = "DailyBalance";
const DailyBalance          = thinky.createModel(DailyBalanceModelName, DailyBalanceFields);
DailyBalance.ensureIndex('userId');

exports.DailyBalanceFields = DailyBalanceFields;

exports.updateBalance4SmsEmailRecharge = function (transactionInfo, year, month, day, balance) {
    try {

        let dayBalance        = {};
        const userId          = transactionInfo.userId;
        const transactionType = transactionInfo.type;


        if (transactionType === 'SMS') {
            _.merge(dayBalance, {balanceSMS: balance});
        }

        if (transactionType === 'EMAIL') {
            _.merge(dayBalance, {balanceEmail: balance});
        }

        if (_.isEmpty(dayBalance)) { return; }

        _.merge(dayBalance, {id: r.time(year, month, day, "Z"), userId: userId});

        return r.table(DailyBalanceModelName).insert(dayBalance, {conflict: "update"});

    } catch (err) {
        logger.error('updateBalance4SmsEmailRecharge ', err);
    }
};

// update the daily balance
exports.updateBalance = function (transactionInfo, year, month, day, balance) {
    try {

        let dayBalance        = {};
        const userId          = transactionInfo.userId;
        const transactionType = transactionInfo.type;

        if (myutil.inArray(transactionType, ['WITHDRAWALS', 'MEMBER', 'TICKET', 'REFUND_TICKET'])) {

            const currency = transactionInfo.currency;

            if (fixParams.CURRENCY_NAME.YUAN === currency) {
                _.merge(dayBalance, {balanceRMB: balance});
            }

            if (fixParams.CURRENCY_NAME.DOLLAR === currency) {
                _.merge(dayBalance, {balanceDollar: balance});
            }

        } else if (myutil.inArray(transactionType, ['SEND_SMS'])) {
            _.merge(dayBalance, {balanceSMS: balance});
        } else if (myutil.inArray(transactionType, ['SEND_EMAIL'])) {
            _.merge(dayBalance, {balanceEmail: balance});
        } else {
            return;
        }

        if (_.isEmpty(dayBalance)) {
            return;
        }

        _.merge(dayBalance, {id: r.time(year, month, day, "Z"), userId: userId});

        return r.table(DailyBalanceModelName).insert(dayBalance, {conflict: "update"});
    } catch (err) {
        logger.error('updateBalance ', err);
    }
};

exports.getBalance = async function (transactionInfo) {
    let balance = 0;

    try {

        const userId          = transactionInfo.userId;
        const transactionType = transactionInfo.type;

        if (myutil.inArray(transactionType, ['WITHDRAWALS', 'MEMBER', 'TICKET', 'REFUND_TICKET'])) {

            const currency = transactionInfo.currency;

            if (fixParams.CURRENCY_NAME.YUAN === currency) {
                balance = await r.table(DailyBalanceModelName).getAll(userId, {index: "userId"}).sum("balanceRMB");
            }

            if (fixParams.CURRENCY_NAME.DOLLAR === currency) {
                balance = await r.table(DailyBalanceModelName).getAll(userId, {index: "userId"}).sum("balanceDollar");
            }

        } else if (myutil.inArray(transactionType, ['SMS', 'SEND_SMS'])) {
            balance = await r.table(DailyBalanceModelName).getAll(userId, {index: "userId"}).sum("balanceSMS");
        } else if (myutil.inArray(transactionType, ['EMAIL', 'SEND_EMAIL'])) {
            balance = await r.table(DailyBalanceModelName).getAll(userId, {index: "userId"}).sum("balanceEmail");
        } else {
            balance = 0;
        }

    } catch (err) {
        logger.error('getBalance ', err);
        balance = 0;
    }

    return balance;
};

