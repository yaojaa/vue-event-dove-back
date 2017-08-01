"use strict";

var _              = require('lodash');
var r              = require('rethinkdb');
var settings       = require("../conf/settings");
var intformat      = require('biguint-format');
var geohash        = require('ngeohash');
var Paginate       = require('./paginate');
var FlakeId        = require('flake-idgen');
var flakeIdGen     = new FlakeId({datacenter: settings.datacenterId, worker: settings.serverId});
var jwt            = require('jsonwebtoken');
var loggerSettings = require('../logger');
var logger         = loggerSettings.winstonLogger;
var moment         = require('moment');
var JsBarcode      = require('jsbarcode');
var Canvas         = require("canvas");
var QRCode         = require('qrcode');
var Promise        = require('bluebird');
var fs             = require('fs');
var pdf            = require('html-pdf');
var path           = require('path');
var xlsx           = require("xlsx");
var fp             = require('../util/fixParams.js');
var moment         = require('moment');
const hr           = require('../util/httpsRequest.js');
var errorCodes     = require('../util/errorCodes.js').ErrorCodes;

// 生成barcode
exports.getBarcode = function (value, options) {
    var options          = options || {};
    options.width        = options.width || 1;
    options.height       = options.height || 50;
    options.displayValue = options.displayValue || true;
    var canvas           = new Canvas();
    JsBarcode(canvas, value, options);
    return canvas.toDataURL("image/png");
};

// 生成二维码
exports.getQRcode = function (value) {
    return new Promise(function (resolve, reject) {
        QRCode.toString(value, {type: 'svg'}, function (err, svgString) {
            if (err) {
                reject(err.message);
            }
            var substr1 = '<?xml version="1.0" encoding="utf-8"?>';
            svgString   = svgString.replace(substr1, '');
            var substr2 = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
            svgString   = svgString.replace(substr2, '');
            resolve(svgString);
        });
    });
};

/**
 * 返回新组装的对象,如果用户的值是最新的取用户提交的值,如果用户的值没有提交上来取原对象的值
 * 该方法已经废弃,请不要使用了,使用lodash的工具函数_.merge(object, [sources])
 *
 * @param originObject 数据库中的原对象
 * @param newObject 用户提交上来的新对象
 */
exports.createNewObject = function (originObject, newObject) {
    var result = {};
    _.each(originObject, function (value, key) {
        result[key]  = value;
        var newValue = newObject[key];
        if ((!_.isUndefined(newValue)) && (value != newValue)) {
            result[key] = newValue;
        }
    });
    return result;
};

/**
 * 取得请求体中在model中存在的字段进行保留
 *
 * @param originReq controller中的req.body
 * @param modelFields 各个model的xxxFields字段
 * @returns {{}}
 */
exports.getPurenessRequsetFields = function (originReq, modelFields) {

    var newOriginReq   = _.cloneDeep(originReq);
    var reqFieldKeys   = _.keys(newOriginReq);
    var modelFieldKeys = _.keys(modelFields);
    _.remove(reqFieldKeys, function (reqField) {
        return !(modelFieldKeys.indexOf(reqField) > -1);
    });

    var newReqFields = {};
    _.each(reqFieldKeys, function (useFulField) {
        newReqFields[useFulField] = newOriginReq[useFulField];
    });

    return newReqFields;
};

// 检查必须携带的参数，只检查第一层
// 缺少参数则返回false
exports.checkMandatory = function (params, obj) {
    if (_.isArray(params)) {
        var keys = _.keys(obj);

        // params数组必须包含在keys数组里面
        var ret = _.remove(params, function (param) {
            return (keys.indexOf(param) > -1);
        });

        (0 != params.length) ? logger.debug("missing parameters: ", params) : 0;
        return _.isEmpty(params);
    }
    return false;
};

exports.nextId = function () {
    return intformat(flakeIdGen.next(), 'dec');
};

exports.handleError = function (res) {
    return function (error) {
        logger.error(error.message);
        return res.send(400, {error: error.message});
    };
};

exports.error_resp = function (err, res) {
    if (!err.errors) {
        logger.error(err.message);
        return res.status(err.code).send({errorCode: err.errorCode, responseText: err.message});
    }
    logger.error(err.errors);
    return res.status(err.code).send({responseTexts: _.map(err.errors, function (e) {return e.message})});
};

/* Validate a request body meets thinky model schema */
exports.validate = function (req, res, Model) {
    try {
        new Model(req.body).validate();
    }
    catch (e) {
        exports.error_resp({code: 400, message: e.message}, res);
        return false;
    }
    return true;
};

exports.parseAddress = function (addrstr) {
    var address = {};
    return {detailed_address: addrstr};
};

exports.parseLocation = function (location) {
    //eg 39.900513,116.327767
    if (!location) return;
    var latlng = location.trim().split(',');
    if (!latlng || latlng.length != 2) return;
    return geohash.encode(parseFloat(latlng[0].trim()), parseFloat(latlng[1].trim())).slice(0, 5);
};

exports.parseOrderBy = function (orderBy) {
    return orderBy[0] != '-' ? {By: orderBy, reverse: false} : {By: orderBy.slice(1), reverse: true};
};

/**
 * 获取订单号: DD+日期+毫秒时间戳后六位+随机数4位
 * @returns {string}
 */
exports.getOrderNum = function (prefixParam) {

    var prefix = prefixParam || 'DD';

    var date = moment().format('YYYYMMDD');

    var timestamp    = (_.now()).toString();
    var subTimestamp = timestamp.substring(timestamp.length - 6);

    var random = exports.generateVerificationCode(4);

    return prefix + date + subTimestamp + random;
};

/**
 * 分页返回封装
 * @param location
 * @returns {string}
 */
exports.getPaginate = function (page, limit, count, items) {
    var page     = parseInt(page) || 1;// 第几页
    var limit    = parseInt(limit) || 10;// 每页显示记录数
    var paginate = new Paginate(page, limit, count, items);
    return paginate;
};

exports.generateVerificationCode = function (len, charType) {
    len        = len || 6;
    charType   = charType || 'number';
    var chars1 = 'ABCDEFGHJKMNPQRSTUVWXYabcdefghjkmnpqrstuvwxy';
    var chars2 = '0123456789';
    var chars  = charType === 'string' ? chars1 : chars2;
    var maxPos = chars.length;
    var str    = '';
    for (var i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return str;
};

exports.ccap = function () {

    var ccap = require('ccap')({
        width   : 100,
        height  : 40,
        offset  : 23,
        fontsize: 35,
        generate: function () {
            return exports.generateVerificationCode(4);
        }
    });

    return ccap.get();
};

exports.svgCaptcha = function (options) {

    var svgCaptcha = require('svg-captcha');

    var captcha = svgCaptcha.create(options);

    return captcha;
};

exports.checkCaptcha = function (req) {
    if (_.isEmpty(req.body.token)) {
        return false;
    }

    if (_.isEmpty(req.body.sessionId)) {
        return false;
    }

    if (_.isEmpty(req.body.captcha)) {
        return false;
    }

    if (req.body.captcha === settings.testVerify.captcha) {
        return true;
    }

    try {
        var verifyCode       = jwt.verify(req.body.token, settings.secret);
        var isEqualSessionId = verifyCode.sessionId == req.body.sessionId;
        var isEqualCaptcha   = verifyCode.captcha.toLowerCase() == req.body.captcha.toLowerCase();
        if (!isEqualSessionId || !isEqualCaptcha) {
            return false;
        }

        return true;
    } catch (err) {
        return false;
    }
};

exports.checkVerificationCode = function (req) {
    if (_.isEmpty(req.body.token)) {
        return false;
    }

    if (_.isEmpty(req.body.phone)) {
        return false;
    }

    if (_.isEmpty(req.body.verificationCode)) {
        return false;
    }

    if (req.body.verificationCode === settings.testVerify.verificationCode) {
        return true;
    }

    try {
        var verifyCode              = jwt.verify(req.body.token, settings.secret);
        var isEqualPhone            = verifyCode.phone == req.body.phone;
        var isEqualVerificationCode = verifyCode.verificationCode == req.body.verificationCode;
        if (!isEqualPhone || !isEqualVerificationCode) {
            return false;
        }

        return true;
    } catch (err) {
        return false;
    }
};

exports.setLocale = function (req, res, next) {
    var locale;
    if (req.headers.locale) {
        locale = req.headers.locale;
    } else if (req.signedCookies[settings.localeCookieName]) {
        locale = req.signedCookies[settings.localeCookieName];
    } else if (req.acceptsLanguages()) {
        locale = req.acceptsLanguages();
    } else {
        locale = 'zhCn';
    }
    if (req.signedCookies[settings.localeCookieName] !== locale) {
        res.cookie(settings.localeCookieName, locale, {
            maxAge: (60 * 60 * 24 * 365) * 1000, signed: true, httpOnly: true
        });
    }
    req.setLocale(locale);
    next();
};

// 验证两个时间间隔是否在有效期
exports.isExpires = function (t1, t2, expires) {
    return (t2 - t1) < expires;
};

exports.inArray = function (search, array) {
    var newArr = _.filter(array, function (value) {
        return value === search;
    });
    return !_.isEmpty(newArr);
};

exports.validType = function (req, next, fieldName, type, value) {
    try {

        switch (type) {
            case 'string':

                if (!_.isString(value)) {
                    throw new Error(req.__('TypeEquality', fieldName, type));
                }

                break;
            case 'number':

                if (!_.isNumber(value)) {
                    throw new Error(req.__('TypeEquality', fieldName, type));

                }

                break;
            case 'boolean':

                if (!_.isBoolean(value)) {
                    throw new Error(req.__('TypeEquality', fieldName, type));
                }

                break;
            case 'array':

                if (!_.isArray(value)) {
                    throw new Error(req.__('TypeEquality', fieldName, type));

                }

                break;
            case 'object':

                if (!_.isObject(value)) {
                    throw new Error(req.__('TypeEquality', fieldName, type));
                }

                break;
            default:
                break;
        }

    } catch (err) {
        throw err;
    }
};

exports.validateCustomObject = function (req, next, validArr, object) {
    try {

        const reqFieldKeyArr = _.keys(object);

        // 数组中是否包含指定字段
        _.each(validArr, function (valid) {

            if (!exports.inArray(valid.fieldName, reqFieldKeyArr)) {
                throw new Error(req.__('NotExists', valid.fieldName));
            }

            if (("" === object[valid.fieldName] ) || (null === object[valid.fieldName])) {
                throw new Error(req.__('Empty', valid.fieldName));
            }

        });

        // 判断字段值是否是指定类型
        _.each(object, function (value, key) {

            // 需要验证的字段
            var toBeValid = _.find(validArr, {fieldName: key});

            if (!_.isEmpty(toBeValid)) {

                exports.validType(req, next, toBeValid.fieldName, toBeValid.type, value);

            }


        });

    } catch (err) {
        throw err;
    }
};

exports.capitalize = function (str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
};

// 使用post方式提交数据请求 支持 http及https 方式
exports.post = function post(url, data, haveFile, fn) {
    data        = data || {};
    var content = require('querystring').stringify(data);
    var parse_u = require('url').parse(url, true);
    var isHttp  = parse_u.protocol == 'http:';

    var contentType = haveFile === true ? 'multipart/form-data' : 'application/x-www-form-urlencoded';
    var options     = {
        host   : parse_u.hostname,
        port   : parse_u.port || (isHttp ? 80 : 443),
        path   : parse_u.path,
        method : 'POST',
        headers: {
            'Content-Type'  : contentType,
            'Content-Length': content.length
        }
    };
    var req         = require(isHttp ? 'http' : 'https').request(options, function (res) {
        var _data = '';
        res.on('data', function (chunk) {
            _data += chunk;
        });
        res.on('end', function () {
            fn != undefined && fn(_data);
        });
    });
    req.write(content);
    req.end();
};

exports.html2pdf = function (html, pdfPath, options) {
    return new Promise(function (resolve, reject) {
        var options    = options || {};
        options.format = options.format || 'A4';

        pdf.create(html, options).toFile(pdfPath, function (err, result) {
            if (err) {
                reject(err.message);
            }
            resolve(result.filename);
        });
    });
};

exports.fsExistsSync = function (filePath) {
    try {
        fs.accessSync(filePath, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
};

exports.getAppDir = function () {
    return path.resolve(__dirname, '..');
};

/**
 * 把一个对象/JSON的首层key装换为数组
 * getKeyArrayFromObject({a:'xxx', b:'yyy'})
 * // => ["a","b"]
 */
exports.getKeyArrayFromObject = function (object) {
    let keyArray = [];
    for (let key in object) {
        keyArray.push(key);
    }
    return keyArray;
};

// 客户端ip
exports.getClientIp = function (req) {
    return (req.ip.match(/\d+.\d+.\d+.\d+/g))[0];
};

/**
 * 只读取 excel 文件 第一张表数据 转 Json
 * @param excelData 上传excel文件内容
 * @returns {*}
 */
exports.excelConvertJSON = function (excelData) {
    var binaryStr = __excelFileConvertBinaryString(excelData);
    // 获取 excel 文件内容
    var workbook  = xlsx.read(binaryStr, {type: "binary"});
    // 获取 xlsx 文件中的第一张表
    var sheetName = workbook.SheetNames[0];
    var excelJson = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    return excelJson;
};
/**
 * excel 文件上传数据 转 二进制符串
 * @param excelData
 * returns
 */
function __excelFileConvertBinaryString(excelData) {
    var dataToArr = new Uint8Array(excelData);
    var newArr    = new Array();

    for (var i = 0; i != dataToArr.length; ++i) newArr[i] = String.fromCharCode(dataToArr[i]);
    var binaryStr = newArr.join("");

    return binaryStr;
}

/**
 * 校验上传文件格式
 * @param fileData        上传文件
 * @returns {boolean}
 */
exports.validateUploadFileFormat = function (fileData) {
    var isPass     = true;
    var fileName   = fileData.name || fileData.path;
    var fileFormat = fileName.substr(fileName.lastIndexOf('.')).toLowerCase();
    var fileFNumb  = fp.ALLOW_UPLOAD_FORMAT.FILE_FORMAT.indexOf(fileFormat + ',');
    if (fileFNumb <= -1) isPass = false;

    return isPass;
}

/**
 * 校验 excel 表单头信息
 * @param excelJson    excel 表单内容Json
 * @param headStr      表单头 格式: 以 "," 隔开
 * @returns {boolean}
 */
exports.validateExcelHead = function (excelJson, headStr) {
    var isPass = true;
    if (Object.keys(excelJson[0]).join(',') !== headStr) {
        isPass = false;
    }
    return isPass;
}

/**
 * 生成 Excel 文件
 * @param sheetArr excel表数据
 * @param filePath 文件的保存路径
 * @returns {string} 文件的保存路径
 */
exports.createExcel = function (sheetArr, filePath) {
    var sheets = __extractSheets(sheetArr);

    // 构建 workbook 对象
    var wb = {SheetNames: [], Sheets: {}};

    for (var i = 0; i < sheets.length; i++) {
        // 拼接 sheet 说明信息
        var infoLength = _.isEmpty(sheets[i].info) ? 0 : sheets[i].info.length;
        var info       = _.isEmpty(sheets[i].info) ? "" : __extractSheetInfo(sheets[i].info);

        // 合并 headers 和 data
        var output = Object.assign({}, info, __extractSheetHeaders(sheets[i].headers, infoLength),
            __extractSheetData(sheets[i].headers, sheets[i].data, infoLength));

        // 获取所有单元格的位置
        var outputPos = Object.keys(output);

        // 计算出范围
        var ref = outputPos[0] + ':' + outputPos[outputPos.length - 1];

        wb.SheetNames.push(sheets[i].name);
        wb.Sheets[sheets[i].name] = Object.assign({}, output, {'!ref': ref});
    }

    var wopts = {bookType: 'xlsx', bookSST: false, type: 'binary'};
    var wbout = xlsx.write(wb, wopts);

    return __saveAs(new Buffer(__wbo2ab(wbout)), filePath);
};

exports.getBankList = () => {return fp.BANK_LIST};

/**
 * 拼接 成 xlsx 所需 Json格式
 * @param sheetArr
 * @returns {*}
 * @private
 */
function __extractSheets(sheetArr) {
    _.each(sheetArr, function (sheet, i) {
        var dataArr = sheet.data;
        _.each(dataArr, function (data, j) {
            var dataObj = {};
            _.each(data, function (dataValues, k) {
                dataObj[sheet.headers[k]] = dataValues;
            });
            dataArr[j] = dataObj;
        });
        sheetArr[i].data = dataArr;
    });

    return sheetArr;
}

/**
 * 将输出文件内容转换为Buffer数组
 * @param workBookOut
 * @returns {ArrayBuffer}
 * @private
 */
function __wbo2ab(wbo) {
    var buf  = new ArrayBuffer(wbo.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i != wbo.length; ++i) view[i] = wbo.charCodeAt(i) & 0xFF;
    return buf;
}

/**
 * 构建表信息的 workbook 对象
 * @param sheetInfo
 * @private
 */
function __extractSheetInfo(sheetInfo) {
    var _sheetInfo = sheetInfo.map(function (v, m) {
        // 拼接内容及对应位置 [{"v":"活动名称:","position":"A1"},{"v":"时间:","position":"A2"},{"v":"地址:","position":"A3"}]
        return Object.assign({}, {v: v, position: "A" + (m + 1)})
    }).reduce(function (prev, next) {
        // 拼接 workbook 形式 {"A1":{"v":"活动名称:"},"A2":{"v":"时间:"},"A3":{"v":"地址:"}}
        return Object.assign({}, prev, {[next.position]: {v: next.v}})
    }, {});

    return _sheetInfo;
}

/**
 * 构建表头的 workbook 对象
 * @param sheetHeaders
 * @param sheetInfoLength  表信息显示条数
 * @private
 */
function __extractSheetHeaders(sheetHeaders, sheetInfoLength) {
    var _sheetHeaders = sheetHeaders.map(function (v, m) {
        return Object.assign({}, {v: v, position: String.fromCharCode(65 + m) + (sheetInfoLength + 1)});
    }).reduce(function (prev, next) {
        return Object.assign({}, prev, {[next.position]: {v: next.v}});
    }, {});

    return _sheetHeaders;
}

/**
 * 构建表内容的 workbook 对象
 * @param sheetHeaders       表头内容
 * @param sheetData
 * @param sheetInfoLength    表信息显示条数
 * @private
 */
function __extractSheetData(sheetHeaders, sheetData, sheetInfoLength) {
    if (!_.isEmpty(sheetData)) {
        var _sheetData = sheetData.map(function (v, m) {
            return sheetHeaders.map(function (k, n) {
                return Object.assign({}, {v: v[k], position: String.fromCharCode(65 + n) + (sheetInfoLength + m + 2)});
            })
        }).reduce(function (prev, next) {
            return prev.concat(next);
        }).reduce(function (prev, next) {
            return Object.assign({}, prev, {[next.position]: {v: next.v}});
        }, {});
    }

    return _sheetData;
}

/**
 * 保存文件到指定路径
 * @param fileData 文件内容
 * @param filePath 文件的保存路径
 * @returns {string} 文件的保存路径
 * @private
 */
function __saveAs(fileData, filePath) {

    var dirPath = path.dirname(filePath);
    // 目录不存在则创建
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);

    // 保存文件
    fs.writeFile(filePath, fileData, function (err) {
        if (err) {
            logger.error('__saveAs保存文件时出错了...报错信息如下');
            logger.error(err);
        }
    });

    return filePath;
}

// 处理对象中的元素的时间
function __dealObjectTime(object) {
    var newObject = _.cloneDeep(object);
    _.each(newObject, function (value, key) {

        if (_.isArray(value)) {
            newObject[key] = __dealArrayTime(value);
        }

        if (_.isObject(value)) {
            newObject[key] = __dealObjectTime(value);
        }

        if (_.isString(value)) {
            newObject[key] = __dealStringTime(value);
        }

    });
    return newObject;
}
exports.dealObjectTime = __dealObjectTime;

// 处理数组中元素的时间
function __dealArrayTime(arr) {
    var newArr = _.cloneDeep(arr);
    _.each(newArr, function (value, key) {

        if (_.isArray(value)) {
            newArr[key] = __dealArrayTime(value);
        }

        if (_.isObject(value)) {
            newArr[key] = __dealObjectTime(value);
        }

        if (_.isString(value)) {
            newArr[key] = __dealStringTime(value);
        }

    });
    return newArr;
}
exports.dealArrayTime = __dealArrayTime;

// 将字符串转换成GMT时间
function __dealStringTime(str) {
    let newStr = _.cloneDeep(str);
    try {
        let isValidLength = (str.length >= 8);
        let isValidTime   = moment(newStr).isValid();
        if (isValidLength && isValidTime) {
            return new Date(newStr);
        }
    } catch (err) {
        logger.error('工具函数__dealStringTime转换时间时出错了,不过这都不是事...', err);
    }
    return newStr;
}
exports.dealStringTime = __dealStringTime;

// 生成不重复的折扣码
exports.GenNonDuplicateID = function (randomLength) {
    var randomLength = randomLength || 8;
    return Number(Math.random().toString().substr(3, randomLength) + Date.now()).toString(36)
};

function __getFileLength(filePath) {
    var stats = fs.statSync(filePath);
    return stats.size;
}

// 检测文件是否写入完成
async function waitForWirtenCompleted(filePath) {
    if (!fs.existsSync(filePath)) {
        return false;
    }

    var oldLength = __getFileLength(filePath);

    await Promise.delay(200);

    if (oldLength != (__getFileLength(filePath))) {
        return false;
    }

    return true;
}

exports.waitForWirtenCompleted = waitForWirtenCompleted;

// 获取两个时间相差的毫秒数
exports.getDiffMilliseconds = function (endTime, startTime) {
    startTime = moment(startTime) || moment();
    endTime   = moment(endTime);
    return endTime.diff(startTime);// 相差毫秒数
};

// 获取两个时间相差的天数
exports.getDiffDays = function (endTime, startTime) {
    startTime = moment(startTime) || moment();
    endTime   = moment(endTime);
    return endTime.diff(startTime, 'day');// 相差毫秒数
};

exports.mkdirs = {
    // 异步创建，无法保证先后执行回调的顺序
    async: function (dirname, callback) {
        fs.exists(dirname, function (exists) {
            if (exists) {
                callback();
            } else {
                exports.mkdirs.async(path.dirname(dirname), function () {
                    fs.mkdir(dirname, callback);
                });
            }
        });
    },
    // 同步创建，可保证顺序
    sync : function (dirname) {
        if (fs.existsSync(dirname)) {
            return true;
        } else {
            if (exports.mkdirs.sync(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
    }
};

function __removeEmptyArray(arr) {
    const clonedArr = _.cloneDeep(arr);
    let newArr      = [];

    for (let key = 0, length = clonedArr.length; key < length; key++) {
        let value = clonedArr[key];

        if (_.isNull(value)) {
            continue;
        }

        if (_.isString(value)) {
            newArr[key] = value;
            continue;
        }

        if (_.isBoolean(value)) {
            newArr[key] = value;
            continue;
        }

        if (_.isNumber(value)) {
            newArr[key] = value;
            continue;
        }

        if (_.isDate(value)) {
            newArr[key] = value;
            continue;
        }

        if (_.isArray(value)) {
            newArr[key] = __removeEmptyArray(value);
            continue;
        }

        if (_.isObject(value)) {
            newArr[key] = __deepRemove(value);
        }

    }
    return newArr;
}

function __deepRemove(object) {
    const clonedObject = _.cloneDeep(object);
    let newObject      = {};

    for (let key in clonedObject) {
        let value = clonedObject[key];

        if (_.isNull(value)) {
            continue;
        }

        if (_.isString(value)) {
            newObject[key] = value;
            continue;
        }

        if (_.isBoolean(value)) {
            newObject[key] = value;
            continue;
        }

        if (_.isNumber(value)) {
            newObject[key] = value;
            continue;
        }

        if (_.isDate(value)) {
            newObject[key] = value;
            continue;
        }

        if (_.isArray(value)) {
            newObject[key] = __removeEmptyArray(value);
            continue;
        }

        if (_.isObject(value)) {
            newObject[key] = __deepRemove(value);
        }

    }

    return newObject;
}

exports.deepRemove = __deepRemove;

// 获取短链接
// 备注: conversionUrl: 数组 isNeedProtocol: true/false
exports.getShortUrl = async function (conversionUrl, isNeedProtocol) {
    try {
        if (conversionUrl.length > 20) {
            logger.error('需要转换的长链接最多不超过20个');
            return false;
        }
        var source   = '137763672';
        var shorten  = 'https://api.weibo.com/2/short_url/shorten.json';
        var url_long = '&url_long=';
        for (var i = 0; i < conversionUrl.length; i++) {
            url_long += conversionUrl[i]
            if (i !== conversionUrl.length - 1) {
                url_long += '&url_long=';
            }
        }
        var joinSinaUrl = shorten + '?' + 'source=' + source + url_long;
        var result      = await hr.htts_get(joinSinaUrl);
        var sinaRet     = JSON.parse(result);
        var shortUrls   = _.map(sinaRet.urls, function (url) {
            var short = isNeedProtocol === true ? url.url_short.replace(/http:\/\//g, '') : url.url_short;
            var long  = url.url_long;
            return {short: short, long: long}
        });
        // logger.debug('shortUrls: '+JSON.stringify(shortUrls));
        return shortUrls;
    } catch (e) {
        logger.error('utils.js中getShortUrl()异常: ' + e.message);
        return false;
    }
};

// 获取二维码内容
exports.getCodeContent = function (codeObj) {
    return JSON.stringify(codeObj);
};

// 生成参会者id
exports.generateAttendeeId = function () {
    var myAid = exports.nextId();
    return myAid.substring(myAid.length - 6);
};


//转义 html
exports.escape2Html = function (str) {
    var arrEntities = {'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"'};
    return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function (all, t) {return arrEntities[t];});
};

// 获取搜索类型
// 正则参考地址,https://www.npmjs.com/package/validator
const emailPattern = /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}/;// 邮箱
const mobilePattern =/(13\d|14[57]|15[^4,\D]|17[678]|18\d)\d{8}|170[059]\d{7}/;// 手机号

let isEmail = function(val){
    return  emailPattern.test(val)
}
let isMobile =  function(val){
    return  mobilePattern.test(val)
}

exports.isEmail = isEmail
exports.isMobile = isMobile

exports.getSearchType = function (search) {
    var searchType = '';

    if (_.isEmpty(search)) {
        return searchType;
    }

    if (isEmail(search)) {
        return searchType = 'email';
    }

    if (isMobile(search)) {
        return searchType = 'mobile';
    }

    var orderNumberPattern = /^DD\d{18}/;// 订单号
    if (orderNumberPattern.test(search)) {
        return searchType = 'orderNumber';
    }

    var namePattern = /([a-zA-Z]|[0-9]|[^\x00-\xff]){1,8}/i;// 购票人
    if (namePattern.test(search)) {
        searchType = 'name';
    }

    var discountCodePattern = /([a-zA-Z]|[0-9]){10,}/i;// 优惠码
    if (discountCodePattern.test(search)) {
        searchType = 'discountCode';
    }

    return searchType;
};
