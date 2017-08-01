var _          = require('lodash');
var _st        = require("../conf/settings");
var fs         = require('fs');
var Promise    = require('bluebird');
var http       = require('http');
var path       = require('path');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
var errorCodes = require('../util/errorCodes.js').ErrorCodes;
var fp         = require('../util/fixParams.js');
var sc         = require('../util/sendCloud.js');
var xml2js     = require('xml2js');
var Notice     = require('../model/notice');

/**
 * 发送短信
 * @param saveRecordRet   短信邮件记录
 * @private
 */
function __sendSMSRecord (saveRecordRet) {
    var promise = new Promise(function(resolve, reject) {
        // 组装请求参数
        var reqParams  = __jointYMApiParam(saveRecordRet);
        var paramsData = reqParams.concat(fp.YIMEIPARAMS.CDKEY_PW);
        var sendFail   = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL;
        var sendSuccess = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS;
        const doSomething = Promise.coroutine(function*() {
            try {
                // 调取联接 yiMei 函数 得到返回结果
                var retDataXML = yield sc.connectInterface(paramsData, [], fp.YIMEIPARAMS.API_URL.sendUrlTest);
                // logger.debug("retDataXML: "+retDataXML);
                var resultJson = {};
                xml2js.parseString(retDataXML, { explicitArray : false, ignoreAttrs : true }, function (err, result) {
                    resultJson = result;
                });
                // logger.debug("resultJson: "+JSON.stringify(resultJson));
                var rdjResult  =  resultJson.response.error;
                var setParams = {
                    id         : saveRecordRet.id,
                    recordId   : saveRecordRet.recordId,
                    sendStatus : rdjResult === "0" ? sendSuccess : sendFail,
                    describe   : rdjResult === "0" ? '请求成功' : resultJson.response.message
                };
                // 修改记录及发送记录状态
                var data = yield Notice.reqApiBatchUpdate(setParams,true,false);

                // logger.debug("data: "+JSON.stringify(data));
                resolve(resultJson);
            } catch (err) {
                logger.debug("err: "+err);
                reject(errorCodes.ERR_INTERNAL_SERVER+" "+err);     // 邮件类型 邮件标题为空
            }
        })();

    });
    return promise;
}

exports.sendSMSRecord = __sendSMSRecord;

/**
 * 根据短信邮件记录拼接亿美短信发送接口参数
 * @param srr
 * @returns {[*,*,*]}
 * @private
 */
function __jointYMApiParam(srr){
    var phone = [];
    _.each(srr.receivers, function (receiver) {
        var receiverNumber = receiver.receiver;
        phone.push(receiverNumber);
    });
    var reqParams = [
        {paramName: "phone", paramValue: phone.join(",")},
        {paramName: "message", paramValue: fp.YIMEIPARAMS.label + srr.content},
        {paramName: "seqid", paramValue: srr.id}
    ];
    return reqParams;
}

