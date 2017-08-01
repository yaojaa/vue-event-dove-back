const jwt            = require('jsonwebtoken');
const myutil         = require('../util/util.js');
const unless         = require('express-unless');
const async          = require('async');
const _              = require('lodash');
const set            = require('lodash.set');
const errorCodes     = require('../util/errorCodes.js').ErrorCodes;
const Manager        = require('../model/admin/manager');
const Promise        = require('bluebird');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

var DEFAULT_REVOKED_FUNCTION = function (_, __, cb) { return cb(null, false); };

function isFunction(object) {
    return Object.prototype.toString.call(object) === '[object Function]';
}

function wrapStaticSecretInCallback(secret) {
    return function (_, __, cb) {
        return cb(null, secret);
    };
}

module.exports = function (options) {
    if (!options || !options.secret) throw new Error('secret should be set');

    var secretCallback = options.secret;

    if (!isFunction(secretCallback)) {
        secretCallback = wrapStaticSecretInCallback(secretCallback);
    }

    var isRevokedCallback = options.isRevoked || DEFAULT_REVOKED_FUNCTION;

    var _requestProperty    = options.userProperty || options.requestProperty || 'user';
    var credentialsRequired = typeof options.credentialsRequired === 'undefined' ? true : options.credentialsRequired;

    var middleware = function (req, res, next) {
        var token;

        if (req.method === 'OPTIONS' && req.headers.hasOwnProperty('access-control-request-headers')) {
            var hasAuthInAccessControl = !!~req.headers['access-control-request-headers']
                .split(',').map(function (header) {
                    return header.trim();
                }).indexOf('authorization');

            if (hasAuthInAccessControl) {
                return next();
            }
        }

        if (options.getToken && typeof options.getToken === 'function') {
            try {
                token = options.getToken(req);
            } catch (e) {
                return next(e);
            }
        } else if (req.headers && req.headers.authorization) {
            var parts = req.headers.authorization.split(' ');
            if (parts.length == 2) {
                var scheme      = parts[0];
                var credentials = parts[1];

                if (/^Bearer$/i.test(scheme)) {
                    token = credentials;
                } else {
                    if (credentialsRequired) {
                        return next({
                            statusCode  : 401, errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                            responseText: req.__('credentials_bad_scheme')
                        });
                    } else {
                        return next();
                    }
                }
            } else {
                return next({
                    statusCode  : 401, errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('credentials_bad_format')
                });

            }
        }

        if (!token) {
            if (credentialsRequired) {
                return next({
                    statusCode  : 401, errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('credentials_required')
                });
            } else {
                return next();
            }
        }

        var dtoken;

        try {
            dtoken = jwt.decode(token, {complete: true}) || {};
        } catch (err) {
            return next({
                statusCode: 401,
                errorCode : errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('invalid_token')
            });
        }

        async.waterfall([
            function getSecret(callback) {
                var arity = secretCallback.length;
                if (arity == 4) {
                    secretCallback(req, dtoken.header, dtoken.payload, callback);
                } else { // arity == 3
                    secretCallback(req, dtoken.payload, callback);
                }
            },
            function verifyToken(secret, callback) {
                jwt.verify(token, secret, options, function (err, decoded) {
                    if (err) {
                        return next({
                            statusCode  : 401, errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                            responseText: req.__('invalid_token')
                        });
                    } else {
                        callback(null, decoded);
                    }
                });
            },
            function checkRevoked(decoded, callback) {
                isRevokedCallback(req, dtoken.payload, function (err, revoked) {
                    if (err) {
                        callback(err);
                    }
                    else if (revoked) {
                        return next({
                            statusCode  : 401, errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                            responseText: req.__('revoked_token')
                        });
                    } else {
                        callback(null, decoded);
                    }
                });
            }

        ], async function (err, result) {
            if (err) { return next(err); }

            const reqPath = req.path;
            const subPath = _.replace(reqPath, '/admin', '');
            const roleId  = result.roleId;
            let hasAuth   = false;

            try {
                hasAuth = await Manager.hasAuth(subPath, roleId);
            } catch (err) {
            }

            logger.debug('后台接口鉴权操作中...请求路径 subPath = ', subPath);
            logger.debug('当前用户的角色 id = ', roleId, '对该接口的操作权限为 hasAuth = ', hasAuth);

            if (!hasAuth) {
                return next({
                    statusCode  : 401, errorCode: errorCodes.ERR_PERMISSION_DENIED,
                    responseText: req.__('err_no_operation_permissions')
                });
            }

            set(req, _requestProperty, result);
            next();
        });
    };

    middleware.unless = unless;

    return middleware;
};
