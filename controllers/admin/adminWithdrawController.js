const Withdraw= require('../../model/transaction');
const errorCodes  = require('../../util/errorCodes.js').ErrorCodes;
const myutil      = require('../../util/util.js');
const fixParams   = require('../../util/fixParams.js');
const User        = require('../../model/user');
const sysNotice   = require('../../model/admin/sysNotice');
const settings  = require("../../conf/settings");
const loggerSettings = require('../../logger');
const logger         = loggerSettings.winstonLogger;

exports.getWithdrawPageIndex  = getWithdrawPageIndex;
exports.getWithdrawByHash     = getWithdrawByHash;
exports.getWithdrawByNo       = getWithdrawByNo;
exports.updateWithdrawStatus  = updateWithdrawStatus;


// 获取需审核的提现记录
async function getWithdrawPageIndex(req, res, next) {
    try {
        let params = req.query;
        let data = await Withdraw.getWithdrawList(params);
        let paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);
        return res.status(200).send(paginate);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

// 更改提现申请状态
async function updateWithdrawStatus(req,res,next){
    try {
        let {withdrawId,status} = req.body;
        let result = await Withdraw.updateWithdrawStatus(withdrawId,status);        
        //发送通知
        if(status=='success'){
            const userInfo   = await User.getUserById(result.operateUserId,['id','phone','email']); //用户信息
            const functionType  = fixParams.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
            sysNotice.sendNotice(req, functionType, 'user_tixian_ok', 'sms', {}, userInfo);
        }
        return res.status(200).send(result);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}
// 根据流哈希值获得记录
async function getWithdrawByHash(req, res, next){
     try {
        let hash = req.query.hash;
        let data = await Withdraw.getWithdrawList(hash);
        let paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);
        return res.status(200).send(paginate);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}
// 根据流水单号获得记录
async function getWithdrawByNo(req , res, next){
     try {
        let withdrawNo = req.query.withdrawNo;
        let data = await Withdraw.getWithdrawByNo(withdrawNo);
        let paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);
        return res.status(200).send(paginate);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}
