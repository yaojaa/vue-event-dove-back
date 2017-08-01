const _            = require('lodash');
const myutil       = require('../../util/util.js');
const thinky       = require('../../util/thinky.js');
const type         = thinky.type;
const r            = thinky.r;
const nextId       = myutil.nextId;
const settings     = require("../../conf/settings");
const loggerSettings = require('../../logger');
const logger         = loggerSettings.winstonLogger;
const fixParams    = require('../../util/fixParams.js');
const md5          = require('md5');
const crypto       = require('crypto');
const Promise      = require('bluebird');
const redisClinet  = require('../../util/redisUtil').redisClinet;
const REDIS_PREFIX = require('../../util/fixParams').REDIS_PREFIX;

const ManagerFields = {
    id      : type.string(),
    name    : type.string(),// 用户名
    nickName: type.string(),// 用户昵称
    pwd     : type.string(),// 密码
    salt    : type.string(),
    status  : type.string().enum('active', 'disabled').default("active"),
    roleId  : type.string(),// 角色id
    cTime   : type.date().default(function () { return new Date();}),   // 记录创建时间
    uTime   : type.date().default(function () { return new Date();}),   // 记录更新时间
};

const Manager = thinky.createModel("Manager", ManagerFields);
Manager.ensureIndex("name");
exports.ManagerFields = ManagerFields;

const RoleFields = {
    id     : type.string(),
    name   : type.string(),// 角色名称
    authIds: [],// 权限ids[1,2,3]
    cTime  : type.date().default(function () { return new Date();}),   // 记录创建时间
    uTime  : type.date().default(function () { return new Date();}),   // 记录更新时间
};

const Role = thinky.createModel("Role", RoleFields);
Role.ensureIndex("name");
exports.RoleFields = RoleFields;

const AuthFields = {
    id        : type.string(),
    name      : type.string(),// 权限名称
    pid       : type.string(),// 权限的父id,没有父id的设置为0
    controller: type.string(),// 控制器
    action    : type.string(),// 操作方法
    path      : type.string(),// 全路径,父id-自己的id
    caPath    : type.string(),// /控制器/操作方法
    level     : type.string(),// 权限级别，从0开始计数
    cTime     : type.date().default(function () { return new Date();}),   // 记录创建时间
    uTime     : type.date().default(function () { return new Date();}),   // 记录更新时间
};

const Auth = thinky.createModel("Auth", AuthFields);
Auth.ensureIndex("name");
exports.AuthFields = AuthFields;

exports.addManager = function (data) {
    var obj = new Manager(data);
    obj.id  = nextId();
    return obj.save();
};

exports.findManagerByName = async function (name, attributeNames, options) {
    attributeNames = _.isEmpty(attributeNames) ? _.keys(ManagerFields) : attributeNames;
    const infoArr  = await r.table("Manager").getAll(name, {index: 'name'}).pluck(attributeNames).run();
    return infoArr[0];
};

/**
 * 根据密码和盐生成密码
 * @param password 密码
 * @param salt 盐
 */
exports.generateAdminPassword = function (password, salt) {
    var toBeEncrypt = salt + password;
    var md5         = crypto.createHash('sha1');
    md5.update(toBeEncrypt);
    return md5.digest('hex');
};

/**
 * 检查用户提交的密码是否正确
 * @param userPostPassword 用户提交的密码
 * @param dbPassword 数据库存储的密码
 * @param salt 盐
 */
exports.checkAdminPassword = function (userPostPassword, dbPassword, salt) {
    var encryptUserPostPassword = exports.generateAdminPassword(userPostPassword, salt);
    return dbPassword === encryptUserPostPassword;
};

exports.addRole = function (data) {
    var obj = new Role(data);
    obj.id  = nextId();
    return obj.save();
};

exports.findRoleByName = async function (name, attributeNames, options) {
    attributeNames = _.isEmpty(attributeNames) ? _.keys(RoleFields) : attributeNames;
    const infoArr  = await r.table("Role").getAll(name, {index: 'name'}).pluck(attributeNames).run();
    return infoArr[0];
};

exports.findRoleById = async function (id, attributeNames, options) {
    attributeNames = _.isEmpty(attributeNames) ? _.keys(RoleFields) : attributeNames;
    return await r.table("Role").get(id).pluck(attributeNames).run();
};

exports.updateRole = function (data) {
    const id   = data.id;
    data.uTime = new Date();
    return Role.get(id).update(data).run();
};

exports.addAuth = function (data) {
    var obj = new Auth(data);
    return obj.save();
};

exports.updateAuth = function (data) {
    const id   = data.id;
    data.uTime = new Date();
    return Auth.get(id).update(data).run();
};

exports.findAuthByName = async function (name, attributeNames, options) {
    attributeNames = _.isEmpty(attributeNames) ? _.keys(AuthFields) : attributeNames;
    const infoArr  = await r.table("Auth").getAll(name, {index: 'name'}).pluck(attributeNames).run();
    return infoArr[0];
};

exports.findAuthById = async function (id, attributeNames, options) {
    attributeNames = _.isEmpty(attributeNames) ? _.keys(AuthFields) : attributeNames;
    return await r.table("Auth").get(id).pluck(attributeNames).run();
};

exports.getRootAuth = function () {
    return r.table("Auth")
            .filter(
                function (doc) {return doc("level").eq("0")}
            ).run();
};

exports.deleteAuth = function (id) {
    return Auth.get(id).delete().execute();
};

exports.getAuthPageIndex = function (params) {
    var totalCount = parseInt(params.total) || -1;// 总记录数
    var page       = parseInt(params.page) || 1;  // 第几页
    var limit      = parseInt(params.limit) || 10;// 每页显示记录数
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "id";

    var items = Auth.orderBy(r.desc(orderBy)).slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = Auth.count().execute();
    }

    return Promise.props({items: items, count: totalCount});
};

exports.getRolePageIndex = function (params) {
    var totalCount = parseInt(params.total) || -1;// 总记录数
    var page       = parseInt(params.page) || 1;  // 第几页
    var limit      = parseInt(params.limit) || 10;// 每页显示记录数
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "id";

    var items = Role.orderBy(r.desc(orderBy)).slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = Role.count().execute();
    }

    return Promise.props({items: items, count: totalCount});
};

exports.deleteRole = function (id) {
    return Role.get(id).delete().execute();
};

// 根据level分组,获取所有权限列表
exports.getAllAuthList = function () {
    return r.table("Auth").group("level").run();
};

exports.getAllRoleList = function () {
    return r.table("Role").run();
};

exports.getManagerPageIndex = function (params) {
    var totalCount = parseInt(params.total) || -1;// 总记录数
    var page       = parseInt(params.page) || 1;  // 第几页
    var limit      = parseInt(params.limit) || 10;// 每页显示记录数
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "id";

    var items = Manager.orderBy(r.desc(orderBy)).slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = Manager.count().execute();
    }

    return Promise.props({items: items, count: totalCount});
};

exports.deleteManager = function (id) {
    return Manager.get(id).delete().execute();
};

exports.findManagerById = async function (id, attributeNames, options) {
    attributeNames = _.isEmpty(attributeNames) ? _.keys(ManagerFields) : attributeNames;
    return await r.table("Manager").get(id).pluck(attributeNames).run();
};

exports.updateManager = function (data) {
    const id   = data.id;
    data.uTime = new Date();
    return Manager.get(id).update(data).run();
};

exports.getCaPathList = async function (roleId, options) {

    const roleInfo     = await r.table("Role").get(roleId).pluck("authIds");
    const authIds      = roleInfo['authIds'];
    const authInfoList = await r.table("Auth")
                                .filter(function (doc) { return r.expr(authIds).contains(doc("id")); })
                                .pluck("caPath")
                                .filter(function (doc) { return doc("caPath").ne(''); });
    const newCaPathArr = _.reduce(authInfoList, function (caPathArr, authInfo) {
        return authInfo.caPath ? caPathArr.concat(authInfo.caPath) : caPathArr;
    }, []);

    return newCaPathArr;
};

// 当前角色有权限进行操作
exports.hasAuth = async function (path, roleId, options) {
    const newCaPathArr = await exports.getCaPathList(roleId);
    return myutil.inArray(path, newCaPathArr);
};
