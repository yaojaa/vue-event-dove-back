'use strict';

var _          = require('lodash');
var Wallet     = require('../model/wallet.js');
var myutil     = require('../util/util.js');
var nextId     = myutil.nextId;
var thinky     = require('../util/thinky.js');
var md5        = require('md5');
var Promise    = require('bluebird');
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
var errorCodes = require('../util/errorCodes.js').ErrorCodes;
var fixParams  = require('../util/fixParams.js');
var Event      = require('../model/event');
var Badge      = require('../model/eventBadge');

// 添加胸卡
exports.addBadge = async function (req, res, next) {
    const params = req.body;
    const userId = req.user.id;
    // 验证规则数组
    var validArr = [
        {fieldName: 'badgeName',   type: 'string'},
        {fieldName: 'collectInfo', type: 'string'},
        {fieldName: 'styleId',     type: 'string'},
        {fieldName: 'eventId',     type: 'string'}
    ];
    try {
        // 校验参数
        myutil.validateCustomObject(req, next, validArr, params);
        const badgeName = params.badgeName;
        if(badgeName.length() > 30){
            // 胸卡名称必须小于30个字符
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('event_badge_error_code_100001')
            });
        }
        const eventId = params.eventId;
        // 校验活动是否已创建
        const event = await Event.getEventById(eventId);
        if(_.isUndefined(event) || _.isEmpty(event)){
            // 活动不存在
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", 'event')
            });
        }
        const styleId = params.styleId;
        const style = await Badge.getStyle(styleId);
        if(_.isUndefined(style) || _.isEmpty(style)){
            // 胸卡类型不存在
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('event_badge_error_code_100002')
            });
        }
        params.userId = userId;
        var badgeData = myutil.getPurenessRequsetFields(params, Badge.EventBadgeFields);
        var badgeInfo = await Badge.saveBadge(badgeData);

        return res.status(200).send(badgeInfo);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        });
    }
};

// 修改胸卡
exports.updateBadge = async function (req, res, next) {
    const params = req.body;
    const userId = req.user.id;
    // 验证规则数组
    var validArr = [
        {fieldName: 'badgeName',   type: 'string'},
        {fieldName: 'collectInfo', type: 'string'},
        {fieldName: 'styleId',     type: 'string'},
        {fieldName: 'eventId',     type: 'string'}
    ];
    try {
        // 校验参数
        myutil.validateCustomObject(req, next, validArr, params);
        const badgeId = params.badgeId;
        const badge = await Badge.getBadge(badgeId);
        if(_.isUndefined(badge) || _.isEmpty(badge)){
            // 胸卡不存在
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('event_badge_error_code_100003')
            });
        }
        if(badge.userId !== userId){
            // 无修改该胸卡权限
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('event_badge_error_code_100005')
            });
        }
        const eventId = params.eventId;
        if(badge.eventId !== eventId){
            // 不允许修改所关联的活动
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('event_badge_error_code_100006')
            });
        }
        const badgeName = params.badgeName;
        if(badgeName.length() > 30){
            // 胸卡名称必须小于30个字符
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('event_badge_error_code_100001')
            });
        }
        const styleId = params.styleId;
        const style = await Badge.getStyle(styleId);
        if(_.isUndefined(style) || _.isEmpty(style)){
            // 胸卡类型不存在
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('event_badge_error_code_100002')
            });
        }
        var badgeData = myutil.getPurenessRequsetFields(params, Badge.EventBadgeFields);
        var badgeInfo = await Badge.updateBadge(id, badgeData);

        return res.status(200).send(badgeInfo);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        });
    }
}

// 根据Id获取胸卡
exports.getBadge = async function (req, res, next) {
    const params = req.query;
    const badgeId  = params.badgeId;
    try {
        if(_.isUndefined(badgeId) || _.isEmpty(badgeId)){
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", 'badgeId')
            });
        }
        const badgeInfo = await Badge.getBadge(badgeId);
        return res.status(200).send(badgeInfo[0]);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        });
    }
}

// 根据活动Id获取活动下所有胸卡
exports.getBadges = async function (req, res, next) {
    const params = req.query;
    const eventId  = params.eventId;
    try {
        if(_.isUndefined(eventId) || _.isEmpty(eventId)){
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", 'eventId')
            });
        }
        const badges = await Badge.getAllBadgeWithStyle({'eventId':eventId});

        return res.status(200).send(badges);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        });
    }
}

// 根据Id删除胸卡
exports.delBadge = async function (req, res, next) {
    const params = req.query;
    const badgeId  = params.badgeId;
    try {
        if(_.isUndefined(badgeId) || _.isEmpty(badgeId)){
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", 'badgeId')
            });
        }
        const badgeInfo = await Badge.delBadge(badgeId);
        return res.status(200).send(badgeInfo);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        });
    }
}

// 添加胸卡类型
exports.addStyle = async function (req, res, next) {
    const params = req.body;
    const userId = req.user.id;
    // 验证规则数组
    var validArr = [
        {fieldName: 'styleName',    type: 'string'},
        {fieldName: 'pageSize',     type: 'string'},
        {fieldName: 'badgeWidth',   type: 'string'},
        {fieldName: 'badgeHeight',  type: 'string'},
        {fieldName: 'webSiteStyle', type: 'string'},
        {fieldName: 'badgeStyle',   type: 'string'},
        {fieldName: 'eventId',      type: 'string'}
    ];
    try {
        // 校验参数
        myutil.validateCustomObject(req, next, validArr, params);
        const eventId = params.eventId;
        // 校验活动是否已创建
        const event = await Event.getEventById(eventId);
        if(_.isUndefined(event) || _.isEmpty(event)){
            // 活动不存在
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", 'event')
            });
        }
        params.userId = userId;
        var styleData = myutil.getPurenessRequsetFields(params, Badge.BadgeStyleFields);
        var styleInfo = await Badge.saveStyle(styleData);

        return res.status(200).send(styleInfo);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        });
    }
}

// 修改胸卡类型
exports.updateStyle = async function (req, res, next) {
    const params = req.body;
    const userId = req.user.id;
    // 验证规则数组
    var validArr = [
        {fieldName: 'styleName',    type: 'string'},
        {fieldName: 'pageSize',     type: 'string'},
        {fieldName: 'badgeWidth',   type: 'string'},
        {fieldName: 'badgeHeight',  type: 'string'},
        {fieldName: 'webSiteStyle', type: 'string'},
        {fieldName: 'badgeStyle',   type: 'string'},
        {fieldName: 'eventId',      type: 'string'}
    ];
    try {
        // 校验参数
        myutil.validateCustomObject(req, next, validArr, params);
        const styleId = params.styleId;
        const style = await Badge.getStyle(styleId);
        if(_.isUndefined(style) || _.isEmpty(style)){
            // 胸卡类型不存在
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('event_badge_error_code_100002')
            });
        }
        if(style.userId !== userId){
            // 无修改该胸卡类型权限
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('event_badge_error_code_100005')
            });
        }
        const eventId = params.eventId;
        if(style.eventId !== eventId){
            // 不允许修改所关联的活
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('event_badge_error_code_100006')
            });
        }
        var styleData = myutil.getPurenessRequsetFields(params, Badge.BadgeStyleFields);
        var styleInfo = await Badge.updateStyle(id, styleData);

        return res.status(200).send(styleInfo);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        });
    }
}

// 根据Id获取胸卡类型
exports.getStyle = async function (req, res, next) {
    const params = req.query;
    const styleId  = params.styleId;
    try {
        if(_.isUndefined(styleId) || _.isEmpty(styleId)){
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", 'styleId')
            });
        }
        const styleInfo = await Badge.getStyle(styleId);
        return res.status(200).send(styleInfo);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        });
    }
}

// 根据活动Id获取活动下所有胸卡类型
exports.getStyles = async function (req, res, next) {
    const params = req.query;
    const eventId  = params.eventId;
    try {
        if(_.isUndefined(eventId) || _.isEmpty(eventId) ){
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", 'eventId')
            });
        }
        const styles = await Badge.getAllStyle({'eventId':eventId},['id','styleName']);

        return res.status(200).send(styles);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        });
    }
}

// 根据Id删除胸卡类型
exports.delStyle = async function (req, res, next) {
    const params = req.query;
    const styleId  = params.styleId;
    try {
        if(_.isUndefined(styleId) || _.isEmpty(styleId) ){
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", 'styleId')
            });
        }
        const styleInfo = await Badge.delStyle(styleId);
        return res.status(200).send(styleInfo);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        });
    }
}

