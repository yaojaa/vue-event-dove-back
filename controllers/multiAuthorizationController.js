/**
 * Created by Henry on 2017/2/15.
 */
'use strict';

var _ = require('lodash');
var myutil = require('../util/util.js');
var MultiAuthorization = require('../model/multiAuthorization');
var Event = require('../model/event');
var User = require('../model/user');
var errorCodes = require('../util/errorCodes.js').ErrorCodes;
var validator = require('validator');

var MultiAuthorizationModel = MultiAuthorization.MultiAuthorizationModel;
var OperationModel = MultiAuthorization.OperationModel;
var UserPackage = MultiAuthorization.UserPackage;

const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

/**
 * 获得我的授权用户列表
 * @param req
 * @param res
 */
exports.getMyMultiAuthorizationsUsers = function (req, res, next) {
    var userId = req.user.id;
    MultiAuthorization.getMultiAuthorizationsByFromUserId(userId).then(function (result) {
        res.status(200).json(result);
    }).catch(function (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    });
};

/** 获得我的活动列表 */
exports.getMyEvents = function (req, res, next) {
    var userId = req.user.id;
    var eventFields = ["id", "title", "status"];
    Event.getEventsByUserId(userId,eventFields).then(function (result) {
        res.status(200).json(result);
    }).catch(function (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    });
};

/**
 * 获得可授权的操作列表
 * @param req
 * @param res
 */
exports.operations = function (req, res, next) {
    MultiAuthorization.getAllOperations().then(function (result) {
        res.status(200).json(result);
    }).catch(function (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    });
};

/**
 * 根据邮箱check授权用户的状态
 * @param req
 * @param res
 */
exports.checkAuthorizationsUserEmail = function (req, res, next) {
    var email = req.query.email;
    if (_.isEmpty(req.query) || _.isEmpty(req.query.email) || !validator.isEmail(email)) {
        return next({
            statusCode: 400,
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: "Invalid parameter"
        });
    }
    User.findUserByUserEmail(email).then(function (result) {
        if (_.isEmpty(result)) {
            return next({
                statusCode: 200,
                errorCode: errorCodes.MULTI_AUTHORIZATION_USER_NOT_EXSIT,
                responseText: "Account not exsit"
            });
        } else {
            var toUserId = result[0].id;
            MultiAuthorization.getMultiAuthorizationsByFromUserId(req.user.id).then(function (result) {
                if (_.isEmpty(result)) {
                    return next({
                        statusCode: 200,
                        errorCode: errorCodes.COMMON_SUCCESS,
                        responseText: "OK"
                    });
                } else {
                    _(result).forEach(function (item) {
                        if (toUserId === item.toUserId) {
                            return next({
                                statusCode: 200,
                                errorCode: errorCodes.MULTI_AUTHORIZATION_USER_NOT_EXSIT,
                                responseText: "This account has been authorized"
                            });
                        }
                    });
                    return next({
                        statusCode: 200,
                        errorCode: errorCodes.COMMON_SUCCESS,
                        responseText: "OK"
                    });
                }
            });
        }
    }).catch(function (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    });
};

/**
 * 新增MultiAuthorization
 * @param req
 * @param res
 */
exports.addMultiAuthorization = function (req, res, next) {
    /**
     * 1. 检查email是否存在,不存在的添加一个默认账号,同时发送重置密码邮件
     * 2. email如果已经被当前操作者授权过则返回
     * 3. 检查所授权的eventId是否属于当前操作者
     * 4. 请求路径去重
     */
        //TODO shenhaiyang 检查所授权的eventId是否属于当前操作者
    var body = req.body;

    if (_.isEmpty(req.body) || _.isEmpty(body.email) || !validator.isEmail(body.email)) {
        return next({
            statusCode: 400,
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: "Invalid parameter"
        });
    }
    var email = body.email;
    var fromUserId = req.user.id;
    User.findUserByUserEmail(email).then(function (result) {
        if (!_.isEmpty(result)) {
            var toUserId = result[0].id;
            MultiAuthorization.getMultiAuthorizationsByToUserId(toUserId).then(function (authorization) {
                if (!_.isEmpty(authorization)) {
                    return next({
                        statusCode: 200,
                        errorCode: errorCodes.MULTI_AUTHORIZATION_HAS_BEEN_AUTHORIZED,
                        responseText: "This account has been authorized"
                    });
                } else {
                    __addMethod(fromUserId, toUserId, body, res);
                }
            });
        } else {
            var newUser = {email: email, username: email, password: "default"};
            // TODO shenhaiyang 邮件
            User.addUser(newUser).then(function (user) {
                var toUserId = user.id;
                __addMethod(fromUserId, toUserId, body, res, next)
            });
        }
    }).catch(function (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    });
};

function __addMethod(fromUserId, toUserId, record, res, next) {
    //var authorization = new MultiAuthorization.MultiAuthorizationModel();
    var authorization = myutil.getPurenessRequsetFields(record, MultiAuthorization.MultiAuthorizationFields);
    authorization.fromUserId = fromUserId;
    authorization.toUserId = toUserId;
    if (record.isAllEvents) {
        authorization.isAllEvents = true;
    } else {
        authorization.isAllEvents = false;
        authorization.events = record.events;
    }
    if (record.isAllOperations) {
        authorization.isAllOperations = true;
    } else {
        authorization.isAllOperations = false;
        authorization.operations = record.operations;
        authorization.routes = [];
        MultiAuthorization.getAllOperations().then(function (result) {
            _.each(result, function (n) {
                _.each(authorization.operations, function (i) {
                    if (i === n.id) {
                        authorization.routes = authorization.routes.concat(n.routes);
                    }
                })
            })
            authorization.routes = _.union(authorization.routes);
            MultiAuthorization.addMultiAuthorization(authorization).then(function (data) {
                res.status(200).json(data);
            });
        }).catch(function (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        });
    }
}

/**
 * 根据主键Id获得MultiAuthorization详情
 * @param req
 * @param res
 */
exports.getMultiAuthorizationById = function (req, res, next) {
    if (_.isEmpty(req.query) || _.isEmpty(req.query.multiAuthorizationId)) {
        return next({
            statusCode: 400,
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: "Invalid parameter"
        });
    }
    var multiAuthorizationId = req.query.multiAuthorizationId;
    var userId = req.user.id;
    MultiAuthorization.getMultiAuthorizationById(multiAuthorizationId).then(function (result) {
        if (userId === result.fromUserId) {
            res.status(200).json(result);
        } else {
            return next({
                statusCode: 403,
                errorCode: errorCodes.ERR_PERMISSION_DENIED,
                responseText: "Permission denied"
            });
        }
    }).catch(function (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    });
};

/**
 * 更新MultiAuthorization
 * @param req
 * @param res
 */
exports.updateMultiAuthorization = function (req, res, next) {
    /**
     * 0. 检查这个授权是否是我自己的
     * 1. 检查所授权的eventId是否属于当前操作者
     * 2. 请求路径去重
     */
    var body = req.body;
    var multiAuthorizationId = body.id;
    if (_.isEmpty(req.body) || _.isEmpty(multiAuthorizationId)) {
        return next({
            statusCode: 400,
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: "Invalid parameter"
        });
    }

    var userId = req.user.id;

    MultiAuthorization.getMultiAuthorizationById(multiAuthorizationId).then(function (result) {
        if (userId === result.fromUserId) {

            if (body.isAllEvents) {
                result.isAllEvents = true;
            } else {
                result.isAllEvents = false;
                result.events = body.events;
            }
            if (body.isAllOperations) {
                result.isAllOperations = true;
            } else {
                result.isAllOperations = false;
                result.operations = body.operations;
                result.routes = [];
                MultiAuthorization.getAllOperations().then(function (result) {
                    _.each(result, function (n) {
                        _.each(result.operations, function (i) {
                            if (i === n.id) {
                                result.routes = result.routes.concat(n.routes);
                            }
                        })
                    })
                    result.routes = _.union(result.routes);
                    MultiAuthorization.addMultiAuthorization(result).then(function (data) {
                        res.status(200).send();
                    });
                }).catch(function (err) {
                    return next({
                        errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
                    });
                });
            }
        } else {
            return next({
                statusCode: 403,
                errorCode: errorCodes.ERR_PERMISSION_DENIED,
                responseText: "Permission denied"
            });
        }
    }).catch(function (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    });
};

/**
 * 根据主键Id删除MultiAuthorization
 * @param req
 * @param res
 */
exports.deleteMultiAuthorizationById = function (req, res, next) {
    var multiAuthorizationId = req.body.multiAuthorizationId;
    var userId = req.user.id;
    if (_.isEmpty(req.body) || _.isEmpty(multiAuthorizationId)) {
        return next({
            statusCode: 400,
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: "Invalid parameter"
        });
    }
    MultiAuthorization.getMultiAuthorizationById(multiAuthorizationId).then(function (result) {
        if (_.isEmpty(result)) {
            return next({
                statusCode: 404,
                errorCode: errorCodes.ERR_NOT_FOUND,
                responseText: "Content not found"
            });
        } else if (userId === result.fromUserId) {
            MultiAuthorization.deleteMultiAuthorization(result).then(function (result) {
                res.status(200).json(result);
            });
        } else {
            return next({
                statusCode: 403,
                errorCode: errorCodes.ERR_PERMISSION_DENIED,
                responseText: "Permission denied"
            });
        }
    }).catch(function (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    });
}
