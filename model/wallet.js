'use strict';

var _                = require('lodash');
var thinky           = require('../util/thinky.js');
var r                = thinky.r;
var type             = thinky.type;
var myutil           = require('../util/util.js');
var nextId           = myutil.nextId;
const settings       = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
var Promise          = require('bluebird');
var fixParams        = require('../util/fixParams.js');

var WalletFields = {
    id    : type.string(),
    cTime : type.date().default(function () {return new Date();}),// 创建时间
    userId: type.string().required(),

    balanceEmail: type.number().default(0),     //邮件条数
    balanceSMS  : type.number().default(0),     //短信条数

    balanceRMB   : type.number().default(0),
    balanceDollar: type.number().default(0),

    personalAccount      : [{
        accountId    : type.string(),
        ownerName    : type.string(),
        ownerIdNumber: type.string(),
        bankName     : type.string(),
        bankAccount  : type.string(),
        bankProvince : type.string(),
        bankCity     : type.string(),
        bankBranch   : type.string(),
        status       : type.string().enum("normal", "deleted"),// 账户状态
        uTime        : type.date().default(function () {return new Date();}),// 修改时间
        cTime        : type.date().default(function () {return new Date();}),// 创建时间
    }],
    businessAccount      : [{
        accountId         : type.string(),
        companyName       : type.string(),
        representativeName: type.string(),
        representativeId  : type.string(),
        contact           : type.string(),
        licenseImageUrl   : type.string(),

        bankName    : type.string(),
        bankProvince: type.string(),
        bankCity    : type.string(),
        bankBranch  : type.string(),
        bankAccount : type.string(),

        auditStatus: type.string().enum(
            fixParams.BUSINESS_ACCOUNT_AUDIT_STATUS.BUSINESS_ACCOUNT_AUDIT_STATUS_AUDITING,
            fixParams.BUSINESS_ACCOUNT_AUDIT_STATUS.BUSINESS_ACCOUNT_AUDIT_STATUS_AUDIT_FAILURE,
            fixParams.BUSINESS_ACCOUNT_AUDIT_STATUS.BUSINESS_ACCOUNT_AUDIT_STATUS_AUDIT_THROUGH
        ),// 企业银行账户审核状态
        auditNotes : type.string(),
        status     : type.string().enum("normal", "deleted"),// 账户状态
        uTime      : type.date().default(function () {return new Date();}),// 修改时间
        cTime      : type.date().default(function () {return new Date();}),// 创建时间
    }],
    paypalAccount        : [{
        accountId: type.string(),
        account  : type.string(),
        status   : type.string().enum("normal", "deleted"),// 账户状态
        uTime    : type.date().default(function () {return new Date();}),// 修改时间
        cTime    : type.date().default(function () {return new Date();}),// 创建时间
    }],
    unAuditedTransactions: [],
    uTime                : type.date().default(function () {return new Date();}),// 修改时间
};

const WalletModel = "Wallet";
const Wallet      = thinky.createModel(WalletModel, WalletFields);
Wallet.ensureIndex('userId');

exports.WalletFields = WalletFields;

exports.createWallet = function (userId) {
    var wallet = {id: nextId(), userId: userId};
    return Wallet.save(wallet);
};

exports.updateWalletById = function (id, update, options) {
    return r.table(WalletModel).get(id).update(update).run();
};

exports.getAccountsByUserId = function (userId) {
    return r.table(WalletModel).getAll(userId, {index: "userId"}).run();
};

// personal account
exports.addPersonalAccountById = function (id, accountInfo) {
    return r.table(WalletModel).get(id).update({personalAccount: r.row("personalAccount").default([]).append(accountInfo)}, {returnChanges: true});
};

exports.updatePersonalAccountById = function (userId, update, options) {
    var accountInfo = {personalAccount: r.row('personalAccount').changeAt(options.personalAccountIndex, update)};
    return Wallet.getAll(userId, {index: "userId"}).update(accountInfo).run();
};

// business account
exports.addBusinessAccount = function (id, accountInfo) {
    return r.table(WalletModel).get(id).update({businessAccount: r.row("businessAccount").default([]).append(accountInfo)}, {returnChanges: true});
};

exports.updateBusinessAccountById = function (userId, update, options) {
    var accountInfo = {businessAccount: r.row('businessAccount').changeAt(options.businessAccountIndex, update)};
    return Wallet.getAll(userId, {index: "userId"}).update(accountInfo).run();
};

// paypal account
exports.addPaypalAccount = function (userId, accountInfo) {
    var accountInfo = {paypalAccount: r.row("paypalAccount").default([]).append(accountInfo)};
    return Wallet.getAll(userId, {index: "userId"}).update(accountInfo);
};

exports.updatePaypalAccountById = function (userId, update, options) {
    var accountInfo = {paypalAccount: r.row('paypalAccount').changeAt(options.paypalAccountIndex, update)};
    return Wallet.getAll(userId, {index: "userId"}).update(accountInfo).run();
};

exports.getPaypalAccountByAccount = function (account, paypalAccounts) {
    return _.find(paypalAccounts, {account: account});
};

exports.getPaypalAccountByAccountId = function (accountId, paypalAccounts) {
    return _.find(paypalAccounts, {accountId: accountId});
};

exports.getWalletByUserId = async function (userId, attributeNames, options) {
    const columns     = _.isEmpty(attributeNames) ? _.keys(WalletFields) : attributeNames;
    var walletInfoArr = await r.table('Wallet').getAll(userId, {index: "userId"}).pluck(columns).run();
    return walletInfoArr[0];
};

/**
 * 根据accountId查询银行账户详情
 * @param req 请求体
 * @param id 银行账户id
 * @param walletInfo 钱包详情
 * @returns {*}
 */
exports.getBankAccountById = function (req, id, walletInfo) {
    try {
        var personalAccount = walletInfo['personalAccount'];
        var businessAccount = walletInfo['businessAccount'];
        var personalInfo    = _.find(personalAccount, {accountId: id, status: 'normal'});
        var businessInfo    = _.find(businessAccount, {accountId: id, status: 'normal'});
        if (_.isEmpty(personalInfo) && _.isEmpty(businessInfo)) {
            throw new Error(req.__('NotExists', 'wallet personalInfo,businessInfo'));
        }
        return !_.isEmpty(personalInfo) ? personalInfo : businessInfo;
    } catch (e) {
        throw e;
    }
};

/**
 * 根据accountId查询PalPal账户详情
 * @param req 请求体
 * @param id 银行账户id
 * @param walletInfo 钱包详情
 * @returns {*}
 */
exports.getPayPalAccountById = function (req, id, walletInfo) {
    try {
        var paypalAccount = walletInfo['paypalAccount'];
        var payPalInfo    = _.find(paypalAccount, {accountId: id, status: 'normal'});
        if (_.isEmpty(payPalInfo)) {
            throw new Error(req.__('NotExists', 'wallet payPalInfo'));
        }
        return payPalInfo;
    } catch (e) {
        throw e;
    }
};

// 根据企业银行帐户Id 获取帐户信息
exports.getWalletByBAccountId = function (BAccountId) {
    // logger.debug('BAccountId: '+BAccountId);
    return r.table(WalletModel).filter(r.row('businessAccount').contains(function (account) {
        return account('accountId').eq(BAccountId).and(account('status').eq('normal'))
    })).pluck('businessAccount', 'id', 'userId').run();
};

// 根据企业银行帐户Id 获取企业银行帐户信息
exports.getBAccountByAccountId = function (BAccountId) {
    return r.table(WalletModel).concatMap(function (doc) {
        return doc("businessAccount")
    }).filter(function (account) {
        return account("accountId").eq(BAccountId)
    }).run();

};

// 根据企业银行帐户Id 修改企业银行帐户审核信息
exports.updateBAccountByAccountId = function (id, BAccountId, auditStatus, auditNotes) {
    var result = r.table(WalletModel).filter(
        function (doc) {
            return doc('id').eq(id)
        }
    ).update({
        businessAccount: r.row("businessAccount").map(
            function (account) {
                return r.branch(
                    account("accountId").eq(BAccountId),
                    account.merge({auditStatus: auditStatus, auditNotes: auditNotes, uTime: new Date()}),
                    account
                );
            })
    }).run();

    return Promise.props(result);

}

// 根据条件 分页查询 所有已填写认证用户 的信息
exports.getBAccountsWithAuditPageIndex = function (params) {

    var businessFilter = __buildBAccountsFilter(params);
    var totalCount     = parseInt(params.total) || -1;     // 总记录数
    var page           = parseInt(params.page) || 1;      // 第几页
    var limit          = parseInt(params.limit) || 10;     // 每页显示记录数
    var skip           = ( page - 1 ) * limit;
    var orderBy        = params.orderBy || "id";

    var items = businessFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = businessFilter.count().run;
    }
    return Promise.props({items: items, count: totalCount});
};

// 拼装搜索条件
function __buildBAccountsFilter(params) {
    var auditStatus = params.auditStatus;
    var companyName = params.companyName;
    var sTime       = params.sTime;
    var eTime       = params.eTime;

    // 查询 所有未删除的 企业认证 信息
    var businessFilter = r.table(WalletModel).concatMap(function (doc) {return doc("businessAccount").default([])}).filter(function (acount) {return acount("status").eq("normal")});

    // 根据 公司名 查询
    if (!_.isEmpty(companyName)) {
        businessFilter = businessFilter.filter(function (acount) {
            return acount("companyName").eq(companyName)
        })
    }
    // 根据 审核状态 查询
    if (!_.isEmpty(auditStatus)) {
        businessFilter = businessFilter.filter(function (acount) {
            return acount("auditStatus").eq(auditStatus)
        })
    }
    // {"page":"1","limit":"20","auditStatus":"auditing","stime":"2017-05-10","etime":"2017-05-12","username":"test"}
    // 根据 提交时间 查询
    if (!_.isEmpty(sTime) && !_.isEmpty(eTime)) {
        var stime_Arr  = sTime.split('-');
        var etime_Arr  = eTime.split('-');
        businessFilter = businessFilter.filter(function (post) {
            return post("cTime").during(r.time(Number(stime_Arr[0]), Number(stime_Arr[1]), Number(stime_Arr[2]), 'Z'), r.time(Number(etime_Arr[0]), Number(etime_Arr[1]), Number(etime_Arr[2]), 'Z'));
        })
    }

    return businessFilter;
}

// 获取企业认证状态
exports.getAuditStatusList = function (req) {
    var auditStatusTypes = _.values(fixParams.BUSINESS_ACCOUNT_AUDIT_STATUS);
    var auditStatusList  = [];
    _.each(auditStatusTypes, function (auditStatusType) {
        var i18nKey = "audit_status_" + auditStatusType;
        auditStatusList.push({name: auditStatusType, str: req.__(i18nKey)})
    });
    return auditStatusList;
};

exports.updateWalletBalance = async function (transactionInfo, balance) {
    try {
        let newBalance        = {};
        const userId          = transactionInfo.userId;
        const transactionType = transactionInfo.type;

        if (myutil.inArray(transactionType, ['WITHDRAWALS', 'MEMBER', 'TICKET', 'REFUND_TICKET'])) {

            const currency = transactionInfo.currency;

            if (fixParams.CURRENCY_NAME.YUAN === currency) {
                _.merge(newBalance, {balanceRMB: balance});
            }

            if (fixParams.CURRENCY_NAME.DOLLAR === currency) {
                _.merge(newBalance, {balanceDollar: balance});
            }

        } else if (myutil.inArray(transactionType, ['SMS', 'SEND_SMS'])) {
            _.merge(newBalance, {balanceSMS: balance});
        } else if (myutil.inArray(transactionType, ['EMAIL', 'SEND_EMAIL'])) {
            _.merge(newBalance, {balanceEmail: balance});
        } else {
            return;
        }

        if (_.isEmpty(newBalance)) {
            return;
        }

        _.merge(newBalance, {uTime: r.now()});

        return r.table(WalletModel).getAll(userId, {index: "userId"}).update(newBalance);
    } catch (err) {
        logger.error('updateWalletBalance ', err);
    }
};
