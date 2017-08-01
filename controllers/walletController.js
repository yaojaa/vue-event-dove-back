'use strict';

var _          = require('lodash');
var Wallet     = require('../model/wallet.js');
var myutil     = require('../util/util.js');
var nextId     = myutil.nextId;
var thinky     = require('../util/thinky.js');
var md5        = require('md5');
var Promise    = require('bluebird');
const settings = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
var errorCodes = require('../util/errorCodes.js').ErrorCodes;
var fixParams  = require('../util/fixParams.js');
var User       = require('../model/user');
var Event      = require('../model/event');

const sysNotice  = require('../model/admin/sysNotice');


// personal account
exports.addPersonalAccount = async function (req, res, next) {
    const body        = req.body;
    const userId      = req.user.id;
    const bankAccount = body.bankAccount;

    // 验证规则数组
    var validArr = [
        {fieldName: 'ownerName', type: 'string'},
        {fieldName: 'ownerIdNumber', type: 'string'},
        {fieldName: 'bankName', type: 'string'},
        {fieldName: 'bankAccount', type: 'string'},
        {fieldName: 'bankProvince', type: 'string'},
        {fieldName: 'bankCity', type: 'string'},
        {fieldName: 'bankBranch', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        // 根据userId查询是否已经拥有钱包账户
        var walletInfo = await __getWalletByUserId(userId, ['id', 'userId', 'personalAccount']);

        if (_.isEmpty(walletInfo)) {
            // 钱包账户不存在,先添加钱包账户
            walletInfo = await Wallet.createWallet(userId);
        }

        // 根据bankAccount查询添加的账户是否存在
        var personalAccounts    = walletInfo.personalAccount || [];
        var personalAccountInfo = _.find(personalAccounts, {bankAccount: bankAccount, status: 'normal'});

        if (!(_.isEmpty(personalAccountInfo))) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Exists", bankAccount)
            });
        }

        var personalAccount       = myutil.getPurenessRequsetFields(body, Wallet.WalletFields.personalAccount[0]);
        personalAccount.accountId = nextId();
        personalAccount.status    = 'normal';
        personalAccount.uTime     = new Date();
        personalAccount.cTime     = new Date();
        await Wallet.addPersonalAccountById(walletInfo.id, personalAccount);

        //发送通知
        const userInfo = await User.getUserById(userId,['id','email']);
        const toData={
            ownerName:bankAccount.ownerName,ownerIdNumber:bankAccount.ownerIdNumber,bankName:bankAccount.bankName,
            bankAccount:bankAccount.bankAccount,bankProvince:bankAccount.bankProvince,bankCity:bankAccount.bankCity,bankBranch:bankAccount.bankBranch
        }
        const functionType = fixParams.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
        sysNotice.sendNotice(req,functionType,'user_bank_card_bind','email',toData,userInfo);

        return res.status(200).send(personalAccount);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

exports.updatePersonalAccountById = async function (req, res, next) {
    const body           = req.body;
    const userId         = req.user.id;
    const accountId      = body.accountId;
    const newBankAccount = body.bankAccount || '';

    // 验证规则数组
    var validArr = [
        {fieldName: 'accountId', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        // 根据userId查询是否已经拥有钱包账户
        var walletInfo = await __getWalletByUserId(userId, ['id', 'userId', 'personalAccount']);

        if (_.isEmpty(walletInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", userId)
            });
        }

        // 根据accountId查询账户是否存在
        var personalAccounts     = walletInfo.personalAccount || [];
        var personalAccountIndex = _.findIndex(personalAccounts, {accountId: accountId, status: 'normal'});
        if (personalAccountIndex === -1) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", accountId)
            });
        }

        var personalAccountInfo = personalAccounts[personalAccountIndex];
        if (!(_.isEmpty(newBankAccount)) && personalAccountInfo.bankAccount !== newBankAccount) {

            // 新账户和原账户不一样需要校验新账户唯一性
            var newPersonalAccountInfo = _.find(personalAccounts, {bankAccount: newBankAccount, status: 'normal'});
            if (!(_.isEmpty(newPersonalAccountInfo))) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__("Exists", newBankAccount)
                });
            }

        }

        // 更新账户
        var personalAccount = myutil.getPurenessRequsetFields(body, Wallet.WalletFields.personalAccount[0]);
        var updateData      = _.merge(personalAccountInfo, personalAccount);
        updateData.uTime    = new Date();
        await Wallet.updatePersonalAccountById(userId, updateData, {personalAccountIndex: personalAccountIndex});

        return res.status(200).send(personalAccount);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

exports.deletePersonalAccountById = async function (req, res, next) {
    const body      = req.body;
    const userId    = req.user.id;
    const accountId = body.accountId;

    // 验证规则数组
    var validArr = [
        {fieldName: 'accountId', type: 'string'}
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        // 根据userId查询是否已经拥有钱包账户
        var walletInfo = await __getWalletByUserId(userId, ['id', 'userId', 'personalAccount']);

        if (_.isEmpty(walletInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", userId)
            });
        }

        // 根据accountId查询账户是否存在
        var personalAccounts     = walletInfo.personalAccount || [];
        var personalAccountIndex = _.findIndex(personalAccounts, {accountId: accountId});
        if (personalAccountIndex === -1) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", accountId)
            });
        }

        // 如果绑定过活动则不能进行删除
        const IsAccountIdHasEvent = await Event.IsAccountIdHasEvent(accountId);
        if (IsAccountIdHasEvent) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("AccountIdHasEvent", accountId)
            });
        }

        var personalAccountInfo = personalAccounts[personalAccountIndex];

        // 更新账户
        personalAccountInfo.status = 'deleted';
        personalAccountInfo.uTime  = new Date();
        await Wallet.updatePersonalAccountById(userId, personalAccountInfo, {personalAccountIndex: personalAccountIndex});

        return res.status(200).send(personalAccountInfo);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

// business account
exports.addBusinessAccount = async function (req, res, next) {
    const body        = req.body;
    const userId      = req.user.id;
    const bankAccount = body.bankAccount;

    // 验证规则数组
    var validArr = [
        {fieldName: 'companyName', type: 'string'},
        {fieldName: 'representativeName', type: 'string'},
        {fieldName: 'representativeId', type: 'string'},
        {fieldName: 'contact', type: 'string'},
        {fieldName: 'licenseImageUrl', type: 'string'},
        {fieldName: 'bankName', type: 'string'},
        {fieldName: 'bankAccount', type: 'string'},
        {fieldName: 'bankProvince', type: 'string'},
        {fieldName: 'bankCity', type: 'string'},
        {fieldName: 'bankBranch', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        // 根据userId查询是否已经拥有钱包账户
        var walletInfo = await __getWalletByUserId(userId, ['id', 'userId', 'businessAccount']);

        if (_.isEmpty(walletInfo)) {
            // 钱包账户不存在,先添加钱包账户
            walletInfo = await Wallet.createWallet(userId);
        }

        // 根据bankAccount查询添加的账户是否存在
        var businessAccounts    = walletInfo.businessAccount || [];
        var businessAccountInfo = _.find(businessAccounts, {bankAccount: bankAccount, status: 'normal'});

        if (!(_.isEmpty(businessAccountInfo))) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Exists", bankAccount)
            });
        }

        var businessAccount         = myutil.getPurenessRequsetFields(body, Wallet.WalletFields.businessAccount[0]);
        businessAccount.accountId   = nextId();
        businessAccount.status      = 'normal';
        businessAccount.auditStatus = 'auditing';
        businessAccount.uTime       = new Date();
        businessAccount.cTime       = new Date();
        await Wallet.addBusinessAccount(walletInfo.id, businessAccount);

        return res.status(200).send(businessAccount);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

// userId, accountId, update
exports.updateBusinessAccountById = async function (req, res, next) {
    const body           = req.body;
    const userId         = req.user.id;
    const accountId      = body.accountId;
    const newBankAccount = body.bankAccount || '';

    // 验证规则数组
    var validArr = [
        {fieldName: 'accountId', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        // 根据userId查询是否已经拥有钱包账户
        var walletInfo = await __getWalletByUserId(userId, ['id', 'userId', 'businessAccount']);

        if (_.isEmpty(walletInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", userId)
            });
        }

        // 根据accountId查询账户是否存在
        var businessAccounts     = walletInfo.businessAccount || [];
        var businessAccountIndex = _.findIndex(businessAccounts, {accountId: accountId, status: 'normal'});
        if (businessAccountIndex === -1) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", accountId)
            });
        }

        var businessAccountInfo = businessAccounts[businessAccountIndex];
        if (!(_.isEmpty(newBankAccount)) && businessAccountInfo.bankAccount !== newBankAccount) {

            // 新账户和原账户不一样需要校验新账户唯一性
            var newBusinessAccountInfo = _.find(businessAccounts, {bankAccount: newBankAccount, status: 'normal'});
            if (!(_.isEmpty(newBusinessAccountInfo))) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__("Exists", newBankAccount)
                });
            }

        }

        // 更新账户
        var businessAccount = myutil.getPurenessRequsetFields(body, Wallet.WalletFields.businessAccount[0]);
        var updateData      = _.merge(businessAccountInfo, businessAccount);
        updateData.uTime    = new Date();
        await Wallet.updateBusinessAccountById(userId, updateData, {businessAccountIndex: businessAccountIndex});

        return res.status(200).send(businessAccount);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

// userId, accountId
exports.deleteBusinessAccountById = async function (req, res, next) {
    const body      = req.body;
    const userId    = req.user.id;
    const accountId = body.accountId;

    // 验证规则数组
    var validArr = [
        {fieldName: 'accountId', type: 'string'}
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        // 根据userId查询是否已经拥有钱包账户
        var walletInfo = await __getWalletByUserId(userId, ['id', 'userId', 'businessAccount']);

        if (_.isEmpty(walletInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", userId)
            });
        }

        // 根据accountId查询账户是否存在
        var businessAccounts     = walletInfo.businessAccount || [];
        var businessAccountIndex = _.findIndex(businessAccounts, {accountId: accountId});
        if (businessAccountIndex === -1) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", accountId)
            });
        }

        // 如果绑定过活动则不能进行删除
        const IsAccountIdHasEvent = await Event.IsAccountIdHasEvent(accountId);
        if (IsAccountIdHasEvent) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("AccountIdHasEvent", accountId)
            });
        }

        var businessAccountInfo = businessAccounts[businessAccountIndex];

        // 更新账户
        businessAccountInfo.status = 'deleted';
        businessAccountInfo.uTime  = new Date();
        await Wallet.updateBusinessAccountById(userId, businessAccountInfo, {businessAccountIndex: businessAccountIndex});

        return res.status(200).send(businessAccountInfo);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

// 企业实名认证审核接口
exports.auditBusinessAccount = async function (req, res, next) {
    var body        = req.body;
    var userId      = body.userId;
    var accountId   = body.accountId;
    var auditStatus = body.auditStatus;
    var auditNotes  = body.auditNotes;

    // 验证规则数组
    var validArr = [
        {fieldName: 'userId', type: 'string'},
        {fieldName: 'accountId', type: 'string'},
        {fieldName: 'auditStatus', type: 'string'}
    ];

    if (!myutil.inArray(auditStatus, ['auditFailure', 'auditThrough'])) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("NotExists", 'auditStatus')
        });
    }

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        // 根据userId查询是否已经拥有钱包账户
        var walletInfo = await __getWalletByUserId(userId, ['id', 'userId', 'businessAccount']);

        if (_.isEmpty(walletInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", userId)
            });
        }

        // 根据accountId查询账户是否存在
        var businessAccounts     = walletInfo.businessAccount || [];
        var businessAccountIndex = _.findIndex(businessAccounts, {accountId: accountId, status: 'normal'});
        if (businessAccountIndex === -1) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", accountId)
            });
        }

        var businessAccountInfo = businessAccounts[businessAccountIndex];

        // 更新账户
        businessAccountInfo.auditStatus = auditStatus;
        businessAccountInfo.auditNotes  = auditNotes;
        businessAccountInfo.uTime       = new Date();
        await Wallet.updateBusinessAccountById(userId, businessAccountInfo, {businessAccountIndex: businessAccountIndex});

        return res.status(200).send(businessAccountInfo);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// 获取钱包详情
exports.getWalletDetail = async function (req, res, next) {
    var params  = req.query;
    var userId  = req.user.id;
    var eventId = params.eventId;
    try {
        // 根据userId查询钱包账户
        var attributeNames = ['id', 'userId', 'balanceRMB', 'balanceDollar', 'balanceEmail', 'balanceSMS', 'personalAccount', 'businessAccount', 'paypalAccount'];
        var walletInfo     = await __getWalletByUserId(userId, attributeNames);

        if (_.isEmpty(walletInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", 'wallet')
            });
        }
        // 获取活动中邮件余额
        var eventEmailBalance = 0;
        if (!_.isEmpty(eventId) && !_.isUndefined(eventId)) {
            var eventAttributeNames = ['emailBalance'];
            var event               = await Event.getEventById(eventId, eventAttributeNames);
            if (!_.isEmpty(event)) {
                eventEmailBalance = event.emailBalance;
            }
        }
        walletInfo.eventEmailBalance = eventEmailBalance;

        return res.status(200).send(walletInfo);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// paypal account
// userId, accountInfo
exports.addPaypalAccount = async function (req, res, next) {
    const body     = req.body;
    const userId   = req.user.id;
    const account  = body.account;
    const password = body.password;

    if (_.isEmpty(account)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "account")
        });
    }

    if (_.isEmpty(password)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "password")
        });
    }

    try {

        if (!(await User.checkWalletPwd(userId, password))) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("wrong_password")
            });
        }

        // 根据userId查询是否已经拥有钱包账户
        var walletInfo = await __getWalletByUserId(userId, ['userId', 'paypalAccount']);

        if (_.isEmpty(walletInfo)) {
            // 钱包账户不存在,先添加钱包账户
            walletInfo = await Wallet.createWallet(userId);
        }

        // 根据account查询添加的账户是否存在
        var paypalAccounts    = walletInfo.paypalAccount || [];
        var paypalAccountInfo = _.find(paypalAccounts, {account: account, status: 'normal'});

        if (!(_.isEmpty(paypalAccountInfo))) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Exists", account)
            });
        }

        // 添加PayPal账户
        var accountInfo = {
            accountId: nextId(), account: account, status: 'normal', uTime: new Date(), cTime: new Date()
        };
        await Wallet.addPaypalAccount(userId, accountInfo);

        return res.status(200).send(accountInfo);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// userId, accountId, update
exports.updatePaypalAccount = async function (req, res, next) {
    const body       = req.body;
    const userId     = req.user.id;
    const accountId  = body.accountId;
    const newAccount = body.account;
    const password   = body.password;

    // 验证规则数组
    const validArr = [
        {fieldName: 'accountId', type: 'string'},
        {fieldName: 'account', type: 'string'}
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        if (!(await User.checkWalletPwd(userId, password))) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("wrong_password")
            });
        }

        // 根据userId查询是否已经拥有钱包账户
        const walletInfo = await __getWalletByUserId(userId, ['userId', 'paypalAccount']);

        if (_.isEmpty(walletInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", userId)
            });
        }

        // 根据accountId查询账户是否存在
        const paypalAccounts     = walletInfo.paypalAccount || [];
        const paypalAccountIndex = _.findIndex(paypalAccounts, {accountId: accountId, status: 'normal'});
        if (paypalAccountIndex === -1) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", accountId)
            });
        }

        const paypalAccountInfo = paypalAccounts[paypalAccountIndex];
        if (paypalAccountInfo.account !== newAccount) {

            // 新账户和原账户不一样需要校验新账户唯一性
            var newPaypalAccountInfo = _.find(paypalAccounts, {account: newAccount, status: 'normal'});
            if (!(_.isEmpty(newPaypalAccountInfo))) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__("Exists", newAccount)
                });
            }

        }

        // 更新PayPal账户
        paypalAccountInfo.account = newAccount;
        paypalAccountInfo.uTime   = new Date();
        await Wallet.updatePaypalAccountById(userId, paypalAccountInfo, {paypalAccountIndex: paypalAccountIndex});

        return res.status(200).send(paypalAccountInfo);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// userId, accountId
exports.deletePaypalAccountById = async function (req, res, next) {
    var body      = req.body;
    var userId    = req.user.id;
    var accountId = body.accountId;

    // 验证规则数组
    var validArr = [
        {fieldName: 'accountId', type: 'string'}
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        // 根据userId查询是否已经拥有钱包账户
        var walletInfo = await __getWalletByUserId(userId, ['userId', 'paypalAccount']);

        if (_.isEmpty(walletInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", userId)
            });
        }

        // 根据accountId查询添加的账户是否存在
        var paypalAccounts     = walletInfo.paypalAccount || [];
        var paypalAccountIndex = _.findIndex(paypalAccounts, {accountId: accountId});
        if (paypalAccountIndex === -1) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", accountId)
            });
        }

        // 如果绑定过活动则不能进行删除
        const IsAccountIdHasEvent = await Event.IsAccountIdHasEvent(accountId);
        if (IsAccountIdHasEvent) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("AccountIdHasEvent", accountId)
            });
        }

        var paypalAccountInfo = paypalAccounts[paypalAccountIndex];

        // 更新PayPal账户
        paypalAccountInfo.status = 'deleted';
        paypalAccountInfo.uTime  = new Date();
        await Wallet.updatePaypalAccountById(userId, paypalAccountInfo, {paypalAccountIndex: paypalAccountIndex});

        return res.status(200).send(paypalAccountInfo);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

/**
 * 根据userId查询钱包详情
 * @param userId
 * @param attributeNames
 * @returns {*}
 * @private
 */
async function __getWalletByUserId(userId, attributeNames) {
    var walletInfo = await Wallet.getWalletByUserId(userId, attributeNames);
    return walletInfo;
}
