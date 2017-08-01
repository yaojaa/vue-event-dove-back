/**
七牛 Controller
@class qiniuController
@author :lwp
@date:  :2017-07-05
@version : 0.1.0 
*/
const qiniu      = require('qiniu');
const _          = require('lodash');
const settings   = require("../conf/settings");
const errorCodes  = require('../util/errorCodes.js').ErrorCodes;
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;


//定义鉴权对象mac
const mac = new qiniu.auth.digest.Mac(settings.qiniu.accessKey, settings.qiniu.secretKey);

//获取上传token
function getUpToken(req, res, next) {
    const options = {
      scope: settings.qiniu.bucket,
    };
    var putPolicy = new qiniu.rs.PutPolicy(options);
    var uploadToken=putPolicy.uploadToken(mac);

    res.send(uploadToken);

}


exports.getUpToken           = getUpToken;


