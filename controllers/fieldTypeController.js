'use strict';

var _              = require('lodash');
var fieldType      = require('../model/collectItems');
var myutil         = require('../util/util.js');
var thinky         = require('../util/thinky.js');
var fieldTypeModel = fieldType.FieldTypeModel;
var validate       = myutil.validate;
var Promise        = require('bluebird');
const settings     = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
var i18n           = require("i18n");
var errorCodes     = require('../util/errorCodes.js').ErrorCodes;

exports.addFieldType                      = addFieldType;
exports.addFieldTypes                     = addFieldTypes;
exports.updateFieldType                   = updateFieldType;
exports.getFieldTypeByIsCustomizableField = getFieldTypeByIsCustomizableField;
exports.getFieldTypeById                  = getFieldTypeById;
exports.getAllFieldType                   = getAllFieldType;

function addFieldTypes(req, res, next) {
    var fieldTypes = req.body;

    if (_.isEmpty(fieldTypes)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'fieldTypes')
        });
    }

    // 验证规则数组
    var validArr = [
        {fieldName: 'fieldType', type: 'string'},
        {fieldName: 'isCustomizableField', type: 'boolean'}
    ];

    const doSomething = Promise.coroutine(function*() {
        try {

            _.each(fieldTypes, function (fieldTypeObj) {
                myutil.validateCustomObject(req, next, validArr, fieldTypeObj);
            });

            var promiseArr = [];
            _.each(fieldTypes, function (fieldTypeObj) {
                var purenessReq = myutil.getPurenessRequsetFields(fieldTypeObj, fieldType.FieldTypeFields);// 准备需要插入数据库的数据
                promiseArr.push(fieldType.addFieldType(purenessReq));
            });

            Promise.all(promiseArr).then(function (values) {
                res.status(200).send(values);
            });

        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

function addFieldType(req, res, next) {
    var p           = req.body;
    var purenessReq = myutil.getPurenessRequsetFields(p, fieldType.FieldTypeFields);// 准备需要插入数据库的数据

    if (_.isEmpty(p)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'request')
        });
    }
    if (!validate(req, res, fieldTypeModel)) {
        return;
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            var newFieldType = yield fieldType.addFieldType(purenessReq);

            res.status(200).send(newFieldType);

        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

function updateFieldType(req, res, next) {
    var p           = req.body;
    var purenessReq = myutil.getPurenessRequsetFields(p, fieldType.FieldTypeFields);// 准备需要插入数据库的数据

    if (_.isEmpty(p)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'request')
        });
    }

    if (!p.id) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            var newFieldType = yield fieldType.updateFieldType(purenessReq);

            res.status(200).send(newFieldType);

        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

function getFieldTypeByIsCustomizableField(req, res, next) {
    var customType = req.params.customType;

    if (_.isUndefined(customType)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'customType')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            var isCustomizingField = (customType === '0');
            var result             = yield fieldType.getFieldTypeByIsCustomizableField(isCustomizingField);
            var newRes             = [];
            _.each(result, function (fieldTypeObj) {

                var i18nKey = "fieldType" + myutil.capitalize(fieldTypeObj.fieldName);
                newRes.push({
                    fieldName  : fieldTypeObj.fieldName,
                    fieldType  : fieldTypeObj.fieldType,
                    displayName: req.__(i18nKey),
                });

            });

            res.status(200).send(newRes);

        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

function getFieldTypeById(req, res, next) {
    var id = req.query.fid;

    if (_.isEmpty(id)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'fieldType id')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            var result = yield fieldType.getFieldTypeById(id);

            res.status(200).send(result);

        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

function getAllFieldType(req, res, next) {
    const doSomething = Promise.coroutine(function*() {
        try {

            var result          = yield fieldType.getAllFieldType();
            var category        = {};
            var inCommonUse     = [];// 系统提供的常用表单收集项的基类
            var createOtherBase = [];// 系统提供的用来创建其他自定义表单收集项的基类
            _.each(result, function (fieldTypeObj) {

                var i18nKey = "fieldType" + myutil.capitalize(fieldTypeObj.fieldName);
                var newObj  = {
                    id         : fieldTypeObj.id,
                    fieldType  : fieldTypeObj.fieldType,
                    displayName: req.__(i18nKey),
                };

                if (fieldTypeObj.isCustomizableField) {
                    createOtherBase.push(newObj);
                } else {
                    inCommonUse.push(newObj);
                }

            });

            category.inCommonUse     = inCommonUse;
            category.createOtherBase = createOtherBase;
            res.status(200).send(category);

        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}
