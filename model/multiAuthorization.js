'use strict'

var _              = require('lodash');
var thinky         = require('../util/thinky.js');
var r              = thinky.r;
var type           = thinky.type;
var myutil         = require('../util/util.js');
var nextId         = myutil.nextId;
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const redisClinet  = require('../util/redisUtil').redisClinet;
const REDIS_PREFIX = require('../util/fixParams').REDIS_PREFIX;

var MultiAuthorizationFields = {
    id             : type.string(),
    fromUserId     : type.string().required(),
    toUserId       : type.string().required(),
    isAllEvents    : type.boolean().default(false),
    isAllOperations: type.boolean().default(false),
    events         : [],
    operations     : [],
    routes         : []
};

var MultiAuthorization = thinky.createModel('MultiAuthorization', MultiAuthorizationFields);

MultiAuthorization.ensureIndex('fromUserId');
MultiAuthorization.ensureIndex('toUserId');

exports.MultiAuthorizationModel  = MultiAuthorization;
exports.MultiAuthorizationFields = MultiAuthorizationFields;


var OperationFields = {
    id           : type.string(),
    moduleName   : type.string().required(),
    operationName: type.string().required(),
    routes       : []
};

var Operation = thinky.createModel('Operation', OperationFields);

exports.OperationModel  = Operation;
exports.OperationFields = OperationFields;

var UserPackageFiedls = {
    id             : type.string(),
    //name: type.string(),
    blackListRoutes: []
};

var UserPackage = thinky.createModel('UserPackage', UserPackageFiedls);

exports.UserPackageModel  = UserPackage;
exports.UserPackageFields = UserPackageFiedls;

exports.test = function (multiAuthorizationId) {
    return MultiAuthorization.get(multiAuthorizationId);
};

exports.getMultiAuthorizationById = function (multiAuthorizationId) {
    return MultiAuthorization.get(multiAuthorizationId);
};

exports.addMultiAuthorization = function (multiAuthorization) {
    // 更新时清除缓存
    try {
        redisClinet.delAsync(REDIS_PREFIX.MULTI_AUTHORIZATION + multiAuthorization.fromUserId + `_${multiAuthorization.toUserId}`);
    } catch (e) {
        logger.error(e.message);
    }
    multiAuthorization.id = nextId();
    return MultiAuthorization.save(multiAuthorization);
};

exports.updateMultiAuthorization = function (multiAuthorization) {

    var id = multiAuthorization.id;
    return MultiAuthorization.get(id).update(multiAuthorization);
};

exports.getMultiAuthorizationsByFromUserId = function (fromUserId) {
    return MultiAuthorization.getAll(fromUserId, {index: 'fromUserId'}).run();
}

exports.getMultiAuthorizationsByToUserId = function (toUserId) {
    return MultiAuthorization.getAll(toUserId, {index: 'toUserId'}).run();
}

exports.getMultiAuthorizationsByFromAndToUserId = function (fromUserId, toUserId) {
    return MultiAuthorization.filter({fromUserId: fromUserId, toUserId: toUserId}).run();
}

exports.getAllOperations = function () {
    return Operation;
}

exports.deleteMultiAuthorization = function (multiAuthorization) {
    return multiAuthorization.delete();
};

/**
 * Init vip blackListRoutes cache
 */
async function initBlackListRoutes() {
    logger.info('Loading vip black list...')
    const vipPack = await UserPackage.get('vip');
    redisClinet.del(REDIS_PREFIX.BLACK_ROUTES + 'vip');
    redisClinet.sadd(REDIS_PREFIX.BLACK_ROUTES + 'vip', vipPack.blackListRoutes);
}

initBlackListRoutes();

/**
 * 获取多用户授权配置
 * @param fromUserId 活动所属用户id
 * @param userId 当前登录用户id
 * @returns {}
 * @private
 */
exports.getMultiAuthorization = async function (fromUserId, userId) {
    let ma = {};
    try {

        const MULTI_AUTHORIZATION_KEY = REDIS_PREFIX.MULTI_AUTHORIZATION + fromUserId + `_${userId}`;

        const maString = await redisClinet.get(MULTI_AUTHORIZATION_KEY);
        ma             = JSON.parse(maString);

        if (_.isEmpty(ma)) {
            const mas = await exports.getMultiAuthorizationsByFromAndToUserId(fromUserId, userId);
            if (!_.isEmpty(mas)) {
                ma = mas[0];
                redisClinet.hmsetAsync(MULTI_AUTHORIZATION_KEY, JSON.stringify(ma), 'EX', 1800);
            }
        }

    } catch (err) {
        logger.error('__getMultiAuthorization ', err);
    }

    return ma;
};
