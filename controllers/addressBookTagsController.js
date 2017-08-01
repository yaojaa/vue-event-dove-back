'use strict';

var _         = require('lodash');
var thinky    = require('../util/thinky.js');
var r         = thinky.r;
var type      = thinky.type;
var myutil     = require('../util/util.js');
var nextId    = myutil.nextId;
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
var assert    = require('assert');
var AddressBook     = require('../model/addressBook.js');
var Promise     = require('bluebird');
var errorCodes = require('../util/errorCodes.js').ErrorCodes;

exports.addTag    = addTag;
exports.getAllTag = getTagsByUserId;
exports.updateTag = updateTag;
exports.deleteTag = deleteTagById;
// exports.getAddressBook    = getAddressBookByParamsWithPageIndex;


// 添加标签
function addTag(req, res, next) {
    var params = req.body;
    var userId = req.user.id;
    if(_.isEmpty(params.tagName)){
        return next({
            errorCode: errorCodes.ADDRESS_BOOK_TAGNAME_IS_NULL,
            responseText: req.__("Empty","tagName")
        });
    }
    const doSomething = Promise.coroutine(function*() {
        try {
            // 判断tagName是否存在
            var count = yield AddressBook.getTagCountByName(params.tagName,req.user.id);
            if(count <= 0){
                var jointParams = {
                    name  : params.tagName,
                    userId: userId
                }
                var saveRet = yield AddressBook.addTag(jointParams);

                res.status(200).send(saveRet);
            }else{
                return next({
                    errorCode: errorCodes.ADDRESS_BOOK_EMAIL_EXISTS,
                    responseText: req.__("Exists","tagName")
                });
            }
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__("err_internal_server")
            });
        }
    })();
}

// 修改标签
function updateTag(req, res, next) {
    var body        = req.body;
    // 校验必填参数是否为空
    if (!myutil.checkMandatory(["id", "tagName"], body)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("err_invalid_req_parameters")
        });
    }
    const doSomething = Promise.coroutine(function*() {
        try {
            // 判断tagName是否存在
            var count = yield AddressBook.getTagCountByName(body.tagName,req.user.id);
            if(count <= 0){
                var saveRet = yield AddressBook.updateTagById(body.id,{name: body.tagName});

                res.status(200).send(saveRet);
            }else{
                return next({
                    errorCode: errorCodes.ADDRESS_BOOK_EMAIL_EXISTS,
                    responseText: req.__("Exists","tagName")
                });
            }
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__("err_internal_server")
            });
        }
    })();
}

// 删除标签
function deleteTagById(req, res, next) {
    var body        = req.body;
    if(_.isEmpty(body.id)){
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty","id")
        });
    }
    const doSomething = Promise.coroutine(function*() {
        try {
             yield AddressBook.deleteTagById(body.id);

             res.status(200).send(200+"");
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: req.__("err_internal_server")
            });
        }
    })();
}

// 获取用户下所有标签
function getTagsByUserId(req, res, next) {
    var params = req.query;
    const doSomething = Promise.coroutine(function*() {
        try {
            params.userId = req.user.id;
            var data = yield AddressBook.getTagByUserId(params);
            for(var i=0; i<data.items.length; i++){
               var count = yield AddressBook.getContactCountByTagName(data.items[i].id);
                data.items[i].contactCount = count;
            }
            var result = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

            res.status(200).send(result);
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__("err_internal_server")
            });
        }
    })();
}
