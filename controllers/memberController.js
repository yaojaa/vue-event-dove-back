/**
 * Created by Henry on 2017/2/24.
 */


const _ = require('lodash');
const Member = require('../model/member');
const fixParams = require('../util/fixParams');
const errorCodes = require('../util/errorCodes.js').ErrorCodes;
const util = require('util');
const uuid = require('uuid');
const User = require('../model/user');
const settings  = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const Big = require('big.js');
const moment = require('moment');
const Alipay = require('../services/pay/alipay/alipay');
const PayPal = require('../services/pay/paypal/paypal');
const myutil = require('../util/util');
const nextId = myutil.nextId;

/**
 * 根据id获得会员详细信息
 */
exports.getMemberById = async function (req, res, next) {
    req.checkQuery('memberId').notEmpty();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }
    try {
        const member = await Member.getMemberById(req.query.memberId);
        if (_.isEmpty(member)) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBER_NOT_EXSIT, responseText: 'Member does not exist!',
            });
        }
        res.status(200).json(member);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

/**
 * 根据membershipId获得会员列表
 */
exports.getMembersByMembershipId = async function (req, res, next) {
    req.checkQuery('membershipId').notEmpty();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }

    try {
        const membership = await Member.getMembershipById(req.query.membershipId);
        if (_.isEmpty(membership)) {
            return next({
                statusCode: 400,
                errorCode: errorCodes.MEMBERSHIP_NOT_EXSIT,
                responseText: 'Membership group does not exist!',
            });
        }

        if (req.user.id !== membership.userId) {
            return next({
                statusCode: 403, errorCode: errorCodes.ERR_PERMISSION_DENIED, responseText: 'Permission denied!',
            });
        }
        const memberColumns = ['id', 'name', 'email', 'joinTime', 'expireTime'];
        const members = await Member.getMembersByMembershipId(req.query.membershipId, memberColumns);
        res.status(200).json(members);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
}

/**
 * 搜索会员 邮箱、姓名、过期时间
 */
exports.searchMembers = async function (req, res, next) {
    const beforeDays = req.query.beforDays;
    req.checkQuery('membershipId').notEmpty();
    req.checkQuery('beforeDays').optional().isInt();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }
    const membershipId = req.query.membershipId;
    try {
        const membership = await Member.getMembershipById(req.query.membershipId);
        if (_.isEmpty(membership)) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBERSHIP_NOT_EXSIT, responseText: 'Membership does not exist!',
            });
        }
        if (req.user.id !== membership.userId) {
            return next({
                statusCode: 403, errorCode: errorCodes.ERR_PERMISSION_DENIED, responseText: 'Permission denied!',
            });
        }
        const options = {
            membershipId: membershipId,
            searchText: req.query.searchText,
            beforeDays: beforeDays,
            page      : req.query.page,
            limit     : req.query.limit,
            total     : req.query.total
        }
        const members = await Member.searchMembers(options);
        res.status(200).json(members);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
}

/**
 * 会员组活动
 */
exports.membershipEvents = async function (req, res, next) {
    // TODO shenhaiyang
    req.checkQuery('membershipId').notEmpty();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }
    try {
        const membership = await Member.getMembershipById(req.query.membershipId);
        if (_.isEmpty(membership)) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBERSHIP_NOT_EXSIT, responseText: 'Membership does not exist!',
            });
        }
        if (req.user.id !== membership.userId) {
            return next({
                statusCode: 403, errorCode: errorCodes.ERR_PERMISSION_DENIED, responseText: 'Permission denied!',
            });
        }
        const events = {} // TODO shenhaiyang
        res.status(200).json(events);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
}

/**
 * 根据id获得会员组详细信息
 */
exports.getMembershipById = async function (req, res, next) {
    req.checkQuery('membershipId').notEmpty();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }

    try {
        const membership = await Member.getMembershipById(req.query.membershipId);
        if (_.isEmpty(membership)) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBERSHIP_NOT_EXSIT, responseText: 'Membership does not exist!',
            });
        }

        res.status(200).json(membership);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

/**
 * 我加入的会员
 */
exports.getMyMember = async function (req, res, next) {
    try {
        const members = await Member.getMemberByEmail(req.user.email);
        res.status(200).json(members);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

/**
 * 我的会员组
 */
exports.getMyMembership = async function (req, res, next) {
    try {
        const memberships = await Member.getMembershipByUserId(req.user.id);
        res.status(200).json(memberships);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

/**
 * 根据Email查找会员
 */
exports.getMemberByEmail = async function (req, res, next) {
    req.checkQuery('email').isEmail();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }

    try {
        const members = await Member.getMemberByEmail(req.query.email);
        res.status(200).json(members);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};


/**
 * 初始化会员，状态为 inactive
 */
exports.initMember = async function (req, res, next) {
    req.checkBody('email').isEmail();
    req.checkBody('membershipId').notEmpty();
    req.checkBody('name').notEmpty();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }
    const body = req.body;
    const email = body.email;


    try {
        const emailUser = await User.findUserByUserEmail(email);

        if (_.isEmpty(emailUser)) {
            const newUser = { email, username: email, password: 'default' };
            await User.addUser(newUser);
            // TODO shenhaiyang 发送邮件
        }
        const membership = await Member.getMembershipById(body.membershipId);

        if (_.isEmpty(membership)) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBERSHIP_NOT_EXSIT, responseText: 'Membership does not exist!',
            });
        }

        const member = {
            membershipId: body.membershipId,
            name: body.name,
            email: body.email,
            status: fixParams.MEMBER_CONST.STATUS_INACTIVE,
            joinTime: new Date(),
        };

        const validation = {};

        _.merge(member, { validation });

        // 免费会员组需要设置验证邮箱用的token
        if (fixParams.MEMBER_CONST.DUES_TYPE_FREE === membership.duesType) {
            const expireTime = new Date();
            expireTime.setDate(expireTime.getDate() + 1);
            member.validation.uuid = uuid.v4();
            member.validation.expireTime = expireTime;
        }

        const addedMember = await Member.addMember(member);
        res.status(200).send(_.pick(addedMember, 'id'));
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message,
        });
    }
};

/**
 * 免费会员的邮箱验证
 */
exports.validateEmail = async function (req, res, next) {
    req.checkQuery('memberId').notEmpty();
    req.checkQuery('uuid').notEmpty();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }
    const memberId = req.query.memberId;
    const uuid = req.query.uuid;


    try {
        const member = await Member.getMemberById(memberId);
        if (_.isEmpty(member)) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBERSHIP_NOT_EXSIT, responseText: 'Membership does not exist!',
            });
        }
        if (uuid === member.validation.uuid && member.validation.expireTime < new Date()
            && fixParams.MEMBER_CONST.STATUS_INACTIVE === member.status) {
            const updateMember = { status: fixParams.MEMBER_CONST.STATUS_ACTIVE };
            await Member.updateMember(memberId, updateMember);
            return next({
                statusCode: 200,
                errorCode: errorCodes.COMMON_SUCCESS,
                responseText: 'OK',
            });
        }
        return next({
            statusCode: 200,
            errorCode: errorCodes.MEMBER_ACTIVATION_FAILED,
            responseText: 'Failed',
        });
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

/**
 * 修改会员过期时间
 */
exports.changeMemberExpireTime = async function (req, res, next) {
    const body = req.body;
    req.checkBody('memberId').notEmpty();
    // TODO shenhaiyang 时间校验
    req.checkBody('endDate').notEmpty();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }
    try {
        const member = await Member.getMemberById(body.memberId);
        if (_.isEmpty(member)) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBER_NOT_EXSIT, responseText: 'Member does not exist!',
            });
        }
        const updateMember = { expireTime: moment(body.endDate) };
        await Member.updateMember(body.memberId, updateMember);
        return next({
            statusCode: 200, errorCode: errorCodes.COMMON_SUCCESS, responseText: 'OK',
        });
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

exports.checkMembershipSubDomian = async function (req, res, next) {
    req.checkQuery('subDomain').notEmpty();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }

    try {
        const member = await Member.getMembershipBySubDomain(req.query.subDomain, ['id'])
        res.status(200).json(member);
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }

}

/**
 * 新增个会员组
 *
 * 必要参数:
 * name:会员类型名称
 *
 */
exports.addMembership = async function (req, res, next) {
    req.checkBody('name').notEmpty();
    // TODO shenhaiyang check more
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }

    const userId = req.user.id;
    const body = req.body;

    // --todo
    // 如果有subdomain/name，需要检查sub-domain/name是否被占用
    // 另外这个检查，需要提出一个对外的接口，用户在输入后，前端可以调用来检查是否可用
    if (!body.subDomain) {

    }

    const membership = {
        userId,
        name: body.name,
        logo: body.logo,
        description: body.description,
        subDomain: body.subDomain,
        status: 'normal',
        count: 0,
        notify: {
            needNotify: false,
        },
        duesType: 'FREE',
    };

    // 在使用二级参数的时候，如果不是必填，则不能直接引用，否则当参数不存在的时候
    // 会因为引用undefined的成员而导致程序crash
    const notify = body.notify || {};
    if (notify.needNotify) {
        membership.notify.needNotify = true;
        membership.notify.beforeDays = notify.beforeDays;
        membership.notify.notifyType = notify.notifyType;
    }

    if (body.duesType !== 'FREE') {
        membership.duesType = body.duesType;
        membership.duesCurrency = body.duesCurrency;
        membership.duesAmount = body.duesAmount;
        membership.duesNotice = body.duesNotice;
    }

    if (!_.isEmpty(body.discountPrices)) {
        let discountPrices = new Array(body.discountPrices.length);
        for (let i=0; i<body.discountPrices.length; i++) {
            discountPrices[i] = {
                discountPriceId: nextId(),
                minCount: body.discountPrices[i].minCount,
                discountPrice: body.discountPrices[i].discountPrice
            }
        }
        membership.discountPrices = discountPrices;
    }


    // TODO shenhaiyang 收集项

    try {
        const membershipGroup = await Member.addMembership(membership);
        res.status(200).send({ id: membershipGroup.id });
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message,
        });
    }
};


/** 邀请会员 */
exports.inviteMembers = async function (req, res, next) {
    req.checkBody('emails').notEmpty();
    req.checkBody('wantToSay').notEmpty();
    // TODO shenhaiyang check more
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }
    const body = req.body;
    const emails = body.emails;
    const wantToSay = req.sanitize('wantToSay').escape(); // 想说的话
    // TODO shenhaiyang 发送邮件邀请
};

exports.updateMembership = async function (req, res, next) {
    req.checkBody('id').notEmpty();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }

    const body = req.body;
    try {
        const orginalMembership = await Member.getMembershipById(body.id, ['id']);
        if (_.isEmpty(orginalMembership)) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBERSHIP_NOT_EXSIT, responseText: 'Membership group does not exist!',
            });
        }
        if (req.user.id !== orginalMembership.userId) {
            return next({
                statusCode: 403, errorCode: errorCodes.ERR_PERMISSION_DENIED, responseText: 'Permission denied!',
            });
        }

        // TODO shenhaiyang

        const membershipUpdate = _.cloneDeep(body);
        delete membershipUpdate.id;
        const updatedMembership = await Member.updateMembership(body.id, membershipUpdate);

        res.status(200).send({ id: updatedMembership.id });
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message,
        });
    }
};

function __getDiscoutPrice(duesUnit, discountPrices, duesAmount) {
    let price = duesAmount;
    for (i=0; i<discountPrices.length; i++) {
        if (duesUnit >= discountPrices[i].minCount && price > discountPrices[i].discountPrice) {
            price = discountPrices[i].discountPrice;
        }
    }
    return price;

}
exports.addMemberOrder = async function (req, res, next) {
    const body = req.body;
    req.checkBody('membershipId').notEmpty();
    req.checkBody('memberId').notEmpty();
    req.checkBody('email').isEmail();
    req.checkBody('payMethod').notEmpty();
    req.checkBody('duesUnit').isInt();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }
    try {
        const membership = await Member.getMembershipById(body.membershipId);
        if (_.isEmpty(membership)) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBERSHIP_NOT_EXSIT, responseText: 'Membership does not exist!',
            });
        }
        if (fixParams.MEMBER_CONST.DUES_TYPE_FREE === membership.duesType) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBERSHIP_NOT_EXSIT, responseText: 'Membership is Free!',
            });
        }
        const member = await Member.getMemberById(body.memberId);
        if (_.isEmpty(member)) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBER_NOT_EXSIT, responseText: 'Member does not exist!',
            });
        }
        const userId = membership.userId;

        let order = {
            membershipId: body.membershipId,
            memberId: body.memberId,
            email: body.email,
            payMethod: body.payMethod,
            payStatus: fixParams.ORDER_STATUS.ORDER_STATUS_PAID_NONE,
            // orderIpAddress: ,
            currency: membership.duesCurrency,
            //totalPrice: Big(membership.duesAmount).times(Big(body.duesUnit)).round(2, 3).toString(),
            orderDetail: {
                duesType: membership.duesType,
                duesUnit: body.duesUnit,
                duesPricePerUnit: membership.duesAmount,
                discountPrices: membership.discountPrices
            },
        };
        if (_.isEmpty(membership.discountPrices)) {
            order.totalPrice = Big(membership.duesAmount).times(Big(body.duesUnit)).round(2, 3).toString();
        } else {
            const discountPrice = __getDiscoutPrice(body.duesUnit, membership.discountPrices, membership.duesAmount);
            order.totalPrice = Big(discountPrice).times(Big(body.duesUnit)).round(2, 3).toString();
        }
        let addDays = 0;
        if (fixParams.MEMBER_CONST.DUES_TYPE_MONTH === order.orderDetail.duesType) {
            addDays = fixParams.MEMBER_CONST.DUES_MONTH_DAYS * order.orderDetail.duesUnit
        } else if (fixParams.MEMBER_CONST.DUES_TYPE_SEASON === order.orderDetail.duesType) {
            addDays = fixParams.MEMBER_CONST.DUES_SEASON_DAYS * order.orderDetail.duesUnit
        } else if (fixParams.MEMBER_CONST.DUES_TYPE_YEAR === order.orderDetail.duesType) {
            addDays = fixParams.MEMBER_CONST.DUES_YEAR_DAYS * order.orderDetail.duesUnit
        }
        order.addDays = addDays;
        const user = await User.getUserById(userId, ['memberFeePercent']);
        if (_.isEmpty(user) && _.isEmpty(user.memberFeePercent)) {
            order.eventdoveFee = Big(order.totalPrice).times(user.memberFeePercent).div(Big(100)).round(2, 3).toString();
        } else {
            order.eventdoveFee = Big(order.totalPrice).times(Big(0.025)).round(2, 3).toString();
        }

        await Member.addMemberOrder(order);
        res.status(200).send();
    } catch (e) {
        logger.error(e);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

/**
 * 会员支付测试
 */
exports.payMemberOrder = async function (req, res, next) {
    const body = req.body;
    req.checkBody('membershipId').notEmpty();
    req.checkBody('memberId').notEmpty();
    req.checkBody('email').isEmail();
    req.checkBody('payMethod').notEmpty();
    req.checkBody('duesUnit').isInt();
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return next({
            statusCode: 400, errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: util.inspect(result.array()),
        });
    }
    try {
        const membership = await Member.getMembershipById(body.membershipId);
        if (_.isEmpty(membership)) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBERSHIP_NOT_EXSIT, responseText: 'Membership does not exist!',
            });
        }
        if (fixParams.MEMBER_CONST.DUES_TYPE_FREE === membership.duesType) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBERSHIP_NOT_EXSIT, responseText: 'Membership is Free!',
            });
        }
        const member = await Member.getMemberById(body.memberId);
        if (_.isEmpty(member)) {
            return next({
                statusCode: 400, errorCode: errorCodes.MEMBER_NOT_EXSIT, responseText: 'Member does not exist!',
            });
        }
        const userId = membership.userId;
        let order = {
            membershipId: body.membershipId,
            memberId: body.memberId,
            email: body.email,
            payMethod: body.payMethod,
            payStatus: fixParams.ORDER_STATUS.ORDER_STATUS_PAID_NONE,
            // orderIpAddress: ,
            currency: membership.duesCurrency,
            //totalPrice: Big(membership.duesAmount).times(Big(body.duesUnit)).round(2, 3).toString(),
            orderDetail: {
                duesType: membership.duesType,
                duesUnit: body.duesUnit,
                duesPricePerUnit: membership.duesAmount,
                discountPrices: membership.discountPrices
            },
        };
        if (_.isEmpty(membership.discountPrices)) {
            order.totalPrice = Big(membership.duesAmount).times(Big(body.duesUnit)).round(2, 3).toString();
        } else {
            const discountPrice = __getDiscoutPrice(body.duesUnit, membership.discountPrices, membership.duesAmount);
            order.totalPrice = Big(discountPrice).times(Big(body.duesUnit)).round(2, 3).toString();
        }
        let addDays = 0;
        if (fixParams.MEMBER_CONST.DUES_TYPE_MONTH === order.orderDetail.duesType) {
            addDays = fixParams.MEMBER_CONST.DUES_MONTH_DAYS * order.orderDetail.duesUnit
        } else if (fixParams.MEMBER_CONST.DUES_TYPE_SEASON === order.orderDetail.duesType) {
            addDays = fixParams.MEMBER_CONST.DUES_SEASON_DAYS * order.orderDetail.duesUnit
        } else if (fixParams.MEMBER_CONST.DUES_TYPE_YEAR === order.orderDetail.duesType) {
            addDays = fixParams.MEMBER_CONST.DUES_YEAR_DAYS * order.orderDetail.duesUnit
        }
        order.addDays = addDays;
        const user = await User.getUserById(userId, ['memberFeePercent']);

        if (_.isEmpty(user) && _.isEmpty(user.memberFeePercent)) {
            order.eventdoveFee = Big(order.totalPrice).times(user.memberFeePercent).div(Big(100)).round(2, 3).toString();
        } else {
            order.eventdoveFee = Big(order.totalPrice).times(Big(0.025)).round(2, 3).toString();
        }

        order = await Member.addMemberOrder(order);
        // 根据币种选择支付方式
        if (fixParams.CURRENCY_NAME.YUAN === membership.duesCurrency) {
            // TODO 微信支付
            const data = {
                out_trade_no: order.id,
                subject: membership.name,
                total_fee: order.totalPrice,
            };
            res.contentType('text/html');
            res.send(Alipay.directPayByUser(data));
        } else if (fixParams.CURRENCY_NAME.DOLLAR === membership.duesCurrency) {
            const data = {
                orderId: order.id,
                memo: membership.name,
                // TODO 这里要从钱包里取值
                email: membership.paymentAccountId,
                amount: order.totalPrice,
                eventdoveFee: order.eventdoveFee
            };
            const redirectUrl = await PayPal.sharePay(data);
            logger.info('Redirect to %s', redirectUrl);
            res.redirect(redirectUrl);
        }

    } catch (e) {
        logger.error(e);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: e.message,
        });
    }
};

exports.getMembershipAndPageIndex = async function (req, res, next) {

    const query = req.query;

    try {

        const data = await Member.getMembershipAndPageIndex(query);

        const paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);
        return res.status(200).send(paginate);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};
