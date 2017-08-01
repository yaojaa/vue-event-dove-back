const _              = require('lodash');
const myutil         = require('../util/util.js');
const thinky         = require('../util/thinky.js');
const validator      = require('validator');
const type           = thinky.type;
const r              = thinky.r;
const nextId         = myutil.nextId;
const settings       = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const fixParams      = require('../util/fixParams.js');
const md5            = require('md5');
const crypto         = require('crypto');
const Promise        = require('bluebird');
const redisUtil      = require('../util/redisUtil');
const redisClinet    = redisUtil.redisClinet;
const REDIS_PREFIX   = require('../util/fixParams').REDIS_PREFIX;
const Wallet         = require('./wallet.js');

var UserFields = {
    id           : type.string(),
    username     : type.string().required().options({enforce_type: "strict"}),
    nickname     : type.string().default(function () { return this.username; }),
    password     : type.string().required().options({enforce_type: "strict"}),
    salt         : type.string(),
    phone        : type.string(),
    lastLoginTime: type.date(),
    lastLoginIp  : type.string(),
    userPackage  : {
        packageId: type.string(),
        beginDate: type.date(),
        endDate  : type.date()
    },
    email        : type.string().validator(validator.isEmail),
    accountStatus: type.string().enum('registered', 'active', 'disabled'),// registered 已注册,未激活不能登录,active 已激活,可以登录,disabled 禁用,不能登录
    ctime        : type.date().default(r.now()),   // 记录创建时间
    utime        : type.date().default(r.now()),   // 记录更新时间

    basePrice: type.number().default(0),               // 基础服务费(服务费低于该额度以该额度计)    默认 0: 无
    percent  : type.number().default(0),               // 票服务费比例(占票价百分比)   默认为 2.5%
    maxFee   : type.number().default(0),               // 最高服务费(服务费超过该额度以该额度收取) 0: 无

    /** 会员订单会鸽服务费比例 **/
    memberFeePercent: type.number().default(2.5),

    managepwd: type.string(),// 收款管理密码

    // 实名认证信息
    realNameAuthentication: {
        name             : type.string(),// 认证姓名
        idType           : type.string().enum(
            fixParams.USER_ID_TYPE.USER_ID_TYPE_IDENTITY_CARD,
            fixParams.USER_ID_TYPE.USER_ID_TYPE_PASSPORT,
            fixParams.USER_ID_TYPE.USER_ID_TYPE_TAIWAN_PASSPORT,
            fixParams.USER_ID_TYPE.USER_ID_TYPE_HK_PASSPORT,
            fixParams.USER_ID_TYPE.USER_ID_TYPE_HK_IDENTITY_CARD,
            fixParams.USER_ID_TYPE.USER_ID_TYPE_OTHER_IDENTITY_CARD
        ),// 证件类型
        idNumber         : type.string(),// 证件号码
        identityCardFront: type.string(),  // 身份证正面照
        identityCardVerso: type.string(),  // 身份证反面照
        status           : type.string().enum(
            fixParams.USER_ID_STATUS.USER_ID_STATUS_AUDITING,
            fixParams.USER_ID_STATUS.USER_ID_STATUS_AUDIT_FAILURE,
            fixParams.USER_ID_STATUS.USER_ID_STATUS_AUDIT_THROUGH
        ),
        note             : type.string(),  // 备注
        cTime            : type.date(),    // 申请认证时间
        uTime            : type.date(),    // 更新时间
    },

    // 登录注册类型
    oauthType      : type.string().enum(
        fixParams.USER_REGISTER_TYPE.USER_REGISTER_TYPE_DEFAULT,
        fixParams.USER_REGISTER_TYPE.USER_REGISTER_TYPE_SINA,
        fixParams.USER_REGISTER_TYPE.USER_REGISTER_TYPE_WEIXIN,
        fixParams.USER_REGISTER_TYPE.USER_REGISTER_TYPE_QQ
    ).default(fixParams.USER_REGISTER_TYPE.USER_REGISTER_TYPE_DEFAULT),
    oauthId        : type.string(),// 授权用户的UID
    oauthAccesToken: type.string(),// 用户授权的唯一票据
    oauthExpires   : type.number(),// access_token的生命周期 单位是秒数
    isOauth        : type.boolean().default(true),// 是否授权

    // 邮件偏好设置
    emailSetting: {
        isNeedAttendeeNotice     : type.boolean().default(false),// 是否需要参会者购票通知邮件
        isNeedRefundTicketNotice : type.boolean().default(false),// 是否需要退票通知邮件
        isNeedAuditedTicketNotice: type.boolean().default(false),// 是否需要参会者购买付费审核门票的通知邮件
    },

    // 用户设置
    profile: {
        avatar  : type.string(),// 用户头像
        gender  : type.string().enum('man', 'woman', 'other'),// 性别
        company : type.string(),// 公司
        position: type.string(),// 职位
    },

};

var User = thinky.createModel("User", UserFields);

User.ensureIndex("username");
User.ensureIndex("email");
User.ensureIndex("phone");

exports.UserModel  = User;
exports.UserFields = UserFields;

// add user
exports.addUser = function (data) {
    let user = new User(data);
    user.id  = nextId();

    // 创建用户时创建钱包
    try { Wallet.createWallet(user.id); } catch (err) {}

    return user.save();
};

// get user by userId, and only returns the target fields
exports.getUserById = function (userId, attributeNames, options) {
    const columns = _.isEmpty(attributeNames) ? _.keys(UserFields) : attributeNames;
    return r.table("User").get(userId).pluck(columns).run();
};

exports.update = function (user) {
    var id = user.id;
    if (!_.isEmpty(user.userPackage)) {
        try {
            redisClinet.delAsync(REDIS_PREFIX.USER_PACKAGE + user.id)
        } catch (e) {
            logger.error(e.message);
        }
    }
    user.utime = new Date();
    return User.get(id).update(user).run();
};

exports.findUserByUsername = function (username) {
    return User.getAll(username, {index: 'username'}).run();
};

exports.findUserByUserEmail = function (email) {
    return r.table('User').filter({'email': email}).run();
};

exports.findUserByUserPhone = function (phone) {
    return r.table('User').getAll(phone, {index: 'phone'}).run();
};

exports.activateUser = function (username) {
    var utime = new Date();
    return User.getAll(username, {index: 'username'})
               .update({accountStatus: 'active', "utime": utime}).execute();
};

exports.changePassword = function (email, newPassword) {
    var utime = new Date();
    return User.getAll(email, {index: 'email'})
               .update({password: newPassword, "utime": utime}).execute();
};

exports.changePasswordByPhone = function (phone, newPassword) {
    var utime = new Date();
    return User.getAll(phone, {index: 'phone'})
               .update({password: newPassword, "utime": utime}).execute();
};

exports.updateRealNameAuthentication = function (userId, realNameAuthentication, options) {
    realNameAuthentication.uTime = new Date();
    return User.get(userId).update({realNameAuthentication: realNameAuthentication}).run();
};

// 获取个人账户的证件类型列表
exports.getIdTypeList = function (req) {
    var idTypes    = _.values(fixParams.USER_ID_TYPE);
    var idTypeList = [];
    _.each(idTypes, function (type) {
        var i18nKey = "user_id_type_" + type;
        idTypeList.push({name: type, str: req.__(i18nKey)})
    });
    return idTypeList;
};

/**
 * 根据密码和盐生成密码
 * @param password 密码
 * @param salt 盐
 */
exports.generatePassword = function (password, salt) {
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
exports.checkPassword = function (userPostPassword, dbPassword, salt) {
    var encryptUserPostPassword = exports.generatePassword(userPostPassword, salt);
    return dbPassword === encryptUserPostPassword;
};

// 验证钱包密码
exports.checkWalletPwd = async function (userId, password) {

    if (_.isEmpty(userId) || _.isEmpty(password)) {
        return false;
    }

    // 查询用户信息
    var userInfo = await exports.getUserById(userId, ['salt', 'managepwd']);
    if (_.isEmpty(userInfo)) {
        return false;
    }

    // 验证密码
    if (!(exports.checkPassword(password, userInfo.managepwd, userInfo.salt))) {
        return false;
    }

    return true;
};

// 根据条件 分页查询 所有注册用户
exports.getAllWithPageIndex = function (params, attributeNames) {
    attributeNames = _.isEmpty(attributeNames) ? _.keys(UserFields) : attributeNames;
    var totalCount = parseInt(params.total) || -1;     // 总记录数
    var page       = parseInt(params.page) || 1;      // 第几页
    var limit      = parseInt(params.limit) || 10;     // 每页显示记录数
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "id";

    var userFilter = User;
    if (!_.isEmpty(params)) {
        var accountStatus = params.accountStatus;
        var username      = params.username;
        var stime         = params.stime;
        var etime         = params.etime;

        // logger.debug('accountStatus: '+accountStatus+' username: '+username+' stime: '+stime+' etime: '+etime);

        if (!_.isEmpty(accountStatus)) {
            if (accountStatus === 'disabled') {
                userFilter = userFilter.filter({accountStatus: 'disabled'});
            } else {
                userFilter = userFilter.filter(r.row("accountStatus").ne("disabled"));
            }
        }
        ;
        if (!_.isEmpty(username)) {
            userFilter = userFilter.filter({username: username});
        }
        ;
        if (!_.isEmpty(stime) && !_.isEmpty(etime)) {
            var stime_Arr = stime.split('-');
            var etime_Arr = etime.split('-');
            userFilter    = userFilter.filter(function (post) {
                return post("cTime").during(r.time(Number(stime_Arr[0]), Number(stime_Arr[1]), Number(stime_Arr[2]), 'Z'), r.time(Number(etime_Arr[0]), Number(etime_Arr[1]), Number(etime_Arr[2]), 'Z'));
            })
        }
        ;
    }
    // logger.debug("userFilterSQL: " + userFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit));
    var items = userFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit).pluck(attributeNames).run();

    if (totalCount === -1) {
        totalCount = userFilter.count().execute();
    }
    return Promise.props({items: items, count: totalCount});
};

// 根据条件 分页查询 所有已填写认证用户 的信息
exports.getUsersWithAuditPageIndex = function (params) {
    var userFilter = __buildUserFilter(params);
    var totalCount = parseInt(params.total) || -1;     // 总记录数
    var page       = parseInt(params.page) || 1;      // 第几页
    var limit      = parseInt(params.limit) || 10;     // 每页显示记录数
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "id";

    // logger.debug("userFilterSQL: " + userFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit));
    var items = userFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit).run();
    if (totalCount === -1) {
        totalCount = userFilter.count().run();
    }
    return Promise.props({items: items, count: totalCount});
};

// 拼装搜索条件
function __buildUserFilter(params) {
    var auditStatus = params.auditStatus;
    var username    = params.username;
    var stime       = params.stime;
    var etime       = params.etime;

    var userFilter = r.table('User').withFields(['realNameAuthentication', 'id', 'username', 'password']);

    if (!_.isEmpty(username)) {
        userFilter = userFilter.filter({username: username});
    }
    if (!_.isEmpty(auditStatus)) {
        userFilter = userFilter.filter(
            r.row("realNameAuthentication")("status").eq(auditStatus)
        )
    }
    // {"page":"1","limit":"20","auditStatus":"auditing","stime":"2017-05-10","etime":"2017-05-12","username":"test"}
    if (!_.isEmpty(stime) && !_.isEmpty(etime)) {
        var stime_Arr = stime.split('-');
        var etime_Arr = etime.split('-');
        userFilter    = userFilter.filter(function (post) {
            return post("realNameAuthentication")("cTime").during(r.time(Number(stime_Arr[0]), Number(stime_Arr[1]), Number(stime_Arr[2]), 'Z'), r.time(Number(etime_Arr[0]), Number(etime_Arr[1]), Number(etime_Arr[2]), 'Z'));
        })
    }

    return userFilter;
}

// 获取用户的邮件偏好设置
exports.getUserEmailSetting = async function (userId) {

    let emailSetting = {
        isNeedAttendeeNotice     : false,// 是否需要参会者购票通知邮件
        isNeedRefundTicketNotice : false,// 是否需要退票通知邮件
        isNeedAuditedTicketNotice: false,// 是否需要参会者购买付费审核门票的通知邮件
    };

    try {

        const userInfo = await exports.getUserById(userId, ['emailSetting']);
        emailSetting   = _.isUndefined(userInfo.emailSetting) ? {} : userInfo.emailSetting;

        const isNeedAttendeeNotice      = _.isUndefined(emailSetting.isNeedAttendeeNotice) ? false : emailSetting.isNeedAttendeeNotice;
        const isNeedRefundTicketNotice  = _.isUndefined(emailSetting.isNeedRefundTicketNotice) ? false : emailSetting.isNeedRefundTicketNotice;
        const isNeedAuditedTicketNotice = _.isUndefined(emailSetting.isNeedAuditedTicketNotice) ? false : emailSetting.isNeedAuditedTicketNotice;

        emailSetting = {
            isNeedAttendeeNotice     : isNeedAttendeeNotice,
            isNeedRefundTicketNotice : isNeedRefundTicketNotice,
            isNeedAuditedTicketNotice: isNeedAuditedTicketNotice,
        };

    } catch (err) { }

    return emailSetting;

};

// 获取会鸽前台重置密码链接地址
exports.getReSetPwdUrl = function (token) {
    const url_tpl = _.template(settings.eventdoveUrl.reset_pwd, settings.eventdoveUrl.templateSettings);
    return url_tpl({'token': token});
};

// 获取会鸽前台邮件激活链接地址
exports.getMailActivationUrl = function (token) {
    const url_tpl = _.template(settings.eventdoveUrl.mail_activation, settings.eventdoveUrl.templateSettings);
    return url_tpl({'token': token});
};

// 获取用户等级包
exports.getUserPackage = async function (userId) {

    let userPackage = {};

    try {

        const USER_PACKAGE_KEY = REDIS_PREFIX.USER_PACKAGE + userId;

        userPackage = await redisUtil.hgetall(USER_PACKAGE_KEY);

        if (_.isEmpty(userPackage)) {
            let nowUser = await exports.getUserById(userId, ['userPackage']);
            userPackage = (!_.isEmpty(nowUser)) ? nowUser.userPackage : {};
            redisClinet.hmsetAsync(USER_PACKAGE_KEY, userPackage, 'EX', 1800);
        }

    } catch (err) {
        logger.error('getUserPackage ', err);
    }

    return userPackage;

};

// 检查用户是否是Vip
exports.isVip = async function (userId) {

    let isVip = false;

    try {

        const userPackageInfo = await exports.getUserPackage(userId);

        isVip = (userPackageInfo.packageId === 'vip') && (userPackageInfo.endDate > new Date());

    } catch (err) {
        logger.error('isVip ', err);
    }

    return isVip;
};
