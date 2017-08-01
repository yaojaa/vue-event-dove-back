'use strict';

const _          = require('lodash');
const myutil     = require('../../util/util.js');
const errorCodes = require('../../util/errorCodes.js').ErrorCodes;
const fixParams  = require('../../util/fixParams.js');
const settings   = require("../../conf/settings");
const loggerSettings = require('../../logger');
const logger         = loggerSettings.winstonLogger;
const Promise    = require('bluebird');
const Manager    = require('../../model/admin/manager');
const jwt        = require('jsonwebtoken');
const nextId     = myutil.nextId;

// 添加管理员
exports.addManager = async function (req, res, next) {
    const body = req.body;

    // 验证规则数组
    const validArr = [
        {fieldName: 'name', type: 'string'},
        {fieldName: 'pwd', type: 'string'},
        {fieldName: 'roleId', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        let insertData = myutil.getPurenessRequsetFields(body, Manager.ManagerFields);

        const managerInfo = await Manager.findManagerByName(insertData.name, ['name']);
        if (!_.isEmpty(managerInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Exists', 'name')
            });
        }

        insertData.salt = myutil.generateVerificationCode(6, 'string');
        insertData.pwd  = Manager.generateAdminPassword(insertData.pwd, insertData.salt);

        const result            = await Manager.addManager(insertData);
        const returnManagerInfo = __getReturnManagerInfo(result);
        return res.status(200).send(returnManagerInfo);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 管理员登录
exports.managerLogin = async function (req, res, next) {
    const body      = req.body;
    const name      = body.name;
    const pwd       = body.pwd;
    const keepLogin = body.keepLogin;

    if (_.isEmpty(name)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'name')
        });
    }

    if (_.isEmpty(pwd)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'pwd')
        });
    }

    try {

        let managerInfo = await Manager.findManagerByName(name);
        if (_.isEmpty(managerInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('NotExists', 'name')
            });
        }

        if ("disabled" === managerInfo.status) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('disabled_account', name)
            });
        }

        if (!(Manager.checkAdminPassword(pwd, managerInfo.pwd, managerInfo.salt))) {
            return next({
                statusCode  : 401,
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: "The name or pwd don't match"
            });
        }

        managerInfo.id_token    = __createToken(managerInfo, keepLogin);
        const returnManagerInfo = __getReturnManagerInfo(managerInfo);
        return res.status(200).send(returnManagerInfo);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

//根据token获取用户信息
exports.getInfo=async function(req,res,next){
    const token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyNzYzNzgzODY5Mjc1ODczMjgiLCJuYW1lIjoiYWRtaW4iLCJyb2xlSWQiOiI2Mjc2Mzc3NzA0OTcxNTA1NjY0IiwiaWF0IjoxNDk5NzYwNDY4LCJleHAiOjE0OTk4NDY4Njh9.K4kWlcid35cE2Rjo14Ueh4pJHFqB4VgzBGD1LELxfrA';

    jwt.verify(token, settings.secret, function (err, result) {
        if(err){
            return res.send(err)
        }
        res.send(result)
       
    });


};

function __createToken(managerInfo, keepLogin) {
    var expiresIn = (keepLogin === true) ? (settings.sessionExpiresIn) * 7 : settings.sessionExpiresIn;
    var profile   = _.pick(managerInfo, 'id', 'name', 'roleId');
    return jwt.sign(profile, settings.secret, {expiresIn: expiresIn});
}

/**
 * 获取返回给前端的用户数据
 * @param managerInfo
 * @private
 */
function __getReturnManagerInfo(managerInfo, pickAttributes) {
    pickAttributes          = pickAttributes || ['id', 'id_token', 'name', 'nickName', 'roleId'];
    const returnManagerInfo = _.cloneDeep(managerInfo);
    return _.pick(returnManagerInfo, pickAttributes);
}

// 添加角色
exports.addRole = async function (req, res, next) {
    const body = req.body;

    // 验证规则数组
    const validArr = [
        {fieldName: 'name', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        let insertData = myutil.getPurenessRequsetFields(body, Manager.RoleFields);

        const roleInfo = await Manager.findRoleByName(insertData.name, ['name']);
        if (!_.isEmpty(roleInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Exists', 'name')
            });
        }

        const result = await Manager.addRole(insertData);
        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 更新角色
exports.updateRole = async function (req, res, next) {
    const body = req.body;
    const id   = body.id;

    if (_.isEmpty(id)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
        });
    }

    try {

        let updateData = myutil.getPurenessRequsetFields(body, Manager.RoleFields);

        const roleInfo = await Manager.findRoleById(id, ['id', 'name']);

        if (!_.isEmpty(body.name) && ( body.name !== roleInfo.name)) {

            const newRoleInfo = await Manager.findRoleByName(body.name, ['name']);
            if (!_.isEmpty(newRoleInfo)) {
                return next({
                    errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Exists', 'name')
                });
            }

        }

        const result = await Manager.updateRole(updateData);
        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

//更新密码
exports.updatePwd = async function (req, res, next) {
    const body      = req.body;
    const userId    = body.id;
    const oldpwd    = body.oldpwd;
    let managerInfo = await Manager.findManagerByName(body.name);
    if (!(Manager.checkAdminPassword(oldpwd, managerInfo.pwd, managerInfo.salt))) {
        return next({
            statusCode  : 401,
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: "原密码有误..."
        });
    }
    managerInfo.pwd         = Manager.generateAdminPassword(body.newpwd, managerInfo.salt);
    const result            = await Manager.updateManager(managerInfo);
    const returnManagerInfo = __getReturnManagerInfo(result);
    return res.status(200).send(returnManagerInfo);
}


// 添加权限
exports.addAuth = async function (req, res, next) {
    const body = req.body;
    const pid  = body.pid;
    const name = body.name;

    // 验证规则数组
    const validArr = [
        {fieldName: 'name', type: 'string'},
        {fieldName: 'pid', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        if (_.isUndefined(pid) || _.isEmpty(pid)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'pid')
            });
        }

        if (_.isUndefined(name) || _.isEmpty(name)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'name')
            });
        }

        // pid 不为 '0' 需要controller和action不为空
        if ("0" !== pid) {

            if (_.isEmpty(body.controller)) {
                return next({
                    errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'controller')
                });
            }

            if (_.isEmpty(body.action)) {
                return next({
                    errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'action')
                });
            }

        }


        let insertData = myutil.getPurenessRequsetFields(body, Manager.AuthFields);

        const id     = nextId();
        const path   = ("0" === pid) ? id : (pid + '-' + id);
        const caPath = ("0" === pid) ? '' : ('/' + insertData.controller + '/' + insertData.action);
        const level  = ("0" === pid) ? "0" : "1";

        insertData.id     = id;
        insertData.path   = path;
        insertData.caPath = caPath;
        insertData.level  = level;

        const authInfo = await Manager.findAuthByName(insertData.name, ['name']);
        if (!_.isEmpty(authInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Exists', 'name')
            });
        }

        const result = await Manager.addAuth(insertData);
        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 更新权限
exports.updateAuth = async function (req, res, next) {
    const body = req.body;
    const id   = body.id;
    const pid  = body.pid;
    const name = body.name;

    // 验证规则数组
    const validArr = [
        {fieldName: 'id', type: 'string'},
        {fieldName: 'name', type: 'string'},
        {fieldName: 'pid', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        if (_.isUndefined(id) || _.isEmpty(id)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
            });
        }

        if (_.isUndefined(pid) || _.isEmpty(pid)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'pid')
            });
        }

        if (_.isUndefined(name) || _.isEmpty(name)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'name')
            });
        }

        // pid 不为 '0' 需要controller和action不为空
        if ("0" !== pid) {

            if (_.isEmpty(body.controller)) {
                return next({
                    errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'controller')
                });
            }

            if (_.isEmpty(body.action)) {
                return next({
                    errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'action')
                });
            }

        }


        let updateData = myutil.getPurenessRequsetFields(body, Manager.AuthFields);

        const path   = ("0" === pid) ? id : (pid + '-' + id);
        const caPath = ("0" === pid) ? '' : ('/' + updateData.controller + '/' + updateData.action);
        const level  = ("0" === pid) ? "0" : "1";

        updateData.id     = id;
        updateData.path   = path;
        updateData.caPath = caPath;
        updateData.level  = level;

        const authInfo = await Manager.findAuthById(id, ['name']);
        if (!_.isEmpty(name) && ( name !== authInfo.name)) {

            const newAuthInfo = await Manager.findAuthByName(name, ['name']);
            if (!_.isEmpty(newAuthInfo)) {
                return next({
                    errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Exists', 'name')
                });
            }

        }

        const result = await Manager.updateAuth(updateData);
        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 获取根权限
exports.getRootAuth = async function (req, res, next) {
    try {
        const rootAuthList = await Manager.getRootAuth();
        return res.status(200).send(rootAuthList);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 根据id获取权限详情
exports.getAuthById = async function (req, res, next) {
    const query = req.query;
    const id    = query.id;

    if (_.isUndefined(id) || _.isEmpty(id)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
        });
    }

    try {

        const authInfo = await Manager.findAuthById(id);
        return res.status(200).send(authInfo);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 删除权限
exports.deleteAuth = async function (req, res, next) {
    const body = req.body;
    const id   = body.id;

    if (_.isUndefined(id) || _.isEmpty(id)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
        });
    }

    try {

        const result = await Manager.deleteAuth(id);
        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 权限列表带分页
exports.getAuthPageIndex = async function (req, res, next) {
    try {

        var data     = await Manager.getAuthPageIndex(req.query);
        var paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        return res.status(200).send(paginate);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
};

// 角色列表带分页
exports.getRolePageIndex = async function (req, res, next) {
    try {

        var data     = await Manager.getRolePageIndex(req.query);
        var paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        return res.status(200).send(paginate);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
};

exports.deleteRole = async function (req, res, next) {
    const body = req.body;
    const id   = body.id;

    if (_.isUndefined(id) || _.isEmpty(id)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
        });
    }

    try {

        const result = await Manager.deleteRole(id);
        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

exports.getRoleById = async function (req, res, next) {
    const query = req.query;
    const id    = query.id;

    if (_.isUndefined(id) || _.isEmpty(id)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
        });
    }

    try {

        const info = await Manager.findRoleById(id);
        return res.status(200).send(info);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

exports.getAllAuthList = async function (req, res, next) {
    try {

        const authList = await Manager.getAllAuthList();
        if (_.isEmpty(authList)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'authList')
            });
        }

        let level0AuthList = authList[0]['reduction'];
        let level1AuthList = authList[1]['reduction'];

        let newLevel0AuthList = _.map(level0AuthList, function (level0Info) {

            let newLevel1AuthList  = _.filter(level1AuthList, {pid: level0Info.id});
            let new2level1AuthList = _.map(newLevel1AuthList, function (level1Info) {
                return {
                    id   : level1Info.id,
                    label: level1Info.name,
                }
            });

            return {
                id      : level0Info.id,
                label   : level0Info.name,
                children: new2level1AuthList,
            }
        });

        return res.status(200).send(newLevel0AuthList);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

exports.getAllRoleList = async function (req, res, next) {
    try {

        const roleList = await Manager.getAllRoleList();
        if (_.isEmpty(roleList)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'roleList')
            });
        }

        return res.status(200).send(roleList);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

exports.getManagerPageIndex = async function (req, res, next) {
    try {

        var data     = await Manager.getManagerPageIndex(req.query);
        var paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        return res.status(200).send(paginate);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
};

exports.deleteManager = async function (req, res, next) {
    const body = req.body;
    const id   = body.id;

    if (_.isUndefined(id) || _.isEmpty(id)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
        });
    }

    try {

        const result = await Manager.deleteManager(id);
        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

exports.getManagerById = async function (req, res, next) {
    const query = req.query;
    const id    = query.id;

    if (_.isUndefined(id) || _.isEmpty(id)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
        });
    }

    try {

        const info = await Manager.findManagerById(id);
        return res.status(200).send(info);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

exports.updateManager = async function (req, res, next) {
    const body   = req.body;
    const id     = body.id;
    const roleId = body.roleId;
    const name   = body.name;

    // 验证规则数组
    const validArr = [
        {fieldName: 'id', type: 'string'},
        {fieldName: 'name', type: 'string'},
        {fieldName: 'roleId', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        if (_.isUndefined(id) || _.isEmpty(id)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
            });
        }

        if (_.isUndefined(roleId) || _.isEmpty(roleId)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'roleId')
            });
        }

        if (_.isUndefined(name) || _.isEmpty(name)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'name')
            });
        }


        let updateData = myutil.getPurenessRequsetFields(body, Manager.ManagerFields);

        const info = await Manager.findManagerById(id, ['name']);
        if (!_.isEmpty(name) && ( name !== info.name)) {

            const newAuthInfo = await Manager.findManagerByName(name, ['name']);
            if (!_.isEmpty(newAuthInfo)) {
                return next({
                    errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Exists', 'name')
                });
            }

        }

        if (!_.isEmpty(body.pwd)) {
            updateData.salt = myutil.generateVerificationCode(6, 'string');
            updateData.pwd  = Manager.generateAdminPassword(body.pwd, updateData.salt);
        }

        const result            = await Manager.updateManager(updateData);
        const returnManagerInfo = __getReturnManagerInfo(result);
        return res.status(200).send(returnManagerInfo);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

exports.resetManagerPwd = async function (req, res, next) {
    const body = req.body;
    const id   = body.id;
    const pwd  = body.pwd;

    // 验证规则数组
    const validArr = [
        {fieldName: 'id', type: 'string'},
        {fieldName: 'pwd', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        if (_.isUndefined(id) || _.isEmpty(id)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
            });
        }

        if (_.isUndefined(pwd) || _.isEmpty(pwd)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'pwd')
            });
        }


        let updateData  = myutil.getPurenessRequsetFields(body, Manager.ManagerFields);
        updateData.salt = myutil.generateVerificationCode(6, 'string');
        updateData.pwd  = Manager.generateAdminPassword(pwd, updateData.salt);

        const result            = await Manager.updateManager(updateData);
        const returnManagerInfo = __getReturnManagerInfo(result);
        return res.status(200).send(returnManagerInfo);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};
