'use strict';

const _            = require('lodash');
const myutil       = require('../util/util.js');
const fs           = require('fs');
const sc           = require('../util/sendCloud.js');
const thinky       = require('../util/thinky.js');
const r            = thinky.r;
const Notice       = require('../model/notice');
const Order        = require('../model/order');
const Wallet       = require('../model/wallet');
const Event        = require('../model/event');
const Transaction   = require('../model/transaction');
const Promise      = require('bluebird');
const settings     = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const errorCodes   = require('../util/errorCodes.js').ErrorCodes;
const fp           = require('../util/fixParams.js');
const ym           = require('../util/yiMei.js');
const xml2js       = require('xml2js');
const Alipay       = require('../services/pay/alipay/alipay');
const PayPal       = require('../services/pay/paypal/paypal');
const PayPalConfig = require('../services/pay/paypal/config').PayPalConfig;
const httpsRequest = require('../util/httpsRequest.js');
const path       = require('path');

exports.callbackListener        = sendCloudCallbackListener;
exports.yiMeiCallbackListener   = yiMeiCallbackListener;
exports.saveRecord   = saveRecord;
exports.getRecord    = getRecord;
exports.getRecords   = getRecords;
exports.updateRecord = updateRecord;
exports.delRecord    = delRecord;
exports.resendRecord = resendRecord;
exports.getSendRecords = getSendRecords;

// 保存短信邮件记录
async function saveRecord(req, res, next){
    var params   = req.body;
    var userId   = req.user.id;
    var receivers = params.receivers;
    var eventId   = params.eventId;
    var category  = params.category;
    var content   = params.content;
    var type      = params.type;
    params.userId = userId;

    // 参数校验
    var retCode =  __validateParams(params, req, next);
    if(retCode.errorCode !== '100000'){
        if(retCode.errorCode === '199998'){
            return next({
                errorCode   : errorCodes.EMAIL_SEND_RECORD_EVENTID_IS_NULL,
                responseText: req.__("Empty", retCode.reMsg)
            });
        }else{
            return next({
                errorCode   : retCode.errorCode,
                responseText: req.__("sms_email_error_code_"+retCode.errorCode)
            });
        }
    }
    var recordField = myutil.getPurenessRequsetFields(params, Notice.SmsEmailRecordFields);    // 准备需要插入数据库的数据
    try {
        // 获取当前发送邮件短信数量
        var countRet = await __getSendEmailOrSMSCount(receivers,eventId,category,content,type);
        if(countRet.recode !== '100000'){
            // 获取 标签对应下的参会人或购买者信息 系统错误
            return next({
                errorCode   : countRet.recode,
                responseText: req.__("sms_email_error_code_"+countRet.recode)
            });
        }
        recordField.receiverTotal = countRet.receiverTotal;
        // 邮件短信发送总条数
        var sendCount = countRet.recordCount;
        recordField.sendCount = sendCount;
        if(params.isDraft !== true){    // 为草稿邮件不校验额度
            // 校验 发送邮件或短信额度
            var vaResult = await __validateSMSOrEmailLimit(eventId, userId, category, sendCount);
            // logger.debug('vaResult: '+JSON.stringify(vaResult));
            if(vaResult.retCode !== '100000'){
                // 获取 标签对应下的参会人或购买者信息 系统错误
                return next({
                    errorCode   : vaResult.retCode,
                    responseText: req.__("sms_email_error_code_"+vaResult.retCode)
                });
            };
            // 各平台扣除邮件短信数量
            recordField.walletDeductSms   = vaResult.wdSms;
            recordField.walletDeductEmail = vaResult.wdEmail;
            recordField.eventDeductEmail  = vaResult.edEmail;
        }
        // 保存邮件短信记录
        var retDate = await Notice.saveRecord(recordField);
        if(!_.isEmpty(retDate)){
            if(retDate.isDraft === false){
                var wdSmsAmount   = 0 - retDate.walletDeductSms;
                var wdEmailAmount = 0 - retDate.walletDeductEmail;
                var edEmailAmount = 0 - retDate.eventDeductEmail;
                // 扣除短信及邮件费用
                var retCode = await __deductEMAILSMSCost(retDate.id,eventId,userId,wdSmsAmount,wdEmailAmount,edEmailAmount);
                if(retCode === 'fail'){
                    // 扣款失败 修改邮件短信记录
                    await Notice.updateRecord(retDate.id,{sendStatus:fp.RECORD_SEND_STATUS.SEND_STATUS_DEDUCT_FAIL});
                }else{
                    // 若为立即发送 则将短信邮件转化成发送记录并发送邮件或短信
                    if(retDate.sendType === fp.SEND_TYPE.SEND_TYPE_IMMEDIATELY){
                        exports.__sendRecord(retDate);
                    }else{
                        // 定时发送将邮件或短信放入消息推送中
                        await __auditNotice(retDate);
                    }
                }
            }
        }else{
            // 添加失败
            return next({
                errorCode   : '100003',
                responseText: req.__("sms_email_error_code_100003")
            });
        }
        return res.status(200).send(retDate);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 短信邮件记录 创建消费者
async function __auditNotice(recordInfo){
    try {
        // 生产定时结束活动的消息
        let diffMilliseconds = myutil.getDiffMilliseconds(recordInfo.sendTime);
        diffMilliseconds     = (diffMilliseconds <= 0) ? 0 : diffMilliseconds;
        await Notice.produceSendNotice(recordInfo, diffMilliseconds);
        await r.table("SmsEmailRecord").get(recordInfo.id).update({isAudit: true}).run();
    } catch (err) {
        logger.error('处理 recordId = ' + recordInfo.id + '时出错了,报错信息是:' + err.message);
    }
}

// 扣除邮件短信费用 只有非草稿才进行扣除费用
// wdSmsAmount  : 扣钱包中短信条数
// wdEmailAmount: 扣钱包中邮件条数
// edEmailAmount: 扣活动中邮件条数
async function __deductEMAILSMSCost(recordId,eventId,userId,wdSmsAmount,wdEmailAmount,edEmailAmount){
    // 备注: 正: 退款、 负: 扣费
    try {
        if(wdSmsAmount !== 0){
            // 扣除短信余额
            return await __deductWalletCost(recordId,'SEND_SMS',eventId,userId,wdSmsAmount);
        }else {
            // 扣除邮件短信余额
            if(wdEmailAmount === 0){
                // 扣钱包额度为0: 只扣活动中额度
                return await __deductWalletCost(recordId,'EVENT_SEND_EMAIL',eventId,userId,edEmailAmount);
            }else{
                // 扣钱包额度不为0: 1. 只扣钱包额度、2、扣钱包扣活动
                if(edEmailAmount === 0){
                    // 1. 只扣钱包额度
                    return await __deductWalletCost(recordId,'SEND_EMAIL',eventId,userId,wdEmailAmount);
                }else{
                    // 2、扣钱包扣活动
                    var retCode = await __deductWalletCost(recordId,'SEND_EMAIL',eventId,userId,wdEmailAmount);
                    if(retCode === 'fail'){
                        return retCode;
                    }else{
                        retCode = await __deductWalletCost(recordId,'EVENT_SEND_EMAIL',eventId,userId,edEmailAmount);
                        if(retCode === 'fail'){
                            // 退回 钱包所扣邮件额度
                            var refundAmount = 0 - wdEmailAmount;
                            await __deductWalletCost(recordId,'SEND_EMAIL',eventId,userId,refundAmount);
                        }
                        return retCode;
                    }
                }
            }
        }
    } catch (err) {
        logger.error('__deductEMAILSMSCost', err);
        return 'fail';
    }

}

// 扣除邮件短信额度
async function __deductWalletCost(recordId,type,eventId,userId,amount){
    try {
        if(amount !== 0){
            var transaction       = {
                type              : type,      // 订单类型
                refId             : eventId,   // 活动主键id
                userId            : userId,    // 活动主办方用户id
                paymentMethod     : fp.PAYMENT_METHOD.PAYMENT_METHOD_WALLET,// 支付方式
                source            : userId,    // 订单来源账户
                destination       : userId,    // 订单目标账户
                orderId           : recordId,  // 订单号
                paymentPlatformId : userId,    // 支付平台流水号
                amount            : Number(amount),  // 支付总额 退回或扣除条数
                eventdoveNetIncome: Number(0), // 会鸽净收入,即收取的服务费
                channelFee        : Number(0), // 协议通道费 = 支付总金额 * 0.006
                netIncome         : Number(0), // 主办方净收入、支出 净收入 = 支付总金额 - eventdoveNetIncome - channelFee
                currency          : fp.CURRENCY_NAME.TIAO,        // 货币单位
                rawNotification   : '',        // 支付回调原始数据
            };
            var insertTransaction  = await Transaction.addTransaction(transaction);
            if (_.isEmpty(insertTransaction)) {
                logger.error(recordId + '钱包扣费,插入事物失败了,待插入的数据信息是');
                logger.error(transaction);
                return 'fail';
            }
        }
        return 'success';
    } catch (err) {
        logger.error('__deductWalletCost', err);
        return 'fail';
    }
}

// ******校验邮件短信记录参数******
function __validateParams(params,req, next){
    var receivers = params.receivers; // 收件邮件/手机号
    var title     = params.title;     // 标题
    var eventId   = params.eventId;   // 活动id
    var type      = params.type;      // 邮件短信通知类型
    var content  = params.content;    // 邮件短信内容

    var errorCode = '100000';         // 校验成功
    if(_.isUndefined(receivers) || _.isEmpty(receivers)){
        return {errorCode: '199998',reMsg:'receivers'};
    }
    if(_.isUndefined(title) || _.isEmpty(title)){
        return {errorCode: '199998',reMsg:'title'};
    }
    if( _.isUndefined(content) || _.isEmpty(content)){
        return {errorCode: '199998',reMsg:'content'};
    }
    if(_.isUndefined(type) || _.isEmpty(type)){
        return {errorCode: '199998',reMsg:'type'};
    }
    if(_.isUndefined(eventId) || _.isEmpty(eventId)){
        return {errorCode: '199998',reMsg:'eventId'};
    }
    // 校验 邮件或短信类型对应收件人格式
    var type_code = __validateType(params);
    if(type_code !== "100000"){
        return {errorCode:type_code,reMsg:''};
    }
    // 校验 发送类型
    var send_type_code = __validateSendType(params);
    if(send_type_code !== "100000"){
        return {errorCode:send_type_code,reMsg:''};
    }
    // 校验 邮件短信类别
    var send_category_code = __validatecategory(params);
    if(send_category_code !== "100000"){
        return {errorCode:send_category_code,reMsg:''};
    }
    return {errorCode:errorCode,reMsg:''};
}

// ******计算发送邮件或短信条数******
async function __getSendEmailOrSMSCount(receivers,eventId,category,content,type){
    var recode = '100000';  // 成功
    // 获取手动录入的收件人数量(去重)
    var recordCount   = _.uniq(receivers.split(',')).length;
    var receiverTotal = recordCount;   // 收件人总数

    if(type === fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_PROMOTION || type === fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM || type === fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_INFORMS){
        // 活动推广 收件人只能为邮箱或手机号
        if(category === fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS){
            if(content.includes('#活动链接#')){
                // 若短信内容中含有链接标签则内容添加12位占位符替换连接标签 再加上'http://' 再加上两空格
                // content = content.replace(/#活动链接#/g,'************');
                content = content.replace(/#活动链接#/g,'*********************');
            }
            var smsCount = __getSMSContentHaveNum(content.length);
            recordCount *=smsCount;
        }
    }else if(type === fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_NOTICEMENT){
        // 活动通知 只可为一类标识类型
        try {
            // 收件人为标签类型 获取标签下参会者/购买者总数
            var params ={
                eventId   : eventId,
                recordType: category,
                findType  : receivers
            };
            var attributeNames;
            // receivers === 'attendee' ? attributeNames.push('collectInfo').push('codeObj') : attributeNames.push('buyer');
            if(receivers === 'attendee'){
                attributeNames = ['collectInfo','codeObj'];
            }else{
                attributeNames = ['buyer'];
            }
            var orderData = await Order.getReceiverTypeInfo(params,attributeNames);
            recordCount = orderData.length;
            receiverTotal = recordCount;
            // 收件人为具体邮箱或手机号
            if(category === fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS){
                // 短信根据内容获取实际发送条数  #姓名#、#邮箱#、#签到码#、#电子票#、#活动链接# 有这些标签得替换计算实际字数
                for(var i=0;i<orderData.length; i++){
                    if(receivers === 'attendee'){
                        // 参会者信息 可以有所有项
                        content.replace(/#姓名#/g,orderData[i].collectInfo.name);
                        content.replace(/#邮箱#/g,orderData[i].collectInfo.email);
                        content.replace(/#签到码#/g,orderData[i].codeObj.attendeeId);
                        content.replace(/#电子票#/g,'*********************');
                        content.replace(/#活动链接#/g,'*********************');
                    }else{
                        // 购票者信息  不含'#签到码#','#电子票#'项
                        content.replace(/#姓名#/g,orderData[i].buyer.name);
                        content.replace(/#邮箱#/g,orderData[i].buyer.email);
                        content.replace(/#签到码#/g,'');
                        content.replace(/#电子票#/g,'');
                        content.replace(/#活动链接#/g,'*********************');
                    }
                    var smsCount = __getSMSContentHaveNum(content.length);
                    recordCount *=smsCount;
                }
            }
        } catch (err) {
            logger.debug('err: '+err);
            recode = '199999';   // 系统错误
        }
    }
    if(receiverTotal <= 0){
        // 收件人不存在
        recode = '140002';
    }
    var retCount_Obj = {
        recode       : recode,
        receiverTotal: receiverTotal,
        recordCount  : recordCount
    };
    return retCount_Obj;
}
exports.getSendCount = __getSendEmailOrSMSCount;

// ******校验 邮件或短信类型下对应收件人格式******
function __validateType(params){
    var recode    = "100000";         // 成功
    var type      = params.type;      // 邮件或短信类型
    var receivers = params.receivers; // 收件人邮箱/手机号
    var category  = params.category;  // 类别

    // 获取手动录入的收件人数量(去重)
    var receivers_arr = _.uniq(receivers.split(','));
    if(category === 'sms'){        // 短信
        if(type === fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_PROMOTION){
            // 推广  收件人只能为手机号
            var sms_regx = /^1(3|4|5|7|8)\d{9}$/;
            for(var i=0; i<receivers_arr.length; i++){
                if(!receivers_arr[i].match(sms_regx)){
                    // 收件人手机格式错误
                    recode = "130002";
                    break;
                }
            }
        }
    }else{       // 邮件
        if(type === fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_PROMOTION){
            // 推广  收件人只能为邮箱
            // var email_regx = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,3}){1,2})$/;
            var email_regx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i;
            for(var i=0; i<receivers_arr.length; i++){
                if(!email_regx.test(receivers_arr[i])){
                    // 收件人邮箱格式错误
                    recode = "130001";
                    break;
                }
            }
        }
    }
    if(type === fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_NOTICEMENT){
        // 通知邮件/短信 收件人只能为标识
        var receiverTypes = ['attendee','paid','timeOut','onsite','pending','reject'];
        if(!_.includes(receiverTypes, receivers)){
            // 收件人标识不存在
            recode = "130000";
        }
    }

    return recode;
}

// ****** 校验邮件短信额度 ******
async function __validateSMSOrEmailLimit(eventId,userId, category,sendCount){
    var vaRes = {};
    var wallet_deduct_sms   = 0;      // 钱包中须扣除短信条数
    var wallet_deduct_email = 0;      // 钱包中须扣除邮件条数
    var event_deduct_email  = 0;      // 活动中须扣除邮件条数
    var validate_type_code = '100000';// 额度是否足够

    var walletLines = await __getWallet_sms_email_lines(userId);

    if(category === fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS){
        var sms_balance = walletLines.balanceSMS;
        if(sms_balance - sendCount >= 0){
            wallet_deduct_sms = sendCount;
        }else{
            validate_type_code = '120003';    // 短信余额不足
        }
    }else{
        // 校验邮件额度
        var eventEmail_balance = await __getEvent_email_lines(eventId) // 活动中邮件剩余额度
        var walletEmail_balance= walletLines.balanceEmail;       // 钱包中邮件剩余额度
        if((eventEmail_balance + walletEmail_balance - sendCount) >= 0){
            event_deduct_email = eventEmail_balance >= sendCount ? sendCount : eventEmail_balance;
            wallet_deduct_email = eventEmail_balance >= sendCount ? 0 : sendCount - eventEmail_balance;
        }else{
            validate_type_code = '120002';   // 邮件余额不足
        }
    }
    vaRes.retCode = validate_type_code;
    vaRes.wdSms   = wallet_deduct_sms;
    vaRes.wdEmail = wallet_deduct_email;
    vaRes.edEmail = event_deduct_email;

    return vaRes;
}

// ****** 获取钱包邮件及短信额度 ******
async function __getWallet_sms_email_lines(userId){
    var balanceEmail = 0;
    var balanceSMS = 0;
    try {
        var wallet   = await Wallet.getWalletByUserId(userId,['balanceEmail','balanceSMS']);
        balanceEmail = wallet.balanceEmail;
        balanceSMS   = wallet.balanceSMS;
    } catch (err) {
        logger.error('获取钱包(wallet)短信邮件额度异常', err);
        return {balanceEmail:balanceEmail,balanceSMS:balanceSMS};
    }

    return {balanceEmail:balanceEmail,balanceSMS:balanceSMS};
}

// ****** 获取活动免费邮件额度 ******
async function __getEvent_email_lines(eventId){
    var emailBalance = 0;
    try {
        var event = await Event.getEventById(eventId,['emailBalance']);
        emailBalance = event.emailBalance;
    } catch (err) {
        logger.error('获取活动(event)邮件额度异常', err);
        return emailBalance;
    }
    return emailBalance;
}

// ****** 校验邮件短信发送类型 ******
function __validateSendType(params){
    var recode = "100000";            // 成功
    var sendType = params.sendType;   // 发送类型
    var sendTime = params.sendTime;   // 发送时间
    if(sendType === fp.SEND_TYPE.SEND_TYPE_TIMED){
        // 定时发送
        if(_.isUndefined(sendTime) || _.isEmpty(sendTime)){
            // 定时发送,时间不能为空
            recode = "100002";
        }
        var diffMilliseconds = myutil.getDiffMilliseconds(sendTime);
        if(diffMilliseconds <= 0){
            // 定时发送时间必须大于当前时间
            recode = "100004";
        }
    }else if(sendType !== fp.SEND_TYPE.SEND_TYPE_IMMEDIATELY){
        // 发送类型 不存在
        recode = "100001";
    }
    return recode;
}

// ****** 校验邮件短信类别 ******
function __validatecategory(params){
    var recode = "100000";            // 成功
    var category = params.category;   // 类别
    if(category === fp.SEND_RECORD_TYPE.RECORD_TYPE_EMAIL){
        // 发送邮件
        var from = params.from;   // 发件人邮箱
        if(_.isUndefined(from) || _.isEmpty(from)){
            // 发件人邮箱
            recode = "110002";
        }
    }else if(category !== fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS){
        // 邮件短信类别 不存在
        recode = "110001";
    }else{
        var content  = params.content;    // 短信内容
        if(content.length > 300){
            recode = "110000";
        }
    }
    return recode;
}

// ****** 获取邮件短信记录列表 ******
async function getRecords(req, res, next) {
    var params   = req.query;
    var eventId  = params.eventId;
    var category = params.category;
    var isDraft  = params.isDraft;
    var type     = params.type;

    if(!_.includes([fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS,fp.SEND_RECORD_TYPE.RECORD_TYPE_EMAIL],category)){
        // category 为空或不存在
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("err_invalid_req_parameters")
        });
    }
    if(_.isUndefined(eventId) || _.isEmpty(eventId)){
        return next({
            errorCode   : errorCodes.EMAIL_SEND_RECORD_EVENTID_IS_NULL,
            responseText: req.__("Empty", "eventId")
        });
    }
    if(_.isUndefined(type) || _.isEmpty(type)){
        params.type = [fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_PROMOTION,fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_NOTICEMENT];
    }else{
        params.type = [type];
    }
    params.isDraft = isDraft === 'true' ? true : false;
    try {
        var attributeNames = ['id','title','content','sendTime','sendStatus','describe','receiverTotal','ctime'];
        var records   = await Notice.getAllRecord(params,attributeNames);
        if(params.isDraft === false){
            // 获取邮件短信记录发送成功总数
            for(var i = 0; i < records.items.length; i++){
                var successCount = await Notice.getCountWithSendRecordByRecordId(records.items[i].id);
                records.items[i].sendSuccessCount = successCount;
            }
        }
        return res.status(200).send(records);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// ****** 根据Id获取邮件短信记录 ******
async function getRecord(req, res, next) {
    var params = req.query;
    var recordId = params.recordId;

    if(_.isUndefined(recordId) || _.isEmpty(recordId)){
        return next({
            errorCode   : errorCodes.EMAIL_SEND_RECORD_EVENTID_IS_NULL,
            responseText: req.__("Empty", "recordId")
        });
    }
    try {
        var attributeNames = ['id','receivers','title','from','fromName','replyTo','category','content','sendType','sendTime','type','sendStatus','receiverTotal','isDraft','isDel','cTime'];
        var retDate   = await Notice.getRecord(recordId,attributeNames);

        return res.status(200).send(retDate);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// ****** 根据Id获取邮件短信发送记录 ******
async function getSendRecords(req, res, next) {
    var params = req.query;
    var recordId = params.recordId;
    var sendStatus = params.sendStatus;
    if(_.isUndefined(recordId) || _.isEmpty(recordId)){
        return next({
            errorCode   : errorCodes.EMAIL_SEND_RECORD_EVENTID_IS_NULL,
            responseText: req.__("Empty", "recordId")
        });
    }
    if(!_.isEmpty(sendStatus) && !_.isUndefined(sendStatus)){
        if(!_.includes([fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING,fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS,fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL],sendStatus)){
            sendStatus = '';
        }
    }

    try {
        var retDate = await Notice.getSmsEmailSendRecordByRecordId(recordId,sendStatus);

        return res.status(200).send(retDate);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// ****** 发送短信或邮件 ******
exports.__sendRecord = async function(recordObj) {
    // 1. 创建邮件短信发送明细记录
    var receiver_str = recordObj.receivers;
    var type = recordObj.type;
    var category = recordObj.category;
    var content = recordObj.content;
    var eventId = recordObj.eventId;
    // 2. 发送邮件短信
    try {
        // 1. 拼接收件人及邮件短信内容
        var isSplitRecord = false;  // 是否按内容标识按每个收件人保存发送记录
        var receiver_arr = [];
        var receivers = _.uniq(receiver_str.split(','));
        if(type === fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_PROMOTION || type === fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM || type === fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_INFORMS){
            // 活动推广 收件人只能为邮箱或手机号
            receiver_arr = _.map(receivers, function(receiver){
                return {receiver:receiver};
            });
            if(content.includes('#活动链接#')){
                var eventLink = await Order.getEventShortUrl(eventId,false);
                if(!_.isEmpty(eventLink) && !_.isUndefined(eventLink)){
                    eventLink = ' '+eventLink+' ';
                }else{
                    eventLink = '';
                }
                recordObj.content = content.replace(/#活动链接#/g, eventLink);
            }
        }else if(type === fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_NOTICEMENT){
            // 活动通知 只可为一类标识类型
            var params ={
                eventId   : eventId,
                recordType: category,
                findType  : receiver_str
            };
            var attributeNames;
            if(receiver_str === 'attendee'){
                attributeNames = ['collectInfo','codeObj'];
            }else{
                attributeNames = ['buyer'];
            }
            var orderData = await Order.getReceiverTypeInfo(params,attributeNames);
            var eventLink = '';
            if(content.includes('#活动链接#')){
                eventLink = await Order.getEventShortUrl(eventId,false);
                if(!_.isEmpty(eventLink) && !_.isUndefined(eventLink)){
                    eventLink = ' '+eventLink+' ';
                }else{
                    eventLink = '';
                }
            }
            if(content.includes('#姓名#') || content.includes('#邮箱#')
                || content.includes('#签到码#') || content.includes('#电子票#')){
                isSplitRecord = true;    // 每个收件人均成生单独的发件记录
            }
            for(var i=0; i<orderData.length; i++){
                var receiver = orderData[i];
                var name = receiver_str === 'attendee' ? receiver.collectInfo.name : receiver.buyer.name;
                var email = receiver_str === 'attendee' ? receiver.collectInfo.email : receiver.buyer.email;
                var attendeeId = receiver_str === 'attendee' ? receiver.codeObj.attendeeId : '';
                var orderNum = receiver_str === 'attendee' ? receiver.codeObj.orderNumber : '';

                // 获取电子票链接地址
                var ticketLink = '';
                if(receiver_str === 'attendee' && content.includes('#电子票#')){
                    ticketLink = await Order.getTicketShortUrl(orderNum,attendeeId,false);
                    if(!_.isEmpty(ticketLink) && !_.isUndefined(ticketLink)){
                        ticketLink = ' '+ticketLink+' ';
                    }else{
                        ticketLink = '';
                    }
                }
                // logger.debug('ticketLink: '+ticketLink);
                var dive_content = content.replace(/#姓名#/g,name).replace(/#邮箱#/g,email)
                    .replace(/#签到码#/g,attendeeId).replace(/#电子票#/g,ticketLink).replace(/#活动链接#/g,eventLink);

                var receiver_obj = {
                    receiver     : email,
                    receiverName : name,
                    content      : dive_content
                };
                if(category === fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS){    // 短信获取手机号
                    receiver_obj.receiver = receiver_str === 'attendee' ? receiver.collectInfo.mobile : receiver.buyer.mobile;
                }
                // 以下用于模拟测试邮件发送失败
                // var receiver_obj = {
                //     receiver      : receiver_str === 'attendee' ? receiver.collectInfo.mobile : receiver.buyer.mobile,
                //     receiverName  : receiver_str === 'attendee' ? receiver.collectInfo.name : receiver.buyer.name,
                //     content       : content
                // };
                receiver_arr.push(receiver_obj);
            }
        }
        // logger.debug('--- sendRecords: '+JSON.stringify(receiver_arr));
        // 保存 短信邮件发送记录
        var sendRecords = __joiningReceivers(recordObj,receiver_arr, isSplitRecord);
        for(var i=0; i<sendRecords.length; i++){
            await Notice.saveSmsEmailRecord(sendRecords[i]);
        }
        // 发送邮件或短信
        await __sendEmailSmsRecord(recordObj.id, category);
    } catch (err) {
        logger.error('__sendRecord', err);
        // return 'fail';
    }
}

// ****** 发送邮件或短信 ******
async function __sendEmailSmsRecord(recordId, category) {
    try {
        var sendRecords = await Notice.getSendRecordByRecordId(recordId);
        var recordInfo = await Notice.getRecord(recordId);
        if(category === fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS){ // 发送短信
            for(var i=0; i<sendRecords.length; i++){
                // logger.debug('sendRecords'+i+": "+JSON.stringify(sendRecords[i]));
                var sendRecord = sendRecords[i];
                var sentRet = await ym.sendSMSRecord(sendRecord);
                var rdjResult  =  sentRet.response.error;
                var sendStatus = '';
                if(rdjResult === "0"){
                    // 艺美接收短信成功
                    if(recordInfo.sendStatus === fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL){
                        // 部分成功
                        sendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_PART_SUCCESS;
                    }else if(recordInfo.sendStatus === fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING){
                        // 发送成功
                        sendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS;
                    }
                }else{
                    // 艺美接收失败
                    if(recordInfo.sendStatus === fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS){
                        // 部分成功
                        sendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_PART_SUCCESS;
                    }else if(recordInfo.sendStatus === fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING){
                        // 发送成功
                        sendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL;
                    }
                    var wdSmsAmount   = sendRecord.sendCount;

                    // 判断短信是否属于扣费
                    if(_.includes([fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_PROMOTION,fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_NOTICEMENT,
                            fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_INFORMS],recordInfo.type)){
                        // 退回短信费用
                        await __deductEMAILSMSCost(recordInfo.id,'',recordInfo.userId,wdSmsAmount,0,0);
                    }
                }
                if(!_.isEmpty(sendStatus)){
                    var setParams = {
                        id         : sendRecord.id,
                        recordId   : sendRecord.recordId,
                        sendStatus : sendStatus,
                        describe   : sentRet.response.message
                    };
                    // 修改记录及发送记录状态
                    var data = await Notice.reqApiBatchUpdate(setParams,false,true);
                }
            }
        }else { // 发送邮件
            for(var i=0; i<sendRecords.length; i++){
                var sentRet = await sc.sendEmailRecord(sendRecords[i]);
                var sendStatus = '';
                var rdj = JSON.parse(sentRet);
                if(rdj.result === true){   // sendCloud 接收成功
                    if(recordInfo.sendStatus === fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL){
                        // 部分成功
                        sendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_PART_SUCCESS;
                    }else if(recordInfo.sendStatus === fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING){
                        // 发送成功
                        sendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS;
                    }
                }else { // sendCloud 接收失败
                    if(recordInfo.sendStatus === fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS){
                        // 部分成功
                        sendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS;
                    }else if(recordInfo.sendStatus === fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING){
                        // 发送成功
                        sendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL;
                    }
                    // sendCloud 接收失败 判断短信是否属于扣费
                    if(_.includes([fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_PROMOTION, fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_NOTICEMENT,
                            fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_INFORMS],recordInfo.type)){
                        // 原记录中各帐户扣除数量
                        var wdEmailAmount = 0;
                        var edEmailAmount = 0;
                        var sendCount = sendRecords[i].sendCount;
                        if((recordInfo.walletDeductEmail - sendCount) >= 0){
                            wdEmailAmount = sendCount;
                        }else{
                            wdEmailAmount = recordInfo.walletDeductEmail;
                            edEmailAmount = sendCount - recordInfo.walletDeductEmail;
                        }
                        // 退回邮件费用
                        await __deductEMAILSMSCost(recordInfo.id,recordInfo.eventId,recordInfo.userId,0,wdEmailAmount,edEmailAmount);
                    }
                }
                if(!_.isEmpty(sendStatus)){
                    var setParams = {
                        id         : sendRecords[i].id,
                        recordId   : sendRecords[i].recordId,
                        sendStatus : sendStatus,
                        describe   : rdj.message
                    };
                    // 修改记录及发送记录状态
                    var data = await Notice.reqApiBatchUpdate(setParams,false,true);
                }
            }
        }
    } catch (err) {
        logger.error('__sendEmailSmsRecord', err);
    }
};



// ****** 拼接短信邮件发送记录 ******
function __joiningReceivers(record,receiver_arr, isSplitRecord){
    // logger.debug('receiver_arr: '+JSON.stringify(receiver_arr));
    var recordParams = {
        title     : record.title,
        attachment: record.attachment,
        from    : record.from,
        fromName: record.fromName,
        replyTo : record.replyTo,
        type    : record.category,
        userId  : record.userId,
        eventId : record.eventId,
        recordId: record.id
    };
    // 准备需要插入数据库的数据
    var purenessReq = myutil.getPurenessRequsetFields(recordParams, Notice.SmsEmailSendRecordFields);
    var sendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING;
    var sendRecords = [];
    // 只有通知类型的短信才会有根据内容是所包含的标识拆分记录
    if(isSplitRecord === true){
        for(var i=0; i<receiver_arr.length; i++){
            var sendRecord = JSON.parse(JSON.stringify(purenessReq));
            var receivers = [{
                receiver      : receiver_arr[i].receiver,
                receiverName  : receiver_arr[i].receiverName,
                sendStatus    : sendStatus
            }];
            var content = receiver_arr[i].content;
            sendRecord.receivers = receivers;
            sendRecord.content   = content;
            sendRecord.sendCount = __getSMSContentHaveNum(content.length);

            sendRecords.push(sendRecord);
        }
    }else{
        purenessReq.content = record.content;
        if(record.category === fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS){
            var batchNum = 200;
            // 短信批量发送一次最多不超过200人
            var havSendNum = (receiver_arr.length % batchNum) > 0 ? parseInt(receiver_arr.length / batchNum) + 1 : parseInt(receiver_arr.length / batchNum);
            for(var i = 0; i < havSendNum; i++){
                var receivers_arr = receiver_arr.slice(i * batchNum,(i+1) * batchNum);
                var sendRecord = __joiningReceiver(receivers_arr, purenessReq, sendStatus);
                sendRecords.push(sendRecord);
            }
        }else{
            var sendRecord = __joiningReceiver(receiver_arr, purenessReq,sendStatus);
            sendRecords.push(sendRecord);
        }
    }
    return sendRecords;
}

// 拼接发送邮件短信记录
function __joiningReceiver(receiver_arr, purenessReq, sendStatus){
    var sendRecord = JSON.parse(JSON.stringify(purenessReq));
    var  receivers = _.map(receiver_arr, function(receiver_obj){
        var receiverName = _.isEmpty(receiver_obj.receiverName) ? '' : receiver_obj.receiverName;
        return {
            receiver      : receiver_obj.receiver,
            receiverName  : receiverName,
            sendStatus    : sendStatus
        };
    });
    sendRecord.receivers = receivers;
    var sendCount = purenessReq.type === fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS ? __getSMSContentHaveNum(purenessReq.content.length) * receivers.length : receivers.length;
    sendRecord.sendCount = sendCount;

    return sendRecord;
}

//  ****** 修改邮件短信记录 ******
async function updateRecord (req, res, next){
    var params   = req.body;
    var userId   = req.user.id;
    var recordId  = params.recordId;
    var receivers = params.receivers;
    var eventId   = params.eventId;
    var category  = params.category;
    var content   = params.content;
    var type      = params.type;
    var sendType  = params.sendType;
    params.userId = userId;

    if(_.isUndefined(recordId) || _.isEmpty(recordId) ){
        return next({
            errorCode   : errorCodes.EMAIL_SEND_RECORD_EVENTID_IS_NULL,
            responseText: req.__("Empty", "recordId")
        });
    }
    // 参数校验
    var retCode =  __validateParams(params, req, next);
    if(retCode.errorCode !== '100000'){
        if(retCode.errorCode === '199998'){
            return next({
                errorCode   : errorCodes.EMAIL_SEND_RECORD_EVENTID_IS_NULL,
                responseText: req.__("Empty", retCode.reMsg)
            });
        }else{
            return next({
                errorCode   : retCode.errorCode,
                responseText: req.__("sms_email_error_code_"+retCode.errorCode)
            });
        }
    }
    var recordField = myutil.getPurenessRequsetFields(params, Notice.SmsEmailRecordFields);    // 准备需要插入数据库的数据
    try {
        var oldRecord = await Notice.getRecord(recordId);
        if(oldRecord.isDel === true || oldRecord.sendStatus !== fp.RECORD_SEND_STATUS.SEND_STATUS_TO_BE_SENT){
            // 删除记录及非待发送记录不能进行休息
            return next({
                errorCode   : '140005',
                responseText: req.__("sms_email_error_code_140005")
            })
        }
        if(recordField.isDraft === false){
            recordField.sendStatus = sendType === fp.SEND_TYPE.SEND_TYPE_IMMEDIATELY ? fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING : fp.RECORD_SEND_STATUS.SEND_STATUS_TO_BE_SENT;
        }else{
            recordField.sendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_TO_BE_SENT;
        }
        recordField.updateUserId = userId;
        // 获取当前发送邮件短信数量
        var countRet = await __getSendEmailOrSMSCount(receivers,eventId,category,content,type);
        if(countRet.recode !== '100000'){
            // 获取 标签对应下的参会人或购买者信息 系统错误
            return next({
                errorCode   : countRet.recode,
                responseText: req.__("sms_email_error_code_"+countRet.recode)
            });
        }
        // 发件人总数
        recordField.receiverTotal = countRet.receiverTotal;
        // 发送邮件短信条数
        recordField.sendCount = countRet.recordCount;
        // 原记录中发送条数
        var oldSendCount = oldRecord.sendCount;
        if(oldRecord.isDraft === false){           // 原记录不为草稿
            if(recordField.isDraft === false){     // 现记录不为草稿
                var difference = recordField.sendCount - oldSendCount;
                if(difference > 0){    // 扣费
                    // 校验邮件短信余额
                    var vaResult = await __validateSMSOrEmailLimit(eventId, userId, category, difference);
                    if(vaResult.retCode !== '100000'){
                        // 获取 标签对应下的参会人或购买者信息 系统错误
                        return next({
                            errorCode   : vaResult.retCode,
                            responseText: req.__("sms_email_error_code_"+vaResult.retCode)
                        });
                    };
                    // 扣除短信及邮件费用
                    var retCode = await __deductEMAILSMSCost(oldRecord.id,eventId,userId,vaResult.wdSms,vaResult.wdEmail,vaResult.edEmail);
                    if(retCode === 'fail'){
                        // 修改邮件短信记录失败
                        return next({
                            errorCode   : '140003',
                            responseText: req.__("sms_email_error_code_140003")
                        });
                    }
                    recordField.walletDeductSms   = oldRecord.walletDeductSms   + vaResult.wdSms;
                    recordField.walletDeductEmail = oldRecord.walletDeductEmail + vaResult.wdEmail;
                    recordField.eventDeductEmail  = oldRecord.eventDeductEmail  + vaResult.edEmail;
                }else if(difference < 0){    // 退费
                    var refundWdEmail = 0;
                    var refundEdEmail = 0;
                    var refundWdSms   = 0;
                    if(category === fp.SEND_RECORD_TYPE.RECORD_TYPE_EMAIL){
                        if(oldRecord.walletDeductEmail + difference >= 0){
                            refundWdEmail = 0 - difference;
                        }else{
                            refundWdEmail = oldRecord.walletDeductEmail;
                            refundEdEmail = 0 - (oldRecord.walletDeductEmail + difference);
                        }
                    }else{
                        refundWdSms = 0 - difference;
                    }
                    // 退短信及邮件费用
                    var retCode = await __deductEMAILSMSCost(oldRecord.id,eventId,userId,refundWdSms,refundWdEmail,refundEdEmail);
                    if(retCode === 'fail'){
                        // 修改邮件短信记录失败
                        return next({
                            errorCode   : '140003',
                            responseText: req.__("sms_email_error_code_140003")
                        });
                    }
                    recordField.walletDeductSms   = oldRecord.walletDeductSms   - refundWdSms;
                    recordField.walletDeductEmail = oldRecord.walletDeductEmail - refundWdEmail;
                    recordField.eventDeductEmail  = oldRecord.eventDeductEmail  - refundEdEmail;
                }else{
                    recordField.walletDeductSms   = oldRecord.walletDeductSms;
                    recordField.walletDeductEmail = oldRecord.walletDeductEmail;
                    recordField.eventDeductEmail  = oldRecord.eventDeductEmail;
                }
            }else{     // 现记录为草稿  只退款
                var retCode = await __deductEMAILSMSCost(oldRecord.id,eventId,userId,oldRecord.walletDeductSms,oldRecord.walletDeductEmail,oldRecord.eventDeductEmail);
                if(retCode === 'fail'){
                    // 修改邮件短信记录失败
                    return next({
                        errorCode   : '140003',
                        responseText: req.__("sms_email_error_code_140003")
                    });
                }
            }
        }else{      // 原记录为草稿
            if(recordField.isDraft === false) {     // 现记录不为草稿  只扣款
                // 校验邮件短信余额
                var vaResult = await __validateSMSOrEmailLimit(eventId, userId, category, recordField.sendCount);
                if(vaResult.retCode !== '100000'){
                    // 获取 标签对应下的参会人或购买者信息 系统错误
                    return next({
                        errorCode   : vaResult.retCode,
                        responseText: req.__("sms_email_error_code_"+vaResult.retCode)
                    });
                };
                var wdSmsAmount   = 0 - vaResult.wdSms;
                var wdEmailAmount = 0 - vaResult.wdEmail;
                var edEmailAmount = 0 - vaResult.edEmail;
                // 扣除短信及邮件费用
                var retCode = await __deductEMAILSMSCost(oldRecord.id,eventId,userId,wdSmsAmount,wdEmailAmount,edEmailAmount);
                if(retCode === 'fail'){
                    // 修改邮件短信记录失败
                    return next({
                        errorCode   : '140003',
                        responseText: req.__("sms_email_error_code_140003")
                    });
                }
                recordField.walletDeductSms   = vaResult.wdSms;
                recordField.walletDeductEmail = vaResult.wdEmail;
                recordField.eventDeductEmail  = vaResult.edEmail;
            }
        }
        // 保存邮件短信记录
        var retDate   = await Notice.updateRecord(recordId, recordField);
        // 若为立即发送 则将短信邮件转化成发送记录并发送邮件或短信
        if(!_.isEmpty(retDate)){
            if(retDate.isDraft === false){
                // 若为立即发送 则将短信邮件转化成发送记录并发送邮件或短信
                if(retDate.sendType === fp.SEND_TYPE.SEND_TYPE_IMMEDIATELY){
                    exports.__sendRecord(retDate);
                }else{
                    // 定时发送将邮件或短信放入消息推送中
                    __auditNotice(retDate);
                }
            }
        }else{
            // 修改邮件短信记录失败
            return next({
                errorCode   : '140003',
                responseText: req.__("sms_email_error_code_140003")
            });
        }
        return res.status(200).send(retDate);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 再次发送邮件短信
async function resendRecord(req, res, next) {
    var recordId = req.body.recordId;
    var userId   = req.user.id;
    if(_.isUndefined(recordId) || _.isEmpty(recordId)){
        return next({
            errorCode   : errorCodes.EMAIL_SEND_RECORD_EVENTID_IS_NULL,
            responseText: req.__("Empty", "recordId")
        });
    }
    try {
        var recordInfo   = await Notice.getRecord(recordId);
        if(_.isEmpty(recordInfo) || recordInfo.isDel === true || recordInfo.isDraft === true){
            // 记录不存在
            return next({
                errorCode   : errorCodes.EMAIL_SEND_RECORD_EVENTID_IS_NULL,
                responseText: req.__("NotExists", "recordId")
            });
        }
        if(recordInfo.sendStatus !== fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL){
            // 只有发送失败状态的才允许重发
            return next({
                errorCode   : '150001',
                responseText: req.__("sms_email_error_code_150001")
            });
        };
        // 校验额度是否足够
        var vaResult = await __validateSMSOrEmailLimit(recordInfo.eventId, recordInfo.userId, recordInfo.category, recordInfo.sendCount);
        // logger.debug('vaResult: '+JSON.stringify(vaResult));
        if(vaResult.retCode !== '100000'){
            // 获取 标签对应下的参会人或购买者信息 系统错误
            return next({
                errorCode   : vaResult.retCode,
                responseText: req.__("sms_email_error_code_"+vaResult.retCode)
            });
        };
        // 修改邮件短信记录
        var updateParmas = {
            sendStatus       : fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING,     // 正在发送
            walletDeductSms  : vaResult.wdSms,        // 钱包中须扣除短信条数
            walletDeductEmail: vaResult.wdEmail,      // 钱包中须扣除邮件条数
            eventDeductEmail : vaResult.edEmail,      // 活动中须扣除邮件条数
            updateUserId     : userId
        };
        var updateRet = await Notice.updateRecord(recordId,updateParmas);
        if(_.isEmpty(updateRet)){
            // 重发邮件短信失败
            return next({
                errorCode   : '150000',
                responseText: req.__("sms_email_error_code_150000")
            });
        }
        // 扣费
        var retCode = await __deductEMAILSMSCost(recordId,recordInfo.eventId,recordInfo.userId,-vaResult.wdSms,-vaResult.wdEmail,-vaResult.edEmail);
        if(retCode === 'success'){
            // 发送邮件或短信
            await __sendEmailSmsRecord(recordId, recordInfo.category);
        }else{
            // 重发邮件短信失败
            return next({
                errorCode   : '150000',
                responseText: req.__("sms_email_error_code_150000")
            });
        }
        return res.status(200).send(updateRet);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// ****** 根据Id获取邮件短信记录 ******
async function delRecord(req, res, next) {
    var params   = req.body;
    var userId   = req.user.id;
    var recordId = params.recordId;

    if(_.isUndefined(recordId) || _.isEmpty(recordId)){
        return next({
            errorCode   : errorCodes.EMAIL_SEND_RECORD_EVENTID_IS_NULL,
            responseText: req.__("Empty", "recordId")
        });
    }
    try {
        var recordInfo   = await Notice.getRecord(recordId);
        if(_.isEmpty(recordInfo)){
            // 该记录不存在
            return next({
                errorCode   : errorCodes.EMAIL_SEND_RECORD_EVENTID_IS_NULL,
                responseText: req.__("NotExists","recordId")
            });
        }
        if(recordInfo.isDel === true){
            // 已被删除
            return next({
                errorCode   : '140001',
                responseText: req.__("sms_email_error_code_140001")
            });
        }
        if(recordInfo.isDraft === false){
            // 非草稿先判断是否已发送
            if(recordInfo.sendStatus !== fp.RECORD_SEND_STATUS.SEND_STATUS_TO_BE_SENT){
                // 该记录不允许删除
                return next({
                    errorCode   : '140000',
                    responseText: req.__("sms_email_error_code_140000")
                });
            }
        };
        // 先删除记录 再退回 邮件及短信额度
        var isDelete = true;
        if(recordInfo.isDraft === false){ // 若为非草稿记录退回短信及邮件费用
            var retCode = await __deductEMAILSMSCost(recordId,recordInfo.eventId,userId,recordInfo.walletDeductSms,recordInfo.walletDeductEmail,recordInfo.eventDeductEmail);
            if(retCode === 'fail'){
                isDelete = false;
            }
        }
        if(isDelete === true){
            var retData = await Notice.delRecord(recordId,recordInfo.isDraft,userId);
        }else{
            return next({
                errorCode   : '140004',
                responseText: req.__("sms_email_error_code_140004")
            });
        }
        return res.status(200).send(retData);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// sendCloud 邮件回调接听
async function sendCloudCallbackListener(req, res) {
    var params      = req.body;
    try {
        // logger.debug('sendCloudCallbackListener params: '+JSON.stringify(params));
        var event       = params.event;              // 事件类型:"deliver"
        var message     = params.message;            // 消息内容
        var recipient   = params.recipient;          // 收信人
        var userHeaders = params.userHeaders;        // 用户自定义, 并且以"SC-Custom-"开头的头部信息

        // var apiUser           = params.apiUser;            // API_USER
        // var timestamp         = params.timestamp;          // 时间戳
        // var token             = params.token;              // 随机产生的长度为50的字符串
        // var signature         = params.signature;          // 签名字符串

        // logger.debug("--userHeaders--: "+userHeaders);
        var sendStatus    = (event === "deliver") ? fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS : fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL;
        var recordId_Str  = userHeaders.replace("SC-Custom-", "");
        var sendRecordIds = JSON.parse(recordId_Str).id;      // 获取短信邮件发送记录Id
        var params        = {};
        params.id         = sendRecordIds;
        params.recipient  = recipient;
        params.sendStatus = sendStatus;
        params.describe   = message;

        var retData = await Notice.callBackatchUpdate(params);

        // logger.debug("邮件回调接听 retData: "+JSON.stringify(retData));
        return res.status(200).send(200 + "");
    } catch (err) {
        logger.debug("err: " + err);
        return res.status(200).send(200 + "");
    }
}

// ****** 系统发送短信邮件 ******
async function __systemSendRecord(params) {
    var receivers = params.receivers;
    var content   = params.content;
    var type      = params.type;
    var category  = params.category;

    try {
        // 1. 准备需要插入数据库的数据
        var recordField = myutil.getPurenessRequsetFields(params, Notice.SmsEmailRecordFields);
        // 2. 获取当前发送邮件短信数量
        var countRet = await __getSendEmailOrSMSCount(receivers,'',category,content,type);
        if(countRet.recode !== '100000'){
            // 获取发送短信数量失败
            return '150004';
        }
        var sendCount = countRet.recordCount;
        recordField.receiverTotal = countRet.receiverTotal;
        recordField.sendCount     = sendCount;

        // 3. 判断是否须要扣费
        if(category === fp.SEND_RECORD_TYPE.ATTRIBUTE_INFORMS){
            // 系统发送邮件短信记录只有与活动购票相关的短信扣用户额度
            var userId = params.userId;
            if(_.isUndefined(userId) || _.isEmpty(userId)){
                // 用户Id 不存在
                return '150003';
            }
            // 校验 发送邮件或短信额度
            var vaResult = await __validateSMSOrEmailLimit('', userId, category, sendCount);
            // logger.debug('vaResult: '+JSON.stringify(vaResult));
            if(vaResult.retCode !== '100000') {
                // 用户钱包短信余额不足
                return '150002';
            }
            // 各平台扣除邮件短信数量
            recordField.walletDeductSms   = vaResult.wdSms;
            recordField.walletDeductEmail = vaResult.wdEmail;
            recordField.eventDeductEmail  = vaResult.edEmail;
        }
        // 保存邮件短信记录
        var retDate = await Notice.saveRecord(recordField);
        if(!_.isEmpty(retDate)){
            // 扣除短信费用
            if(category === fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS && params.isFree === true){
                var retCode = await __deductEMAILSMSCost(retDate.id,'',userId,retDate.walletDeductSms,0,0);
                if(retCode === 'fail'){
                    // 扣款失败 修改邮件短信记录
                    await Notice.updateRecord(retDate.id,{sendStatus:fp.RECORD_SEND_STATUS.SEND_STATUS_DEDUCT_FAIL});
                    // 扣款失败
                    return '150001';
                }
            }
            // 将邮件短信记录转化成发送记录并发送邮件或短信
            exports.__sendRecord(retDate);
            return '100000';
        }else{
            // 创建邮件短信记录失败
            return '150000';
        }
    } catch (err) {
        logger.error('__systemSendRecord', err);
        return '150000';
    }
}
exports.systemSendRecord = __systemSendRecord;

// 短信回调接听
async function yiMeiCallbackListener(req, res) {
    try {
        var reportXml     = req.body.reportXml;
        var reqParamsJson = {};
        xml2js.parseString(reportXml, {explicitArray: false, ignoreAttrs: true}, function (err, result) {
            reqParamsJson = result;
        });
        var reports = reqParamsJson.reportList.report;
        if(reports instanceof Array){
            for (var i = 0; i < reports.length; i++) {
                var params        = {};
                params.id         = reports[i].seqId;
                params.recipient  = reports[i].mobile;
                params.sendStatus = (reports[i].reportStatus === "0") ? fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS : fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL;
                params.describe   = reports[i].errorCode;
                var retData = await Notice.callBackatchUpdate(params);
            }
        }else {
            var params        = {};
            params.id         = reports.seqId;
            params.recipient  = reports.mobile;
            params.sendStatus = (reports.reportStatus === "0") ? fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS : fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL;
            params.describe   = reports.errorCode;
            var retData = await Notice.callBackatchUpdate(params);
        }
        return res.status(200).send(200 + "");
    } catch (err) {
        logger.debug("err: " + err);
        return res.status(200).send(200 + "");
    }
}

/**
 * 计算 短信内容 将发送多少条短信
 * @param contentLength   短信内容长度
 * @returns {number}
 * @private
 */
function __getSMSContentHaveNum(contentLength) {
    // 计算短信内容实发条数 短信字数超出70个字符(包括标签 "【会鹆】")  按照67个字符计费一条 ,即67+67+...
    var count = 1;
    if (contentLength > 66) {
        count = (contentLength % 67) > 0 ? parseInt(contentLength / 67) + 1 : parseInt(contentLength / 67);
    }
    // logger.debug('count: '+count);
    return count;
}

exports.createExcelFile = function (req, res, opts) {
    var sheets   = [
        {
            name   : "name1",
            info   : ["活动名称:测试活动", "活动名称:", "活动名称:"],
            headers: ["headt1", "headt2", "headt3"],
            data   : [
                // {head1: '1', head2: 'test1', head3: '30'},
                // {head1: '1', head2: 'test1', head3: '30'},
                // {head1: '1', head2: 'test1', head3: '30'}

                // ['1', 'test1', 30],
                // ['2', 'test2', 30],
                // ['3', 'test3', 30]
            ]
        }, {
            name   : "name2",
            info   : ["活动名称:", "活动名称:", "活动名称:"],
            headers: ["head1", "head2", "head3"],
            data   : [
                // ['4', 'test4', 30],
                // ['5', 'test5', 30],
                // ['6', 'test6', 30]
            ]
        }
    ]
    var folderName = 'test';
    var fileName   = myutil.generateVerificationCode(6) + '.xlsx';
    var filePath   = path.join("public/files/", folderName, fileName);

    var downFile   = myutil.createExcel(sheets,filePath);

    return res.status(200).send(downFile);
}

// 创建短信充值订单
exports.addSmsOrder = async function (req, res, next) {
    const body           = req.body;
    const userId         = req.user.id;// 创建此订单的用户id
    const rechargeNumber = body.rechargeNumber;// 充值的条数
    const totalPrice     = body.totalPrice;// 金额

    // 验证规则数组
    const validArr = [
        {fieldName: 'rechargeNumber', type: 'string'},
        {fieldName: 'totalPrice', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        // 根据充值条数和需要的金额进行校验
        let calcPrice = rechargeNumber * fp.SMS_EMAIL_PRICE.SMS_PRICE;
        if (totalPrice != calcPrice) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__("incorrect", "totalPrice")
            });
        }

        const insertOrderData = {
            orderNumber   : myutil.getOrderNum('S'),
            userId        : userId,
            totalPrice    : totalPrice,
            rechargeNumber: rechargeNumber,
            type          : fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS,
        };
        let result            = await Notice.addSmsEmailOrder(insertOrderData);

        return res.status(200).send(result);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

// 创建邮件充值订单
exports.addEmailOrder = async function (req, res, next) {
    const body           = req.body;
    const userId         = req.user.id;// 创建此订单的用户id
    const rechargeNumber = body.rechargeNumber;// 充值的条数
    const totalPrice     = body.totalPrice;// 金额

    // 验证规则数组
    const validArr = [
        {fieldName: 'rechargeNumber', type: 'string'},
        {fieldName: 'totalPrice', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        // 根据充值条数和需要的金额进行校验
        let calcPrice = rechargeNumber * fp.SMS_EMAIL_PRICE.EMAIL_PRICE;
        if (totalPrice != calcPrice) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__("incorrect", "totalPrice")
            });
        }

        const insertOrderData = {
            orderNumber   : myutil.getOrderNum('E'),
            userId        : userId,
            totalPrice    : totalPrice,
            rechargeNumber: rechargeNumber,
            type          : fp.SEND_RECORD_TYPE.RECORD_TYPE_EMAIL,
        };
        let result            = await Notice.addSmsEmailOrder(insertOrderData);

        return res.status(200).send(result);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

// 根据货币单位获取线上支付方式
function __getOnlinePayment(req, orderInfo) {
    var paymentPriceUnit = orderInfo.currencyType;// 活动支持的货币单位

    var onlinePayment = [];

    if (paymentPriceUnit === fp.CURRENCY_NAME.YUAN) {
        onlinePayment = [
            {
                name: 'alipay', str: req.__('onlinePayment_alipay'),
                img : 'https://beecloud.cn/demo/img/icon-ali.png'
            },
            {
                name: 'wechat', str: req.__('onlinePayment_wechat'),
                img : 'https://beecloud.cn/demo/img/icon-wechat.png'
            },
        ];// 人民币线上支付方式
    }

    return onlinePayment;
}

// 准备购买短信邮件订单的支付信息
exports.preparePaySmsEmailOrder = async function (req, res, next) {
    const locale  = req.getLocale();// 获取当前用户的语言zh,en
    const body    = req.body;
    const orderId = body.orderId;

    if (_.isEmpty(orderId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderId")
        });
    }

    try {

        const orderInfo = await Notice.getSmsEmailOrderById(orderId);
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", "orderId")
            });
        }

        if (orderInfo.status === fp.ORDER_STATUS.ORDER_STATUS_PAID) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__('already_paid', 'orderNumber=' + orderInfo.orderNumber),
            });
        }

        // 取出该活动支持的支付方式
        // 组装成对应的数据返回给前端
        const onlinePayment = __getOnlinePayment(req, orderInfo);

        const returnObj = {
            payee               : req.__('payee'),// 收款方
            paymentPurposes     : orderInfo.type + ' - ' + orderInfo.rechargeNumber + req.__('sms_email_recharge'),// 付款用途
            orderNumber         : orderInfo.orderNumber,// 订单号
            totalPrice          : orderInfo.totalPrice,// 订单应付金额
            cTime               : orderInfo.cTime,// 订单创建时间
            paymentPriceUnit    : orderInfo.currencyType,// 货币单位
            paymentPriceUnitSign: orderInfo.paymentPriceUnitSign,// 货币单位符号
            onlinePayment       : onlinePayment,// 线上支付方式
        };

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// 获取短信邮件订单支付结果
exports.getSmsEmailOrderPayResult = async function (req, res, next) {
    const query       = req.query;
    const orderNumber = query.orderNumber;

    if (_.isEmpty(orderNumber)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "orderNumber")
        });
    }

    try {
        // 查询订单详情
        let orderInfo = await Notice.getSmsEmailOrderByOrderNum(orderNumber);
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", "orderNumber")
            });
        }

        // 订单是否支付成功
        orderInfo.isPaySuccess = (orderInfo.status === fp.ORDER_STATUS.ORDER_STATUS_PAID);

        return res.status(200).send(orderInfo);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// 短信邮件订单支付,适用于支付宝和PayPal两种支付方式
exports.paySmsEmailOrder = async function (req, res, next) {
    const body          = req.body;
    const orderNumber   = body.orderNumber;
    const productName   = body.productName;
    const paymentMethod = body.paymentMethod;

    if (_.isEmpty(orderNumber)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'orderNumber')
        });
    }

    if (_.isEmpty(productName)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'productName')
        });
    }

    if (_.isEmpty(paymentMethod)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'paymentMethod')
        });
    }

    try {

        var orderInfo = await Notice.getSmsEmailOrderByOrderNum(orderNumber);
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__('NotExists', 'orderNumber'),
            });
        }

        if (orderInfo.status === fp.ORDER_STATUS.ORDER_STATUS_PAID) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__('already_paid', 'orderNumber=' + orderNumber),
            });
        }

        // 使用支付宝进行支付
        if (fp.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY === paymentMethod) {
            const data = {
                out_trade_no: orderNumber,
                subject     : productName,
                total_fee   : orderInfo.totalPrice,
            };

            res.contentType('text/html');
            return res.send(Alipay.directPayByUser(data));
        }

        // 使用PayPal进行支付
        if (fp.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL === paymentMethod) {
            const data = {
                orderId: orderNumber,
                memo   : productName,
                email  : PayPalConfig.receiver,// PayPal收款账户,这里写成系统的收款账户
                amount : orderInfo.totalPrice,
            };

            const redirectUrl = await PayPal.directPay(data);
            logger.debug('user select paypal method and it will be Redirect to %s', redirectUrl);
            return res.redirect(redirectUrl);
        }

    } catch (e) {
        logger.error(e);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};
