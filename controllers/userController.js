'use strict';

const _              = require('lodash');
const User           = require('../model/user');
const Event          = require('../model/event');
const myutil         = require('../util/util.js');
const jwt            = require('jsonwebtoken');
const settings       = require("../conf/settings");
const thinky         = require('../util/thinky.js');
const Promise        = require('bluebird');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const errorCodes     = require('../util/errorCodes.js').ErrorCodes;
const fp             = require('../util/fixParams.js');
const Notice         = require('../controllers/noticeController.js');
const hr             = require('../util/httpsRequest.js');
const moment         = require('moment');
const https          = require('https');
const iconv          = require("iconv-lite");
const Feedback       = require("../model/feedback");
const sysNotice      = require('../model/admin/sysNotice');


exports.register               = register;
exports.sendActivateEmail      = sendActivateEmail;
exports.updatePwd              = updatePwd;
exports.updatePwdByPhone       = updatePwdByPhone;
exports.sendFindPwdEmail       = sendFindPwdEmail;
exports.verifyResetPwdToken    = verifyResetPwdToken;
exports.login                  = login;
exports.resetPwdByUserId       = resetPwdByUserId;
exports.activate               = activate;
exports.checkLoginStatus       = checkLoginStatus;
exports.realNameAuthentication = realNameAuthentication;
exports.setManagepwd           = setManagepwd;

exports.getOrganizersByUserId = getOrganizersByUserId;
exports.oauthLogin            = oauthLogin;
exports.cancelSinaOauth       = cancelSinaOauth;

// 注册,用户登录手机号邮箱不能重复
async function register(req, res, next) {
    const params      = req.body;
    const password    = params.password || '';
    const phone       = params.phone || '';
    const email       = params.email || '';
    const purenessReq = myutil.getPurenessRequsetFields(params, User.UserFields);// 准备需要插入数据库的数据

    try {

        if (_.isEmpty(password)) {
            return next(
                {
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('Empty', 'password')
                }
            );
        }

        if ((_.isEmpty(phone)) && _.isEmpty(email)) {
            return next(
                {
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('NotExists', 'email or phone ')
                }
            );
        }

        const smsReg   = settings.sms_regx;
        const emailReg = settings.email_regx;

        if (!_.isEmpty(email)) {

            // 邮箱注册
            if (!emailReg.test(email)) {
                return next(
                    {
                        errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                        responseText: req.__('email_format_error')
                    }
                );
            }

            // 邮箱是否存在
            let userInfoArr = await User.findUserByUserEmail(email);
            if (!_.isEmpty(userInfoArr)) {
                return next(
                    {
                        errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                        responseText: req.__('Exists', 'email')
                    }
                );
            }

            purenessReq.accountStatus = 'registered';
            purenessReq.username      = email;

        }

        if (!_.isEmpty(phone)) {

            // 手机号注册
            if (!smsReg.test(phone)) {
                return next(
                    {
                        errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                        responseText: req.__('phone_format_error')
                    }
                );
            }

            // 校验手机验证码
            if (!myutil.checkVerificationCode(req)) {
                return next(
                    {
                        statusCode  : 412,
                        errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                        responseText: req.__('VerifyFailed')
                    }
                );
            }

            // 手机号是否存在
            let userInfoArr = await User.findUserByUserPhone(phone);
            if (!_.isEmpty(userInfoArr)) {
                return next(
                    {
                        errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                        responseText: req.__('Exists', 'phone number')
                    }
                );
            }

            purenessReq.accountStatus = 'active';
            purenessReq.username      = phone;

        }

        // 校验密码
        purenessReq.salt     = myutil.generateVerificationCode(6, 'string');
        purenessReq.password = User.generatePassword(password, purenessReq.salt);

        const addUserRes = await User.addUser(purenessReq);

        // 邮箱注册发送激活邮件
        if (purenessReq.accountStatus === 'registered') {
            __sendActivateEmail(addUserRes, req);
        }

        addUserRes.id_token  = __createToken(addUserRes);
        const returnUserInfo = __getReturnUserInfo(addUserRes);

        return res.status(200).send(returnUserInfo);
    } catch (err) {
        return next(
            {
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: err.message
            }
        );
    }
}

/**
 * 获取返回给前端的用户数据
 * @param userInfo
 * @private
 */
function __getReturnUserInfo(userInfo, pickAttributes) {
    pickAttributes     = pickAttributes || ['id', 'username', 'nickname', 'id_token', 'phone', 'email', 'percent', 'userPackage', 'profile'];
    var returnUserInfo = _.cloneDeep(userInfo);
    return _.pick(returnUserInfo, pickAttributes);
}

// 发送账户激活邮件
function __sendActivateEmail(userInfo, req) {
    try {
        // 邮件的token
        const emailActToken = jwt.sign(
            {username: userInfo.username, salt: userInfo.salt},
            settings.secret,
            {expiresIn: settings.sessionExpiresIn}
        );

        const mailActivationUrl = User.getMailActivationUrl(emailActToken);
        const toReplaceData     = {url: mailActivationUrl};
        const functionType      = fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
        sysNotice.sendNotice(req, functionType, 'eventdove_active_account', 'email', toReplaceData, userInfo);
    } catch (err) {
        logger.error('__sendActivateEmail ', err);
    }
}

function sendActivateEmail(req, res, next) {
    var m = req.body;

    if (process.env.NODE_ENV === "test") {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('NotSupported', 'sendActivateEmail')
        });
    }

    if (!m.username && !m.email) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'username or email')});
    }

    const doSomething = Promise.coroutine(function*() {
        try {
            var users = null;
            if (m.username) {
                users = yield User.findUserByUsername(m.username);
            }
            if (m.email) {
                users = yield User.findUserByUserEmail(m.email);
            }
            var userInfo = users[0];
            if (!userInfo) {
                return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('NotExists', 'user')});
            }
            if (userInfo.accountStatus === 'active') {
                return next({
                    errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Active', 'user has already')
                });
            }

            __sendActivateEmail(userInfo, req);

            userInfo.id_token  = __createVerifyToken(userInfo, 1800);
            var returnUserInfo = __getReturnUserInfo(userInfo);

            return res.status(200).send(returnUserInfo);
        } catch (err) {
            return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
        }
    })();
}

// 直接修改密码
exports.directUpdatePwd = async function (req, res, next) {
    const body      = req.body;
    const originPwd = body.originPwd;
    const newPwd    = body.password;
    const userId    = req.user.id;
    if (_.isEmpty(originPwd)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'originPwd')});
    }
    if (_.isEmpty(newPwd)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'password')});
    }
    if (_.isEmpty(userId)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'userId')});
    }
    try {
        // 1 验证用户原始密码是否匹配
        const userFields = ['password', 'salt', 'email', 'id'];
        const userInfo   = await User.getUserById(userId, userFields);

        if (!(User.checkPassword(originPwd, userInfo.password, userInfo.salt))) {
            return next({
                statusCode  : 500, errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('origin_password_not_match')
            });
        }
        // 2 更新用户密码
        const salt        = myutil.generateVerificationCode(6, 'string');
        const newPassword = User.generatePassword(newPwd, salt);
        const updateData  = {id: userId, password: newPassword, salt: salt};
        const updateRes   = await User.update(updateData);

        //发送修改密码提醒
        const functionType = fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
        sysNotice.sendNotice(req, functionType, 'password_changed_successfully', 'email', {}, userInfo);

        sysNotice.sendNotice(req, functionType, 'password_changed_successfully', 'sms', {}, userInfo);



        return res.status(200).send({
            errorCode: errorCodes.COMMON_SUCCESS, responseText: req.__('password_changed_successfully')
        });
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
};

async function updatePwd(req, res, next) {
    const body = req.body;

    if (!body.password) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'user password')});
    }

    if (!body.token) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'user token')});
    }

    try {

        const promiseVerifyUser = new Promise(function (resolve) {resolve(jwt.verify(body.token, settings.secret))});
        const verifyUser        = await promiseVerifyUser;
        const newPassword       = User.generatePassword(body.password, verifyUser.salt);
        await User.changePassword(verifyUser.email, newPassword);

        return res.status(200).send({
            errorCode: errorCodes.COMMON_SUCCESS, responseText: req.__('password_changed_successfully')
        });
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

async function updatePwdByPhone(req, res, next) {
    const body = req.body;

    if (_.isEmpty(body.phone)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'user phone')});
    }

    if (!body.password) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'user password')});
    }

    if (!body.token) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'user token')});
    }

    try {

        const userInfoArr = await User.findUserByUserPhone(body.phone);
        if (_.isEmpty(userInfoArr)) {
            return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('NotExists', 'user')});
        }

        const userInfo          = userInfoArr[0];
        const promiseVerifyUser = new Promise(function (resolve) {resolve(jwt.verify(body.token, settings.secret))});
        const verifyUser        = await promiseVerifyUser;
        const newPassword       = User.generatePassword(body.password, userInfo.salt);
        const result            = await User.changePasswordByPhone(verifyUser.phone, newPassword);
        const user              = result[0];
        if (!user) {
            return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('NotExists', 'user')});
        }

        return res.status(200).send({
            errorCode: errorCodes.COMMON_SUCCESS, responseText: req.__('password_changed_successfully')
        });

    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

exports.update = async function (req, res, next) {
    const userId    = req.user.id;
    const originReq = req.body;

    if (_.isEmpty(originReq)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'request')});
    }

    try {

        let purenessReq = myutil.getPurenessRequsetFields(originReq, User.UserFields);// 准备需要插入数据库的数据
        purenessReq.id  = userId;

        const result = await  User.update(purenessReq);

        return res.status(200).send(result);

    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
};

function __createVerifyToken(user, expiresIn) {
    const profile = _.pick(user, 'id', 'username', 'email');
    return jwt.sign(profile, settings.secret, {expiresIn: expiresIn});
}

function __createToken(user, keepLogin) {
    const expiresIn = (keepLogin === true) ? (settings.sessionExpiresIn) * 30 : settings.sessionExpiresIn;
    const profile   = _.pick(user, 'id', 'username', 'email', 'salt', 'password');
    return jwt.sign(profile, settings.secret, {expiresIn: expiresIn});
}

// 用户登录，兼容手机号，邮箱，手机验证码登录
async function login(req, res, next) {
    const body      = req.body;
    const username  = body.username || '';
    const phone     = body.phone || '';
    const password  = body.password || '';
    const keepLogin = body.keepLogin || false;

    if (_.isEmpty(username)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'username')
        });
    }

    // 手机动态码登录不传密码 password
    if (_.isEmpty(phone)) {

        // 非手机号登录需要传递password字段
        if (_.isEmpty(password)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('Empty', 'password')
            });
        }

    }

    try {

        const smsReg   = settings.sms_regx;
        const emailReg = settings.email_regx;
        if ((!smsReg.test(username)) && (!emailReg.test(username))) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('username_format_error')
            });
        }

        let userInfoArr = [];

        if (smsReg.test(username)) {  // 为手机号
            userInfoArr = await User.findUserByUserPhone(username);
        }

        if (emailReg.test(username)) {  // 为邮箱
            userInfoArr = await User.findUserByUserEmail(username);
        }

        if (_.isEmpty(userInfoArr)) {
            return next({
                statusCode  : 401,
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'user with that username')
            });
        }

        const userInfo = userInfoArr[0];

        if (userInfo.accountStatus === 'registered') {
            // 待激活的用户
            return next({
                statusCode  : 401,
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("user_login_active_account_notice")
            });
        }

        if (userInfo.accountStatus === 'disabled') {
            // 被禁用的用户
            return next({
                statusCode  : 401,
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("user_login_disabled_account_notice")
            });
        }

        // 判断是否为短信验证码登录
        let isMobileVerificationLogin = (!_.isEmpty(phone)) && ( phone === username);

        // 非手机验证码登录校验用户密码
        if (!isMobileVerificationLogin) {

            const isPass = User.checkPassword(password, userInfo.password, userInfo.salt);
            if (!isPass) {
                return next({
                    statusCode  : 401,
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__("user_login_password_wrong")
                });
            }

        }

        userInfo.id_token    = __createToken(userInfo, keepLogin);
        userInfo.username    = username;
        const returnUserInfo = __getReturnUserInfo(userInfo);

        return res.status(200).send(returnUserInfo);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

async function activate(req, res, next) {

    if (_.isEmpty(req.query.token)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'token')});
    }

    try {
        const promiseVerifyUser = new Promise(function (resolve) {resolve(jwt.verify(req.query.token, settings.secret))});
        const verifyUser        = await promiseVerifyUser;
        await User.activateUser(verifyUser.username);

        return res.status(200).send({
            errorCode: errorCodes.COMMON_SUCCESS, responseText: req.__('user_activated_successfully')
        });

    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

/**
 * 提取所有活动中的主办方信息
 * @param allEvents
 * @returns []
 * @private
 */
function __getAllOrganizers(allEvents) {
    return _.reduce(allEvents, function (organizers, eventInfo) {
        return eventInfo.organizers ? organizers.concat(eventInfo.organizers) : organizers;
    }, []);
}

async function getOrganizersByUserId(req, res, next) {
    const userId = req.user.id;

    if (!userId) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'user id')
        });
    }

    try {

        const allEvents   = await Event.getEventsByUserId(userId, ["organizers"]);
        let allOrganizers = __getAllOrganizers(allEvents);
        allOrganizers     = _.uniqWith(allOrganizers, _.isEqual);

        return res.status(200).json(allOrganizers);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

// 发送密码重置通知邮件
async function __sendFindPwdEmail(userInfo, req) {
    try {

        const expiresIn = 1800;// 重置密码token过期时间1800秒

        // 邮件的token
        const resetPwdToken = jwt.sign(
            {id: userInfo.id, username: userInfo.username, email: userInfo.email, salt: userInfo.salt},
            settings.secret,
            {expiresIn: expiresIn}
        );
        const reSetPwdUrl   = await User.getReSetPwdUrl(resetPwdToken);
        const shortUrlArr   = await myutil.getShortUrl([reSetPwdUrl]);
        const shortUrl      = shortUrlArr[0].short;
        const functionType  = fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
        sysNotice.sendNotice(req, functionType, 'eventdove_reset_password', 'email', {url: shortUrl}, userInfo);

    } catch (err) {
        logger.error('__sendFindPwdEmail ', err);
    }

}


async function sendFindPwdEmail(req, res, next) {
    const body = req.body;
    if (process.env.NODE_ENV === "test") {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('NotSupported', 'sendFindPwdEmail')
        });
    }
    if (_.isEmpty(body)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'request')});
    }
    if (!body.email) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'user email')});
    }
    try {
        const users    = await User.findUserByUserEmail(body.email);
        const userInfo = users[0];
        if (_.isUndefined(userInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('NotExists', 'user ' + body.email)
            });
        }
        __sendFindPwdEmail(userInfo, req);
        userInfo.id_token    = __createVerifyToken(userInfo, 1800);
        const returnUserInfo = __getReturnUserInfo(userInfo);
        return res.status(200).send(returnUserInfo);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

async function verifyResetPwdToken(req, res, next) {

    if (_.isEmpty(req.query.token)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'token')});
    }

    try {

        const promiseVerifyUser = new Promise(function (resolve) {resolve(jwt.verify(req.query.token, settings.secret))});
        const verifyUser        = await promiseVerifyUser;
        const findUsers         = await User.findUserByUserEmail(verifyUser.email);
        const findUser          = findUsers[0];

        if (_.isUndefined(findUser)) {
            return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Get', 'user error')});
        }

        return res.status(200).send({
            errorCode: errorCodes.COMMON_SUCCESS, responseText: req.__('verify_successfully')
        });

    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

exports.sendVerificationCode = async function (req, res, next) {

    if (_.isEmpty(req.body.phone)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'phone')});
    }

    try {

        const promiseCaptchaToken = new Promise(function (resolve) {resolve(jwt.verify(req.body.token, settings.secret))});
        const captchaToken        = await promiseCaptchaToken;
        const nowTime             = new Date().getTime();
        const isExpires           = myutil.isExpires(captchaToken.timestamp / 1000, nowTime / 1000, 60);
        if (!isExpires) {
            return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Expires')});
        }

        const phone    = req.body.phone;
        const code     = myutil.generateVerificationCode(6);
        const smsToken = jwt.sign(
            {phone: phone, verificationCode: code},
            settings.secret,
            {expiresIn: settings.sessionExpiresIn}
        );

        // 拼接短信 并发送
        const functionType = fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;
        const content      = req.__('your_verify_code', code);

        const params = __jointSmsRecord(functionType, phone, content, '', '');
        Notice.systemSendRecord(params);

        logger.debug(" 发短短信的请求参数是: ", JSON.stringify(params));
        logger.debug(' 用户输入图形验证码到点击发送短信验证码所花时间为: ', (nowTime - captchaToken.timestamp) / 1000, ' 秒');
        logger.debug(' 发送的短信手机号是 identifier= ', phone, ' 发送的短信验证码是: ', code, ' smsToken= ', smsToken);

        return res.status(200).send({token: smsToken});
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
};

exports.checkVerificationCode = function (req, res, next) {
    if (!myutil.checkVerificationCode(req)) {
        return next({
            statusCode: 412, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('VerifyFailed')
        });
    }
    return res.status(200).send({errorCode: errorCodes.COMMON_SUCCESS, responseText: ''});
};

exports.captcha = async function (req, res, next) {

    if (req.url === '/favicon.ico') {
        return res.status(200).send();
    }
    const captcha     = myutil.svgCaptcha({ignoreChars: '0o1LlIi2Zz'});
    const txt         = captcha.text;
    const buf         = captcha.data;
    const sessionId   = myutil.nextId();
    const tokenParams = {
        sessionId: sessionId,
        captcha  : txt,
        timestamp: new Date().getTime()
    };
    const token       = jwt.sign(tokenParams, settings.secret, {expiresIn: 600});
    // logger.debug('验证码信息: ', tokenParams, ' 生成的token是: ' + token);
    res.set({
        'Access-Control-Allow-Origin'  : '*',
        'Access-Control-Expose-Headers': 'sessionId,token',
        'Content-Type'                 : 'image/svg+xml',
        'sessionId'                    : sessionId,
        'token'                        : token
    });
    return res.status(200).send(buf);
};

exports.checkCaptcha = function (req, res, next) {
    if (!myutil.checkCaptcha(req)) {
        return next({
            statusCode: 412, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('VerifyFailed')
        });
    }
    return res.status(200).send({errorCode: errorCodes.COMMON_SUCCESS, responseText: ''});
};

async function resetPwdByUserId(req, res, next) {
    const body      = req.body;
    const userId    = body.id;
    const originPwd = body.originPwd;
    const newPwd    = body.newPwd;

    if (_.isEmpty(body)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'request')});
    }

    if (_.isEmpty(userId)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'user id')});
    }

    if (_.isEmpty(originPwd)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'originPwd')});
    }

    if (_.isEmpty(newPwd)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'newPwd')});
    }

    if (newPwd === originPwd) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('originPwd_equal_newPwd')});
    }

    try {

        // 1 验证用户原始密码是否匹配
        const userFields = ['password', 'salt'];
        const userInfo   = await User.getUserById(userId, userFields);

        if (!(User.checkPassword(originPwd, userInfo.password, userInfo.salt))) {
            return next({
                statusCode  : 401, errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('origin_password_not_match')
            });
        }

        // 2 更新用户密码
        const salt        = myutil.generateVerificationCode(6, 'string');
        const newPassword = User.generatePassword(newPwd, salt);
        const updateData  = {id: userId, password: newPassword, salt: salt};
        const updateRes   = await User.update(updateData);

        return res.status(200).send(updateRes);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

// 修改邮箱(绑定邮箱)
exports.updateEmail = async function (req, res, next) {
    const userId = req.user.id;
    const params = req.body;
    const email  = params.email || '';

    try {

        const userInfo = await User.getUserById(userId);
        if (_.isEmpty(userInfo)) {
            return next(
                {
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('NotExists', 'user')
                }
            );
        }

        const emailReg = settings.email_regx;

        // 校验邮箱格式
        if (!emailReg.test(email)) {
            return next(
                {
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('email_format_error')
                }
            );
        }


        // 邮箱唯一性校验
        const userInfoArr = await User.findUserByUserEmail(email);
        if (!_.isEmpty(userInfoArr)) {
            return next(
                {
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('Exists', 'email')
                }
            );
        }

        const updateData = {email: email, id: userId};
        const updateRes  = await User.update(updateData);

        return res.status(200).send(updateRes);
    } catch (err) {
        return next(
            {
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: err.message
            }
        );
    }
};

// 修改手机号(绑定手机号)
exports.updatePhone = async function (req, res, next) {
    const userId = req.user.id;
    const params = req.body;
    const phone  = params.phone || '';

    try {

        const userInfo = await User.getUserById(userId);
        if (_.isEmpty(userInfo)) {
            return next(
                {
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('NotExists', 'user')
                }
            );
        }

        const smsReg = settings.sms_regx;
        if (!smsReg.test(phone)) {
            return next(
                {
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('phone_format_error')
                }
            );
        }

        // 校验手机验证码
        if (!myutil.checkVerificationCode(req)) {
            return next(
                {
                    statusCode  : 412,
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('VerifyFailed')
                }
            );
        }

        // 手机号是否存在
        const userInfoArr = await User.findUserByUserPhone(phone);
        if (!_.isEmpty(userInfoArr)) {
            return next(
                {
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('phone_number_exist')
                }
            );
        }

        const updateData = {phone: phone, id: userId};
        const updateRes  = await User.update(updateData);

        //发送修改手机号提醒
        const functionType = fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
        sysNotice.sendNotice(req, functionType, 'mobile_changed_successfully', 'email', {}, {id:userInfo.id,email:userInfo.email});

        return res.status(200).send(updateRes);
    } catch (err) {
        return next(
            {
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: err.message
            }
        );
    }

};

// ****** 拼接短信记录参数 ******
function __jointSmsRecord(functionType, receivers, content, eventId, userId) {
    const params = {
        receivers: receivers,// 收件人/手机号
        category : fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS,// 记录 类别
        content  : content,// 短信内容
        sendType : fp.SEND_TYPE.SEND_TYPE_IMMEDIATELY,// 立即使发送
        type     : functionType,// 邮件短信类型 属性 帐户激活
        eventId  : _.isEmpty(eventId) ? '' : eventId,// 活动Id
        userId   : _.isEmpty(userId) ? '' : userId,// 用户Id
    };

    return params;
}

// 检查用户登录状态接口
async function checkLoginStatus(req, res, next) {

    const parts = req.headers.authorization.split(' ');
    if (parts.length !== 2) {
        return next({
            statusCode  : 401,
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('credentials_bad_format')
        });
    }

    const scheme      = parts[0];
    const credentials = parts[1];

    if (!(/^Bearer$/i.test(scheme))) {
        return next({
            statusCode  : 401,
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('credentials_bad_format')
        });
    }

    try {

        const token     = credentials;
        const tokenInfo = await __getVerifyJWTToken(token);

        // 根据用户id查询用户信息,校验token中携带的salt,和password是否与数据库中的一致
        const userInfoFromDb = await User.getUserById(tokenInfo.id, ['password', 'salt']);
        const isEqual        = (tokenInfo.password === userInfoFromDb.password) && (tokenInfo.salt === userInfoFromDb.salt);
        if (!isEqual) {
            return next({
                statusCode  : 401,
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('invalid_token')
            });
        }

        tokenInfo.id_token = __createToken(tokenInfo);// 创建新的token,返回给前端达到刷新token的目的
        return res.status(200).send(__getReturnUserInfo(tokenInfo));
    } catch (err) {
        logger.error('checkLoginStatus ', err);
        return next({
            statusCode  : 401,
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('invalid_token')
        });
    }
}

// 获取jwt token
function __getVerifyJWTToken(token) {
    return new Promise(function (resolve) {resolve(jwt.verify(token, settings.secret))});
}

// 实名认证接口
async function realNameAuthentication(req, res, next) {
    const body   = req.body;
    const userId = req.user.id;

    if (_.isEmpty(body.identityCardFront)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'identityCardFront')});
    }

    if (_.isEmpty(body.identityCardVerso)) {
        return next({errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'identityCardVerso')});
    }

    try {

        let realNameAuthentication    = myutil.getPurenessRequsetFields(body, User.UserFields.realNameAuthentication);
        realNameAuthentication.idType = 'identityCard';
        realNameAuthentication.status = 'auditing';
        realNameAuthentication.cTime  = new Date();
        await  User.updateRealNameAuthentication(userId, realNameAuthentication);

        return res.status(200).send(realNameAuthentication);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

// 设置取款密码
async function setManagepwd(req, res, next) {
    const body      = req.body;
    const userId    = req.user.id;
    const managepwd = body.managepwd || '';
    const phone     = body.phone || '';

    // 验证规则数组
    const validArr = [
        {fieldName: 'managepwd', type: 'string'},
        {fieldName: 'phone', type: 'string'},
    ];

    try {

        myutil.validateCustomObject(req, next, validArr, body);

        // 校验手机验证码
        if (!myutil.checkVerificationCode(req)) {
            return next(
                {
                    statusCode  : 412,
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('VerifyFailed')
                }
            );
        }

        // 根据userId查询用户信息
        const userInfo     = await User.getUserById(userId, ['salt', 'id']);
        const newManagepwd = User.generatePassword(managepwd, userInfo.salt);


        // 根据手机号查询用户信息
        const userInfoArr = await User.findUserByUserPhone(phone);
        if (!_.isEmpty(userInfoArr)) {
            // 不为空,则验证手机号与数据库中存储的是否一致,不一致则不能更改取款密码
            const userInfoByPhone = userInfoArr[0];
            if (userInfoByPhone.id !== userInfo.id) {
                return next(
                    {
                        errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                        responseText: req.__('illegal_operation')
                    }
                );
            }
        }

        const updateData     = {id: userId, managepwd: newManagepwd, phone: phone};
        const updateRes      = await User.update(updateData);
        const returnUserInfo = __getReturnUserInfo(updateRes);

        return res.status(200).send(returnUserInfo);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

// 校验手机号是否存在
exports.isPhoneExist = async function (req, res, next) {
    const phone = req.query.phone;

    if (_.isEmpty(phone)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'phone')
        });
    }

    try {
        let returnObj  = {isPhoneExist: false};
        const userInfo = await User.findUserByUserPhone(phone);

        if (!_.isEmpty(userInfo)) {
            returnObj.isPhoneExist = true;
        }

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// 校验邮箱是否存在
exports.isEmailExist = async function (req, res, next) {
    const email = req.query.email;

    if (_.isEmpty(email)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'email')
        });
    }

    try {
        let returnObj  = {isEmailExist: false};
        const userInfo = await User.findUserByUserEmail(email);

        if (!_.isEmpty(userInfo)) {
            returnObj.isEmailExist = true;
        }

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

exports.userDetail = async function (req, res, next) {
    const userId = req.user.id;
    try {
        const userInfo = await User.getUserById(userId);

        let userPackageInfo         = userInfo.userPackage || {};
        userPackageInfo.packageName = req.__('user_vip_type_normal');
        const isVip                 = await User.isVip();
        if (isVip) {
            userPackageInfo.packageName = req.__('user_vip_type_vip');
        }

        userInfo.userPackage = userPackageInfo;

        return res.status(200).send(userInfo);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// 第三方登录
async function oauthLogin(req, res, next) {
    var body            = req.body;
    var oauthAccesToken = body.oauthAccesToken;
    var oauthExpires    = body.oauthExpires;
    var oauthType       = body.oauthType;
    // var openId          = body.openId;
    var code            = body.code;   // 微博、微信登录传只传code QQ登录传上三个参数

    var openId   = '';
    // 校验第三方帐户是否合法
    var typeFlag = _.find(_.values(fp.USER_REGISTER_TYPE), function (value) {
        return value === oauthType;
    });
    if (_.isUndefined(typeFlag) || _.isEmpty(typeFlag) || typeFlag === fp.USER_REGISTER_TYPE.USER_REGISTER_TYPE_DEFAULT) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("oauth_not_third_account")
        });
    }
    try {
        if (oauthType === fp.USER_REGISTER_TYPE.USER_REGISTER_TYPE_QQ) {
            // 校验参数
            if (_.isUndefined(oauthAccesToken) || _.isEmpty(oauthAccesToken)) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('Empty', 'oauthAccesToken')
                });
            }
            if (_.isUndefined(oauthExpires) || _.isEmpty(oauthExpires)) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('Empty', 'oauthExpires')
                });
            }
            // 获取QQ oauthId(openId)
            var authInfo = await __getOauthUserInfo(oauthType, oauthAccesToken, '');
            if (_.isUndefined(authInfo) || _.isEmpty(authInfo)) {
                log.error('第三方登录接口(oauthLogin) qq 获取openId接口 异常');
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('Empty', 'oauthId')
                });
            }
            authInfo = JSON.parse(authInfo.substring(authInfo.indexOf('{'), authInfo.lastIndexOf('}') + 1));
            openId   = authInfo.openid;
            if (_.isUndefined(openId) || _.isEmpty(openId)) {
                logger.error('第三方登录接口(oauthLogin) qq 获取openId接口 失败: ' + JSON.stringify(authInfo));
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('Empty', 'oauthId')
                });
            }
        } else {
            // 校验参数
            if (_.isUndefined(code) || _.isEmpty(code)) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('Empty', 'code')
                });
            }
            // 获取新浪微博/微信token
            var authInfo = await __getOauthUserInfo(oauthType, '', code);
            if (_.isUndefined(authInfo) || _.isEmpty(authInfo)) {
                logger.error('第三方登录接口(oauthLogin) ' + oauthType + ' 获取token接口异常');
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('Empty', 'oauthId')
                });
            }
            var errcode = oauthType === fp.USER_REGISTER_TYPE.USER_REGISTER_TYPE_SINA ? authInfo.error_code : authInfo.errcode;
            var errmsg  = oauthType === fp.USER_REGISTER_TYPE.USER_REGISTER_TYPE_SINA ? authInfo.error : authInfo.errmsg;
            if (!_.isEmpty(errcode) && !_.isUndefined(errcode)) {
                logger.error('第三方登录接口(oauthLogin) ' + oauthType + ' 获取token接口失败: ' + JSON.stringify(authInfo));
                return next({
                    errorCode   : errcode,
                    responseText: errmsg
                });
            }
            oauthAccesToken = authInfo.access_token;
            openId          = oauthType === fp.USER_REGISTER_TYPE.USER_REGISTER_TYPE_SINA ? authInfo.uid : authInfo.openid;
            oauthExpires    = authInfo.expires_in;
        }
        var username = typeFlag + openId;
        var users    = await User.findUserByUsername(username);
        if (_.isEmpty(users)) {
            // 用户不存在进行注册
            var userReq      = myutil.getPurenessRequsetFields(body, User.UserFields);
            // 获取授权用户详细信息
            var authUserInfo = await __getOauthUserInfo(oauthType, oauthAccesToken, openId);
            // logger.debug('authUserInfo: '+JSON.stringify(authUserInfo));
            var nickname     = '';
            var avatar       = '';
            var gender       = '';
            if (oauthType === fp.USER_REGISTER_TYPE.USER_REGISTER_TYPE_SINA) {
                nickname = authUserInfo.name;
                avatar   = authUserInfo.avatar_large;
                if (authUserInfo.gender === 'm') {
                    gender = 'man';
                } else if (authUserInfo.gender === 'f') {
                    gender = 'woman';
                } else {
                    gender = 'other';
                }
            } else {
                if (oauthType === fp.USER_REGISTER_TYPE.USER_REGISTER_TYPE_QQ) {
                    authUserInfo = JSON.parse(authUserInfo);
                    avatar       = authUserInfo.figureurl_qq_2;
                    if (authUserInfo.gender === '男') {
                        gender = 'man';
                    } else if (authUserInfo.gender === '女') {
                        gender = 'woman';
                    } else {
                        gender = 'other';
                    }
                } else {
                    avatar = authUserInfo.headimgurl;
                    if (authUserInfo.sex === 1) {
                        gender = 'man';
                    } else if (authUserInfo.sex === 2) {
                        gender = 'woman';
                    } else {
                        gender = 'other';
                    }
                }
                nickname = authUserInfo.nickname;
            }
            userReq.username      = username;
            userReq.salt          = myutil.generateVerificationCode(6, 'string');
            userReq.password      = User.generatePassword('123456', userReq.salt);
            userReq.accountStatus = 'active';
            userReq.nickname      = nickname;

            userReq.oauthId         = openId;
            userReq.oauthAccesToken = oauthAccesToken;
            userReq.oauthExpires    = oauthExpires;

            userReq.profile = {
                avatar  : avatar,
                gender  : gender,
                company : '',
                position: ''
            };
            var userInfo    = await User.addUser(userReq);

            userInfo.id_token  = __createToken(userInfo);
            var returnUserInfo = __getReturnUserInfo(userInfo);

            return res.status(200).send(returnUserInfo);
        } else {
            var user = users[0];
            // 用户取消了授权
            // 校验 authAccesToken是否过期 过期时间 = 用户授权时间 + 授权有效期
            var seconds = moment(new Date()).diff(moment(user.utime), 'seconds');
            if (user.oauthExpires < seconds || user.isOauth === false) {
                // 更新用户授权信息
                var update_user = {
                    id             : user.id,
                    oauthAccesToken: oauthAccesToken,
                    oauthExpires   : oauthExpires,
                    isOauth        : true
                };
                user            = await User.update(update_user);
            }
            ;
            user.id_token      = __createToken(user, true);
            var returnUserInfo = __getReturnUserInfo(user);

            return res.status(200).send(returnUserInfo);
        }
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 调取第三方登录接口统一入口
async function __getOauthUserInfo(oauthType, oauthAccesToken, openId) {
    var OauthInfo;
    var isGet = true;
    try {
        var reqThirdPartyUrl = '';
        if (oauthType === fp.USER_REGISTER_TYPE.USER_REGISTER_TYPE_QQ) {
            // QQ 登录
            reqThirdPartyUrl = _.isEmpty(openId) ? fp.USER_REGISTER_URL.QQ_ME + '?access_token=' + oauthAccesToken : fp.USER_REGISTER_URL.QQ_GET_USER_INFO + '?access_token=' + oauthAccesToken + '&oauth_consumer_key=' + settings.qq_appKey + '&openid=' + openId;
        } else if (oauthType === fp.USER_REGISTER_TYPE.USER_REGISTER_TYPE_SINA) {
            // 微博登录
            if (_.isEmpty(oauthAccesToken) && !_.isEmpty(openId)) {
                isGet            = false;
                // 获取微博access_token
                reqThirdPartyUrl = fp.USER_REGISTER_URL.SINA_ACCESS_TOKEN + '?client_id=' + settings.sina_weibo_appKey
                    + '&client_secret=' + settings.sina_weibo_appSecret + '&grant_type=authorization_code&redirect_uri=http://qa.www.eventdove.com/qq&code=' + openId;
            } else {
                // 获取微博用户信息
                reqThirdPartyUrl = fp.USER_REGISTER_URL.SINA_USER_SHOW + '?access_token=' + oauthAccesToken + "&uid=" + openId;
            }
        } else if (oauthType === fp.USER_REGISTER_TYPE.USER_REGISTER_TYPE_WEIXIN) {
            // 微信登录
            // http://dev.www.eventdove.com/qq?code=081VtCys0uo8bb1nOrxs0coOys0VtCyM&state=34741.681744333764
            if (_.isEmpty(oauthAccesToken) && !_.isEmpty(openId)) {
                // 获取微信用户token
                reqThirdPartyUrl = fp.USER_REGISTER_URL.WX_ACCESS_TOKEN + '?appid=' + settings.wx_appKey + '&secret=' + settings.wx_appSecret + '&code=' + openId + '&grant_type=authorization_code';
            } else {
                // 获取微信用户信息
                // https://api.weixin.qq.com/sns/userinfo?access_token=ACCESS_TOKEN&openid=OPENID
                reqThirdPartyUrl = fp.USER_REGISTER_URL.WX_GET_USER_INFO + '?access_token=' + oauthAccesToken + '&openid=' + openId;
            }
        }
        OauthInfo = isGet === true ? await hr.htts_get(reqThirdPartyUrl) : await hr.htts_post(reqThirdPartyUrl, {});

    } catch (err) {
        logger.error('方法 __getOauthUserInfo 调取第三方' + oauthType + '接口异常');
    }

    return oauthType === fp.USER_REGISTER_TYPE.USER_REGISTER_TYPE_QQ ? OauthInfo : JSON.parse(OauthInfo);
}

// 取消授权
async function cancelSinaOauth(req, res, next) {
    var body = req.body;
    // 开发者可以在应用控制台填写取消授权回调页，当用户取消你的应用授权时，开放平台会回调你填写的这个地址。并传递给你以下参数，
    // source：应用appkey，uid ：取消授权的用户，auth_end ：取消授权的时间
    var oauthId = body.uid;
    var appkey  = body.source;

    if (_.isEmpty(oauthId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'oauthId')
        });
    }
    ;
    if (appkey !== settings.sina_weibo_appKey) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('cancel_oauth_illegal_parameter')
        });
    }
    ;
    try {
        var username = fp.USER_REGISTER_TYPE.USER_REGISTER_TYPE_SINA + oauthId;
        var users    = await User.findUserByUsername(username);
        if (!_.isEmpty(users) && users[0].isOauth === true) {
            var update_user = {
                id     : users[0].id,
                isOauth: false
            }
            var result      = await User.update(update_user);
        }
        return res.status(200).send(true);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};
//添加反馈意见
exports.addFeedback = async function (req, res, next) {
    try {
        let paramIndex;
        if (req.body.upImg === false) {
            req.body.src = "null";
        }
        let checkParams = _.values(req.body).map((param) => {
            return !_.isEmpty(param.toString())

        });
        if ((paramIndex = _.indexOf(checkParams, false)) !== -1) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('Empty', Object.keys(req.body)[paramIndex])
            });
        }
        await Feedback.addFeedback(req.body);
    }
    catch (err) {
        return next({
            statusCode: 500, errorCode: errorCodes.ERR_INTERNAL_SERVER
        });
    }
    return res.status(200).send(true);
};
