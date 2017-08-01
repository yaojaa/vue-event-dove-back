'use strict';

var _          = require('lodash');
var myutil     = require('../util/util.js');
var thinky     = require('../util/thinky.js');
var Event      = require('../model/event');
var Promise    = require('bluebird');
const settings = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
var errorCodes = require('../util/errorCodes.js').ErrorCodes;

exports.addFormFields             = addFormFields;
exports.addFormField              = addFormField;
exports.deleteFormFieldByName     = deleteFormFieldByName;
exports.updateFormField           = updateFormField;
exports.getFormFieldByName        = getFormFieldByName;
exports.getFormFieldListByEventId = getFormFieldListByEventId;

async function addFormFields(req, res, next) {
    const body       = req.body;
    const formFields = body.elments;
    const eventId    = body.eventId;

    if (_.isEmpty(eventId)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'eventId')
        });
    }

    if (_.isEmpty(formFields)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'elments')
        });
    }

    // 验证规则数组
    const validArr = [
        {fieldName: 'itemName', type: 'string'},
        {fieldName: 'displayName', type: 'string'},
        {fieldName: 'fieldType', type: 'string'},
    ];

    try {

        for (let formFieldObj of formFields) {
            myutil.validateCustomObject(req, next, validArr, formFieldObj);
        }

        const eventInfo = await Event.getEventById(eventId, ['collectItems']);
        for (let formFieldObj of formFields) {
            let isCollectItemExist = Event.isCollectItemExist(eventInfo.collectItems, formFieldObj);
            if (isCollectItemExist) {
                let message = req.__('Exists', 'form field name ' + formFieldObj.itemName + ' ');
                return next({
                    errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: message
                });
            }
        }

        let promiseArr = [];
        for (let formFieldObj of formFields) {
            let purenessReq = myutil.getPurenessRequsetFields(formFieldObj, Event.EventFields.collectItems[0]);// 准备需要插入数据库的数据
            promiseArr.push(Event.addFormField(eventId, purenessReq));
        }

        let values = await Promise.all(promiseArr);
        return res.status(200).send(values);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

async function addFormField(req, res, next) {

    const body = req.body;

    if (_.isEmpty(body)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'request')
        });
    }

    // 验证规则数组
    var validArr = [
        {fieldName: 'eventId', type: 'string'},
        {fieldName: 'itemName', type: 'string'},
        {fieldName: 'displayName', type: 'string'},
        {fieldName: 'fieldType', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        let purenessReq        = myutil.getPurenessRequsetFields(body, Event.EventFields.collectItems[0]);// 准备需要插入数据库的数据
        const eventInfo        = await Event.getEventById(body.eventId, ['collectItems']);
        let isCollectItemExist = Event.isCollectItemExist(eventInfo.collectItems, purenessReq);
        if (isCollectItemExist) {
            let message = req.__('Exists', 'form field name ' + purenessReq.itemName + ' ');
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: message
            });
        }

        await Event.addFormField(body.eventId, purenessReq);
        return res.status(200).send(purenessReq);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

function updateFormField(req, res, next) {

    var formField   = req.body;
    var purenessReq = myutil.getPurenessRequsetFields(formField, Event.EventFields.collectItems[0]);// 准备需要插入数据库的数据

    if (_.isEmpty(formField)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'request')
        });
    }

    // 验证规则数组
    var validArr = [
        {fieldName: 'eventId', type: 'string'},
        {fieldName: 'itemName', type: 'string'}
    ];

    const doSomething = Promise.coroutine(function*() {
        try {

            myutil.validateCustomObject(req, next, validArr, formField);

            // 1 根据活动id查询活动是否存在
            var eventAttributeNames = ['id', 'collectItems'];
            var event               = yield Event.getEventById(formField.eventId, eventAttributeNames);

            // 2 根据表单收集项名称查询该收集项是否存在,如果不存在则不能更新
            var itemName       = formField.originItemName || formField.itemName;
            var formFieldIndex = _.findIndex(event.collectItems, {itemName: itemName});
            if (formFieldIndex === -1) {
                var message = req.__('NotExists', 'form field name ' + itemName + ' ');
                return next({
                    errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: message
                });
            }

            // 3 更新表单收集项
            _.each(purenessReq, function (value, key) {
                event.collectItems[formFieldIndex][key] = value;
            });

            // 4 同步到数据库
            var newEvent = yield Event.updateEventById(event.id, {collectItems: event.collectItems});
            return res.status(200).send(newEvent.collectItems[formFieldIndex]);
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

function getFormFieldByName(req, res, next) {
    var eventId  = req.query.eventId;
    var itemName = req.query.itemName;

    if (_.isUndefined(eventId)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'eventId')
        });
    }

    if (_.isUndefined(itemName)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'form field name')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            // 1 根据活动id查询活动是否存在
            var eventAttributeNames = ['id', 'collectItems'];
            var event               = yield Event.getEventById(eventId, eventAttributeNames);

            // 2 查询未删除的自定义表单收集项
            var formFieldDetail = _.find(event.collectItems, {itemName: itemName});
            if (!formFieldDetail) {
                return next({
                    errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'form field')
                });
            }

            return res.status(200).send(formFieldDetail);

        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

function getFormFieldListByEventId(req, res, next) {
    var eventId = req.query.eventId;

    if (_.isUndefined(eventId)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'eventId')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            // 1 根据活动id查询活动是否存在
            var eventAttributeNames = ['id', 'collectItems'];
            var event               = yield Event.getEventById(eventId, eventAttributeNames);

            // 2 查询未删除的自定义表单收集项
            var isDeleted       = false;
            var newFormFieldArr = _.filter(event.collectItems, function (formField) {
                return (formField.isDeleted === isDeleted);
            });

            return res.status(200).send(_.sortBy(newFormFieldArr, 'displayOrder'));

        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

async function deleteFormFieldByName(req, res, next) {

    var formField = req.body;

    if (_.isEmpty(formField)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'request')
        });
    }

    // 验证规则数组
    var validArr = [
        {fieldName: 'eventId', type: 'string'},
        {fieldName: 'itemName', type: 'string'}
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, formField);

        // 1 根据活动id查询活动是否存在
        var eventAttributeNames = ['id', 'collectItems'];
        var event               = await Event.getEventById(formField.eventId, eventAttributeNames);

        // 2 根据门票名称查询门票是否存在,不存在则不能删除
        var itemName       = formField.itemName;
        var formFieldIndex = _.findIndex(event.collectItems, {itemName: itemName});
        if (formFieldIndex === -1) {
            var message = req.__('NotExists', 'form field name ' + itemName + ' ');
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: message
            });
        }

        // 3 更新自定义表单收集项信息
        event.collectItems[formFieldIndex].isDeleted = true;

        // 4 同步到数据库
        var newEvent = await Event.updateEventById(event.id, {collectItems: event.collectItems});
        return res.status(200).send(newEvent.collectItems[formFieldIndex]);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}
