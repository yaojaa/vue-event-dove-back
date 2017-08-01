'use strict';

const _           = require('lodash');
const thinky      = require('../util/thinky.js');
const r           = thinky.r;
const fs          = require('fs');
const fp          = require('../util/fixParams.js');
const myutil      = require('../util/util.js');
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const assert      = require('assert');
const AddressBook = require('../model/addressBook.js');
const Promise     = require('bluebird');
const errorCodes  = require('../util/errorCodes.js').ErrorCodes;

exports.addAddressBook         = addAddressBook;
exports.updateAddressBook      = updateAddressBook;
exports.deleteAddressBook      = deleteAddressBook;
exports.getAddressBookById     = getAddressBookById;
exports.getAddressBookByUserId = getAddressBookByUserId;
exports.getAddressBook         = getAddressBookByParamsWithPageIndex;
exports.batchAddAddressBook    = batchAddAddressBook;


// 添加联系人
function addAddressBook(req, res, next) {
    var body = req.body;
    // 校验必填参数是否为空
    if (!myutil.checkMandatory(["email", "name"], body)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("err_invalid_req_parameters")
        });
    }
    var email         = body.email;
    // 判断email是否存在
    const doSomething = Promise.coroutine(function*() {
        try {
            var count = yield AddressBook.getContactCountByEmail(email);
            if (count <= 0) {
                body.userId     = req.user.id;
                var purenessReq = myutil.getPurenessRequsetFields(body, AddressBook.AddressBookFields);    // 准备需要插入数据库的数据
                var saveRet     = yield AddressBook.addContact(purenessReq);

                res.status(200).send(saveRet);
            } else {
                return next({
                    errorCode   : errorCodes.ADDRESS_BOOK_EMAIL_EXISTS,
                    responseText: req.__("Exists", "email")
                });
            }
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__("err_internal_server")
            });
        }
    })();
}

// 修改联系人
function updateAddressBook(req, res, next) {
    var body = req.body;
    // 校验必填参数是否为空
    if (!myutil.checkMandatory(["id", "email", "name"], body)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("err_invalid_req_parameters")
        });
    }
    var email         = body.email;
    // 判断email是否存在
    const doSomething = Promise.coroutine(function*() {
        try {
            var count = yield AddressBook.getContactCountByEmail(email);
            if (count <= 0) {
                var purenessReq = myutil.getPurenessRequsetFields(body, AddressBook.AddressBookFields);    // 准备需要插入数据库的数据
                var saveRet     = yield AddressBook.updateContactById(id, purenessReq);

                res.status(200).send(saveRet);
            } else {
                return next({
                    errorCode   : errorCodes.ADDRESS_BOOK_EMAIL_EXISTS,
                    responseText: req.__("Exists", "email")
                });
            }
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: req.__("err_internal_server")
            });
        }
    })();
}

// 删除联系人
function deleteAddressBook(req, res, next) {
    var body = req.body;

    if (_.isEmpty(body.id)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "id")
        });
    }
    const doSomething = Promise.coroutine(function*() {
        try {
            yield AddressBook.deleteContactById(id);
            res.status(200).send(200);
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: req.__("err_internal_server")
            });
        }
    })();
}

// 根据Id获取联系人
function getAddressBookById(req, res, next) {
    var query = req.query;
    if (_.isEmpty(query.aid)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "aid")
        });
    }
    const doSomething = Promise.coroutine(function*() {
        try {
            var getRet = yield AddressBook.getContactById(query.aid);
            if (_.isEmpty(getRet)) {
                return next({
                    errorCode   : errorCodes.ADDRESS_BOOK_NOT_EXISTS,
                    responseText: req.__("NotExists", "addressBook")
                });
            }
            res.status(200).send(getRet);
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__("err_internal_server")
            });
        }
    })();
}

// 获取用户下所有联系人
function getAddressBookByUserId(req, res, next) {
    const doSomething = Promise.coroutine(function*() {
        try {
            var getRet = yield AddressBook.getContactById(req.user.id);
            res.status(200).send(getRet);
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__("err_internal_server")
            });
        }
    })();
}

// 根据条件获取联系人 分页
function getAddressBookByParamsWithPageIndex(req, res, next) {
    var params = req.query;
    if (!_.isEmpty(params.search)) {
        params.searchType = myutil.getSearchType(params.search);
    }
    const doSomething = Promise.coroutine(function*() {
        try {
            params.userId = req.user.id;
            // 获取所有关键词下的联系人
            var data      = yield AddressBook.getAllContactByParamsWithPageIndex(params);
            var result    = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);
            return res.status(200).send(result);

        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__("err_internal_server")
            });
        }
    })();
}

// 批量添加联系人
function batchAddAddressBook(req, res, next) {
    var userId = req.user.id;
    var files  = req.files;
    if (_.isEmpty(files.fileValue)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "fileValue")
        });
    }
    var fileValue = files.fileValue;

    // 1. 判断文件大小
    if (fileValue.size > fp.FILE_LIMIT_SIZE.EXCEL_SIZE) {
        return next({
            errorCode   : errorCodes.ADDRESS_BOOK_FILE_SIZE_ERR,
            responseText: req.__("toMuch", fp.FILE_LIMIT_SIZE.EXCEL_SIZE + " 字节")
        });
    }
    ;
    // 2. 判断文件格式
    var isFORMAT = myutil.validateUploadFileFormat(fileValue);
    if (isFORMAT === false) {
        return next({
            errorCode   : errorCodes.ADDRESS_BOOK_FILE_FORMAT_ERR,
            responseText: req.__('not_support_format_file')
        });
    }
    // 读取文件 内容
    fs.readFile(fileValue.path, function (err, fileData) {
        var contactJson = myutil.excelConvertJSON(fileData);
        // 校验 execl 表头
        var isHead      = myutil.validateExcelHead(contactJson, fp.EXCEL_HEADSTR.ADDRESS_BOOK);
        if (isHead === false) {
            return next({
                errorCode   : errorCodes.ADDRESS_BOOK_FILE_FORMAT_ERR,
                responseText: req.__('not_support_format_file')
            });
        }
        const doSomething = Promise.coroutine(function*() {
            try {
                for (var i = 0; i < contactJson.length; i++) {
                    var _contactJson = contactJson[i];
                    var count        = yield AddressBook.getContactCountByEmail(_contactJson.email);
                    if (count <= 0) {
                        _contactJson.userId = userId;
                        var saveRet         = yield AddressBook.addContact(_contactJson);
                    }
                }
                return res.status(200).send(true);
            } catch (err) {
                // logger.debug("err: " + err);
                return next({
                    errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                    responseText: req.__("err_internal_server")
                });
            }
        })();
    });
}
