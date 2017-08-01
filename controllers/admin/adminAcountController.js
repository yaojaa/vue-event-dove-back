'use strict';

var _           = require('lodash');
var myutil      = require('../../util/util.js');
var errorCodes  = require('../../util/errorCodes.js').ErrorCodes;
var fixParams   = require('../../util/fixParams.js');
const settings  = require("../../conf/settings");
const loggerSettings = require('../../logger');
const logger         = loggerSettings.winstonLogger;
var Promise     = require('bluebird');
var order       = require('../../model/order');
var Wallet = require('../../model/wallet');

exports.getBAccountsPageIndex  = getBAccountsPageIndex;
exports.getBAccountsDatil      = getBAccountsDatil;
exports.updateBAccount         = updateBAccountsAuditStatus;

async function getBAccountsPageIndex(req, res, next) {

    try {
        var params = req.query;
        var data            = await Wallet.getBAccountsWithAuditPageIndex(params);
        var auditStatusList = Wallet.getAuditStatusList(req);

        var paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        paginate.auditStatusList = auditStatusList;
        return res.status(200).send(paginate);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

// 获取 企业认证帐户详情
async function getBAccountsDatil(req, res, next) {
    try {
        var params = req.query;
        var wallet = await Wallet.getBAccountByAccountId(params.accountId);

        return res.status(200).send(wallet[0]);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

// 修改企业帐户认证审核状态
async function updateBAccountsAuditStatus(req, res, next) {
    try {
        var params = req.body;
        var accountId   = params.accountId;
        var auditStatus = params.auditStatus;
        var auditNotes  = params.auditNotes;
        var walletInfo  = await Wallet.getWalletByBAccountId(accountId);
        var updateRet   = await Wallet.updateBAccountByAccountId(walletInfo[0].id,accountId,auditStatus,auditNotes);
        return res.status(200).send(updateRet);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}
