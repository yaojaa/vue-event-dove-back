const Feedback= require('../../model/feedback');
const errorCodes  = require('../../util/errorCodes.js').ErrorCodes;
const myutil      = require('../../util/util.js');
const __           = require('lodash');
const settings  = require("../../conf/settings");
const loggerSettings = require('../../logger');
const logger         = loggerSettings.winstonLogger;

exports.getFeedbackPageIndex  = getFeedbackPageIndex;
exports.updateFeedbackStatus  = updateFeedbackStatus;

//获得反馈列表
async function getFeedbackPageIndex(req,res,next) {
    try {
        let params = req.query;
        let data = await Feedback.getFeedbackList(params);
        let paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);
        return res.status(200).send(paginate);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}
//更改反馈列表审核状态
async function updateFeedbackStatus(req,res,next) {
    try {
        let params = req.body;
        if(__.isEmpty(params.feedbackId)===false&&__.isEmpty(params.status)===false){
           await Feedback.updateFeedbackStatus(params.feedbackId,params.status);
           return res.status(200);
        }else{
            return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: err.message});
        }
    }catch (err){
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}
