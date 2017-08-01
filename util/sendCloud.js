var _          = require('lodash');
var _st        = require("../conf/settings");
var fs         = require('fs');
var Promise    = require('bluebird');
var http       = require('http');
var path       = require('path');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
var errorCodes = require('../util/errorCodes.js').ErrorCodes;
var Notice     = require('../model/notice');
var myutil     = require('./util.js');
var fp         = require('../util/fixParams.js');

/**
 * sendCloud 第三方邮件接口对接 函数
 * @param params          请求参数[{paramName: "param1", paramValue: "value"},...]
 * @param attachments     请求附件[file1Path,file12Path,...]
 * @param url             接口对应地址
 */
function __connectInterface (params, attachments, url) {
    var promise = new Promise(function(resolve, reject) {
        var boundaryKey = Math.random().toString(16);
        var endData = '\r\n----' + boundaryKey + '--';
        var parse_u = require('url').parse(url, true);
        var isHttp  = parse_u.protocol == 'http:';

        var options     = {
            host   : parse_u.hostname,
            port   : parse_u.port || (isHttp ? 80 : 443),
            path   : parse_u.path,
            method : 'POST'
        };
        var req = require(isHttp ? 'http' : 'https').request(options, function (res) {
            var _data = '';
            res.on('data', function (chunk) {
                _data += chunk;
            });
            res.on('end', function () {
                // fn != undefined && fn(_data);
                resolve(_data);
            });
            req.on('error', function(e) {
                logger.debug('problem with request:' + e.message);
                reject(e.message);
            });
        });

        var dataLength = 0;
        var dataArr = new Array();
        for (var i = 0; i < params.length; i++) {
            var dataInfo = "\r\n----" + boundaryKey + "\r\n" + "Content-Disposition: form-data; name=\"" + params[i].paramName + "\"\r\n\r\n" + params[i].paramValue;
            var dataBinary = new Buffer(dataInfo, "utf-8");
            dataLength += dataBinary.length;
            dataArr.push({
                dataInfo: dataInfo
            });
        }
        var files = new Array();
        for (var i = 0; i < attachments.length; i++) {
            // var content = "\r\n----" + boundaryKey + "\r\n" + "Content-Type: application/octet-stream\r\n" + "Content-Disposition: form-data; name=\"" + attachments[i].urlKey + "\"; filename=\"" + path.basename(attachments[i].urlValue) + "\"\r\n" + "Content-Transfer-Encoding: binary\r\n\r\n";
            var content = "\r\n----" + boundaryKey + "\r\n" + "Content-Type: application/octet-stream\r\n" + "Content-Disposition: form-data; name=attachments; filename=\"" + path.basename(attachments[i]) + "\"\r\n" + "Content-Transfer-Encoding: binary\r\n\r\n";
            var contentBinary = new Buffer(content, 'utf-8'); //当编码为ascii时，中文会乱码。
            files.push({
                contentBinary: contentBinary,
                filePath: attachments[i]
            });
        }
        var contentLength = 0;
        for (var i = 0; i < files.length; i++) {
            var filePath = files[i].filePath;
            if (fs.existsSync(filePath)) {
                var stat = fs.statSync(filePath);
                contentLength += stat.size;
            } else {
                contentLength += new Buffer("\r\n", 'utf-8').length;
            }
            contentLength += files[i].contentBinary.length;
        }
        req.setHeader('Content-Type', 'multipart/form-data; boundary=--' + boundaryKey);
        req.setHeader('Content-Length', dataLength + contentLength + Buffer.byteLength(endData));

        // 将参数发出
        for (var i = 0; i < dataArr.length; i++) {
            req.write(dataArr[i].dataInfo);
            //req.write('\r\n')
        }
        var fileindex = 0;
        var doOneFile = function() {
            req.write(files[fileindex].contentBinary);
            var currentFilePath = files[fileindex].filePath;
            if (fs.existsSync(currentFilePath)) {
                var fileStream = fs.createReadStream(currentFilePath);
                fileStream.pipe(req, {end: false});
                fileStream.on('end', function() {
                    fileindex++;
                    if (fileindex == files.length) {
                        req.end(endData);
                    } else {
                        doOneFile();
                    }
                });
            } else {
                req.write("\r\n");
                fileindex++;
                if (fileindex == files.length) {
                    req.end(endData);
                } else {
                    doOneFile();
                }
            }
        };
        if (fileindex == files.length) {
            req.end(endData);
        } else {
            doOneFile();
        }
    });
    return promise;
}

exports.connectInterface = __connectInterface;

/**
 * 普通邮件发送
 * @param params             请求参数[{paramName:"paramValue"},...]
 * @param attachmentPaths    附件地址 attachment1Path;attachment2Path,...
 */
function __publicSend(params,attachmentPaths) {
    var promise = new Promise(function(resolve, reject) {
        var to_arr = JSON.parse(params.xsmtpapi).to;        // 获取发件人信息
        const doSomething = Promise.coroutine(function*() {
            try {
                if(to_arr.length > 100){
                    // 1. 生成地址列表
                    var addAddressResult = yield __addAddress();
                    var arj = JSON.parse(addAddressResult);
                    var arjResult = arj.result;
                    var arjStatusCode = arj.statusCode;
                    // 2. 判断创建是否成功 并获取 address;
                    if(arjResult === true && arjStatusCode === 200){
                        var address = arj.info.data.address;
                        // 3. 添加列表成员
                        var _arrs = _.chunk(to_arr, 1000);
                        var isSuccess = true;
                        for(var i = 0; i < _arrs.length; i++){
                            var members = _arrs[i].join(";");
                            // logger.debug("members: "+members);
                            var addAddressMemberResult = yield __addAddressMember(address,members);
                            // {"result":true,"statusCode":200,"message":"请求成功","info":{"count":2}}
                            var amj = JSON.parse(addAddressMemberResult);
                            var amjResult = amj.result;
                            if(amjResult === false){
                                isSuccess = false;
                                reject(addAddressMemberResult);
                                return;
                            }
                        }
                        if(isSuccess === true){
                            // 4. 发送邮件
                            params.to = address;
                            params.useAddressList = "true";
                            var sendMailResult = yield __sendMail(params,attachmentPaths);
                            // logger.debug("sendMailResult1: "+sendMailResult);
                            resolve(sendMailResult);
                        }
                    }else{
                        reject(addAddressResult);
                    }
                }else{
                    // 4. 发送邮件
                    var sendMailResult = yield __sendMail(params,attachmentPaths);
                    // logger.debug("sendMailResult2: "+sendMailResult, params);
                    resolve(sendMailResult);
                }
            } catch (err) {
                reject(err);
            }
        })();
    });
    return promise;
}

// 普通邮件发送
function __sendMail (params,attachmentPaths) {
    var promise = new Promise(function(resolve, reject) {
        // 1. 组装请求参数
        var paramsData = [];
        paramsData.push({paramName: "apiUser", paramValue: _st.sendCloudApiUrl.apiUser});
        paramsData.push({paramName: "apiKey", paramValue: _st.sendCloudApiUrl.apiKey});
        for (var paramKey in params) {
            var param = {};
            if (params.hasOwnProperty(paramKey)) {
                param.paramName  = paramKey;
                param.paramValue = params[paramKey];

                paramsData.push(param);
            }
        }
        // logger.debug("-----paramsData: -----"+JSON.stringify(paramsData));
        // 2. 组装附件
        var attachments = [];
        if(!_.isEmpty(attachmentPaths)){
            var attachmentPath_Arr =  attachmentPaths.split(";");
            attachments = _.map(attachmentPath_Arr, function (attachmentPath) {
                return attachmentPath;
            });
        }
        // logger.debug("attachments: "+JSON.stringify(attachments));
        // 3. 组装接口地址
        var url = _st.sendCloudApiUrl.apiUrl+_st.sendCloudApiUrl.email+_st.sendCloudApiUrl.publicSend;
        // 4. 调取联接 sendCloud 函数 得到返回结果
        __connectInterface(paramsData, attachments, url).then(function (data) {
            //logger.debug("data1: "+data);
            resolve(data);
        }).catch(function(err){      // 异常情况
            reject(err);
        })
    });
    return promise;
}

/**
 * 添加地址列表
 * @private
 */
function __addAddress() {
    var promise = new Promise(function(resolve, reject) {
        var dateTime =  new Date().getTime();
        // 1. 组装请求参数
        var paramsData = [];
        paramsData.push({paramName: "apiUser", paramValue: _st.sendCloudApiUrl.apiUser});
        paramsData.push({paramName: "apiKey", paramValue: _st.sendCloudApiUrl.apiKey});
        paramsData.push({paramName: "address", paramValue: dateTime+"@maillist.sendcloud.org"});
        paramsData.push({paramName: "name", paramValue: dateTime});
        // 2. 组装接口地址
        var url = _st.sendCloudApiUrl.apiUrl+_st.sendCloudApiUrl.address+_st.sendCloudApiUrl.add;
        // 3. 调取联接 sendCloud 函数 得到返回结果
        __connectInterface(paramsData, [], url).then(function (data) {
            logger.debug("data2: "+data);
            resolve(data);
        }).catch(function(err){      // 异常情况
            reject(err);
        })
    });
    return promise;
}

/**
 * 添加列表成员
 * @param address      地址列表的别称地址
 * @param members      需要添加成员的地址, 多个地址用 ; 分隔
 * @param names        地址成员姓名, 多个地址用 ; 分隔
 * @param vars         替换变量, 与 members 一一对应, 变量格式为 {"money":"1000"} , 多个用 ; 分隔
 * @private
 */
function __addAddressMember(addresses,members,names,vars) {
    var promise = new Promise(function(resolve, reject) {
        // logger.debug("address: "+addresses);
        // 1. 组装请求参数
        var paramsData = [];
        paramsData.push({paramName: "apiUser", paramValue: _st.sendCloudApiUrl.apiUser});
        paramsData.push({paramName: "apiKey", paramValue: _st.sendCloudApiUrl.apiKey});
        paramsData.push({paramName: "address", paramValue: addresses});
        paramsData.push({paramName: "members", paramValue: members});

        if(!_.isEmpty(names)){
            paramsData.push({paramName: "names", paramValue: names});
        }
        if(!_.isEmpty(vars)){
            paramsData.push({paramName: "vars", paramValue: vars});
        }
        // 2. 组装接口地址
        var url = _st.sendCloudApiUrl.apiUrl+_st.sendCloudApiUrl.member+_st.sendCloudApiUrl.add;
        // 3. 调取联接 sendCloud 函数 得到返回结果
        __connectInterface(paramsData, [], url).then(function (data) {
            logger.debug("data3: "+data);
            resolve(data);
        }).catch(function(err){      // 异常情况
            reject(err);
        })
    });
    return promise;
}

/**
 * 发送邮件
 * @param saveRecordRet        发送邮件实体
 * @param attachmentPaths      附件地址 多个";"号隔开
 * @private
 */
function __sendEmailRecord (saveRecordRet,attachmentPaths) {
    var promise = new Promise(function(resolve, reject) {
        // 获取邮件收件人状态
        var sendFail = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL;
        var sendSuccess = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS;
        const doSomething = Promise.coroutine(function*() {
            try {
                // 拼接 sendCloud 发送邮件参数
                var paramData = yield __jointSendCloudParams(saveRecordRet);
                // 发送邮件
                // var retData = yield __publicSend(paramData, attachmentPaths);
                var retData = yield __publicSend(paramData, saveRecordRet.attachment);
                // 修改 邮件记录发送结果状态
                var rdj = JSON.parse(retData);
                var rdjResult = rdj.result;
                var rdjMessage = rdj.message;
                var setParams = {
                    id         : saveRecordRet.id,
                    recordId   :  saveRecordRet.recordId,
                    sendStatus : (rdjResult === true) ? sendSuccess : sendFail,
                    describe   : rdjMessage
                };
                // 修改短信邮件发送记录收件人状态
                var data = yield Notice.reqApiBatchUpdate(setParams,true,false);

                resolve(retData);
            } catch (err) {
                reject(errorCodes.ERR_INTERNAL_SERVER+" "+err);     // 邮件类型 邮件标题为空
            }
        })();
    });
    return promise;
}

exports.sendEmailRecord = __sendEmailRecord;

/**
 * 拼接 sendCloud 发送邮件接口 所须参数
 * @param retEmailSendRecord
 * @returns
 * @private
 */
function __jointSendCloudParams(saveRecordRet) {
    var promise = new Promise(function(resolve, reject) {
        var replyTo = saveRecordRet.replyTo;
        var paramData = {};
        paramData.from     = saveRecordRet.from;
        paramData.fromName = saveRecordRet.fromName;
        paramData.replyTo  = _.isEmpty(replyTo) ? "" : replyTo;     // 回复邮件地址
        paramData.subject  = saveRecordRet.title;
        paramData.html     = saveRecordRet.content;
        paramData.headers  = '{"SC-Custom-id":"'+saveRecordRet.id+'"}';
        paramData.xsmtpapi = __jointXsmtpapiParam(saveRecordRet.receivers);
        // logger.debug("paramData: "+JSON.stringify(paramData));
        resolve(paramData);
    });
    return promise;

}

/**
 * 拼接 sendCloud xsmtpapi 参数
 * @param receivers   邮件短信记录model中 收件人数组
 * @private
 */
function __jointXsmtpapiParam(receivers){
    var xsmtpapi = {};
    var to = [];
    _.each(receivers, function (receiver) {
        // var receiverNumber = receiver.receiverNumber;
        var receiverNumber = receiver.receiver;
        to.push(receiverNumber);
    });
    xsmtpapi.to = to;

    return JSON.stringify(xsmtpapi);
}
