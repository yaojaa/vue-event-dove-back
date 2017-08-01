/**
 * Created by Henry on 2017/2/24.
 */
'use strict';

const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const myutil = require('../util/util');
const nextId = myutil.nextId;
const thinky = require('../util/thinky');
const type = thinky.type;
const r = thinky.r;
const fixParams = require('../util/fixParams');
const Promise   = require('bluebird');
const _ = require('lodash');
const moment = require('moment');

/** 会员组 */
const MembershipFields = {
    id: type.string(),// 会员组主键id
    name: type.string(),// 会员组名称
    logo: type.string(),// 会员组logo
    descripiton: type.string(),// 会员组描述
    userId: type.string(),// 创建此会员组的用户id
    subDomain: type.string(),// 二级域名
    status: type.string().enum('normal','inactive','deleted'),// 会员组状态
    count: type.number().integer(),// 当前人数
    notify: {
        needNotify: type.boolean(),
        beforeDays: type.number().integer(),
        notifyType: type.string().enum('email','sms','none'),
    },// 通知类型
    memberInfoCollections: [{
        itemId              : type.string(),// 本条目的id
        itemName            : type.string().required(),// 自定义采集项的名称,用来当做创建订单时收集项的key,必须是英文
        displayName         : type.string().required(),// 显示给用户看的名字
        fieldType           : type.string().required(),// 采集项类型，与FieldType model中的类型对应
        isRequired          : type.boolean().default(false),// 是否必填项
        displayOrder        : type.number().integer().default(0),// 显示时的排序
        isDeleted           : type.boolean().default(false),// 是否已删除
        isUnique            : type.boolean().default(false),// 是否唯一采集项
        itemValues          : [],// 存储dropbox,radio,checkbox等类型的值对象,
        value               : type.string(),// 表单收集项的默认值
        rules               : {},// 表单收集项验证的规则
        attr                : {},// 表单收集项的属性,
        description         : type.string(),// 表单收集项的描述
        isDisplayDescription: type.boolean(),// 是否显示表单的描述
    }],// 会员组要求的表单收集项信息
    duesType: type.string().enum(
        fixParams.MEMBER_CONST.DUES_TYPE_FREE,
        fixParams.MEMBER_CONST.DUES_TYPE_MONTH,
        fixParams.MEMBER_CONST.DUES_TYPE_SEASON,
        fixParams.MEMBER_CONST.DUES_TYPE_YEAR
    ),// 会费类型
    duesCurrency: type.string().enum(
        fixParams.CURRENCY_NAME.DOLLAR,
        fixParams.CURRENCY_NAME.YUAN
    ),// 会费币种
    paymentAccountId: type.string(),// 收款账户id
    duesAmount: type.number(),// 会费金额
    discountPrices: [{
        discountPriceId: type.string().required(),
        minCount: type.number().integer().required(),
        discountPrice: type.number().required(),
    }],// 折扣价设置
    duesNotice: type.string(),// 会费通知
    ctime: type.date(),
    utime: type.date()
};

/** 会员 */
const MemberFields = {
    id: type.string(),// 会员主键id
    membershipId: type.string(),// 所属会员组id
    userId: type.string(),// 关联的用户id
    name: type.string(),// 会员名称
    email: type.string(),// 会员邮箱
    externalId: type.string(),// 第三方系统会员Id
    memberInfo: [{}],// 会员信息详情
    status: type.string().enum('active', 'inactive', 'deleted'),// 会员状态
    lastNotifyTime: type.date(),// 上次发送提醒的时间
    joinTime: type.date(),// 会员加入时间
    expireTime: type.date(),// 会员过期时间
    validation: {
        uuid: type.string(),
        expireTime: type.date(),
    },// 会员激活时存储token使用的,可以不使用这个字段
    ctime: type.date(),
    utime: type.date()

};

/** 会员订单 */
const MemberOrderFields = {
    id: type.string(),
    membershipId: type.string(),// 订单关联的会员组主键id
    memberId: type.string(),// 订单关联的会员主键id
    email: type.string(),
    payMethod: type.string().enum(
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL
    ),// 支付方式
    payStatus: type.string(),// 支付状态
    paymentTime: type.date(),// 支付时间
    returnOrderNum: type.string(),// 支付平台流水号
    orderIpAddress: type.string(),// 订单的ip地址
    currency: type.string().enum(
        fixParams.CURRENCY_NAME.YUAN,
        fixParams.CURRENCY_NAME.DOLLAR
    ),// 币种
    totalPrice: type.number(),// 总价
    channelFee: type.number(),// 第三方通道费
    eventdoveFee: type.number(),// 会鸽服务费
    payPalPayKey: type.string(),// for PayPal adaptive payment
    payPalAccount: type.string(),// 贝宝账号
    orderDetail: {
        duesType: type.string().enum(
            fixParams.MEMBER_CONST.DUES_TYPE_MONTH,
            fixParams.MEMBER_CONST.DUES_TYPE_SEASON,
            fixParams.MEMBER_CONST.DUES_TYPE_YEAR
        ),// 会费类型
        duesUnit: type.number().integer(),// 购买的单位(月、季、年)数
        duesPricePerUnit: type.number(),// 每单位(月、季、年)的价格
    },
    addDays: type.number(),// 支付这个订单后会员的过期时间expireTime增加的天数
    ctime: type.string(),
    utime: type.string(),
};

const MEMBER_TABLE = 'Member';
const MEMBERSHIP_TABLE = 'Membership';
const MEMBER_ORDER_TABLE = 'MemberOrder';

const allMembershipColumns = myutil.getKeyArrayFromObject(MembershipFields);
const allMemberColumns = myutil.getKeyArrayFromObject(MemberFields);
const allMemberOrderColumns = myutil.getKeyArrayFromObject(MemberOrderFields);


const Membership = thinky.createModel(MEMBERSHIP_TABLE, MembershipFields);
Membership.ensureIndex('userId');
Membership.ensureIndex('name');
Membership.ensureIndex('subDomain');

const Member = thinky.createModel(MEMBER_TABLE, MemberFields);
Member.ensureIndex('userId');
Member.ensureIndex('name');
Member.ensureIndex('email');
Member.ensureIndex('mobile');

const MemberOrder = thinky.createModel(MEMBER_ORDER_TABLE, MemberOrderFields);

exports.MembershipFields = MembershipFields;
exports.MembershipModel = Membership;

exports.MemberFields = MemberFields;
exports.MemberModel = Member;

exports.addMembership = function (membership) {
    membership.id = nextId();
    membership.ctime = r.now();
    return Membership.save(membership);
};

exports.addMember = function (member) {
    member.id = nextId();
    member.ctime = r.now();
    return Member.save(member);
};

exports.addMemberOrder = function (memberOrder) {
    memberOrder.id = `M${nextId()}`; // 会员订单以M开头
    memberOrder.ctime = r.now();
    return MemberOrder.save(memberOrder);
};

exports.updateMembership = function (id, membership) {
    membership.utime = r.now();
    return Membership.get(id).update(membership);
};

exports.updateMember = function (id,member) {
    member.utime = r.now();
    // return Member.get(id).update(member);
    return r.table(MEMBER_TABLE).get(id).update(member);
};

exports.updateMemberOrder = function (id,memberOrder) {
    memberOrder.utime = r.now();
    // return MemberOrder.get(id).update(memberOrder);
    return r.table(MEMBER_ORDER_TABLE).get(id).update(memberOrder);
};

exports.getMembershipById = function (id, customizedColumns) {
    const columns = _.isEmpty(customizedColumns) ? allMembershipColumns : customizedColumns;
    //return r.table(MEMBERSHIP_TABLE).get(id).pluck(columns);
    return r.table(MEMBERSHIP_TABLE).get(id);
};

exports.tryGetMembershipById = async function (id, customizedColumns) {

    let info = {};

    try {

        const columns = _.isEmpty(customizedColumns) ? allMembershipColumns : customizedColumns;

        info = await  r.table(MEMBERSHIP_TABLE).get(id).pluck(columns);

    } catch (err) {
        logger.error('tryGetMembershipById ', err);
    }

    return info;
};

exports.getMemberById = function (id, customizedColumns) {
    const columns = _.isEmpty(customizedColumns) ? allMemberColumns : customizedColumns;
    //return r.table(MEMBER_TABLE).get(id).pluck(columns);
    return r.table(MEMBER_TABLE).get(id);
};

exports.tryGetMemberById = async function (id, customizedColumns) {

    let info = {};

    try {

        const columns = _.isEmpty(customizedColumns) ? allMemberColumns : customizedColumns;

        info = await r.table(MEMBER_TABLE).get(id).pluck(columns);

    } catch (err) {
        logger.error('tryGetMemberById ', err);
    }

    return info;
};

exports.getMembersByMembershipId = function (membershipId, customizedColumns) {
    const columns = _.isEmpty(customizedColumns) ? allMemberColumns : customizedColumns;
    return r.table(MEMBER_TABLE).getAll(membershipId, { index: 'membershipId' }).pluck(columns);
};

exports.getMemberOrderById = function (id, customizedColumns) {
    const columns = _.isEmpty(customizedColumns) ? allMemberOrderColumns : customizedColumns;
    //return r.table(MEMBER_ORDER_TABLE).get(id).pluck(columns);
    return r.table(MEMBER_ORDER_TABLE).get(id);
};


exports.getMembershipByUserId = function (userId, customizedColumns) {
    const columns = _.isEmpty(customizedColumns) ? allMembershipColumns : customizedColumns;
    return r.table(MEMBERSHIP_TABLE).getAll(userId, { index: 'userId' }).pluck(columns);
};

exports.getMembershipBySubDomain = function (subDomain, customizedColumns) {
    const columns = _.isEmpty(customizedColumns) ? allMembershipColumns : customizedColumns;
    return r.table(MEMBERSHIP_TABLE).getAll(subDomain, { index: 'subDomain' }).pluck(columns);
};



exports.getMembershipByName = function(name, customizedColumns){
  const columns = _.isEmpty(customizedColumns) ? allMembershipColumns : customizedColumns;
  return r.table(MEMBERSHIP_TABLE).getAll(userId, { index: 'name' }).pluck(columns);
}

exports.getMemberByUserId = function (userId, customizedColumns) {
    const columns = _.isEmpty(customizedColumns) ? allMemberColumns : customizedColumns;
    return r.table(MEMBER_TABLE).getAll(userId, { index: 'userId' }).pluck(columns);
};

exports.getMemberByEmail = function (email, customizedColumns) {
    const columns = _.isEmpty(customizedColumns) ? allMemberColumns : customizedColumns;
    return r.table(MEMBER_TABLE).getAll(email, { index: 'email' }).pluck(columns);
};

exports.deleteMembershipById = function (id) {
    return Membership.get(id).delete();
};

exports.deleteMemberById = function (id) {
    return Member.get(id).delete();
};

exports.deleteMemberOrderById = function (id) {
    return MemberOrder.get(id).delete();
};

exports.searchMembers = function (opts) {
    const searchText = opts.searchText;
    const beforeDays = opts.beforeDays;
    const membershipId = opts.membershipId;
    let totalCount  = parseInt(opts.total) || -1;// 总记录数
    const currentPage = parseInt(opts.page) || 1;
    const rowsPerPage = parseInt(opts.limit) || 15;
    const skip        = ( currentPage - 1 ) * rowsPerPage;
    const timeZone    = "+08:00";

    let mf = Member;
    mf = mf.filter(r.row('membershipId').eq(membershipId));
    if (searchText) {
        mf = mf.filter(r.row('email').eq(searchText)).or(r.row('name').match('(?i)' + searchText));
    }
    if (beforeDays) {
        let date = moment();
        date.add(beforeDays, 'd')
        mf.filter(r.row('expireTime') < r.time(
            date.get('year'), date.get('month') + 1, date.get('date'), timeZone))
    }
    if (totalCount === -1) {
        totalCount = mf.count().execute();
    }

    var items = mf.slice(skip, skip + rowsPerPage).run();

    return Promise.props({count: totalCount, items: items});
};

// 根据用户Id 分页获取会员组
exports.getGroupsByUserIdWithPageIndex = function (params, attributeNames) {
    const columns  = _.isEmpty(attributeNames) ? _.keys(MembershipFields) : attributeNames;
    var userId     = params.userId;
    var totalCount = parseInt(params.total) || -1;// 总记录数
    var page       = parseInt(params.page)  || 1;      // 第几页
    var limit      = parseInt(params.limit) || 10;     // 每页显示记录数
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "id";

    var items =  r.table(MEMBERSHIP_TABLE).filter({userId: userId}).orderBy(r.desc(orderBy)).slice(skip, skip + limit).pluck(columns).run();
    if (totalCount === -1) {
        totalCount = r.table(MEMBERSHIP_TABLE).filter({userId: userId}).count().run();
    }
    return Promise.props({items: items, count: totalCount});
};

// 获取会员组下会员总数
exports.getMemberCountWithGroup = function(membershipId){
    return Member.filter({membershipId: membershipId}).count().execute();
};

function __buildMembershipFilter(params) {
    let membershipFilter = Membership;
    const status         = params.status;
    const name           = params.name;

    if (!_.isUndefined(status) && !_.isEmpty(status)) {
        membershipFilter = membershipFilter.filter({status: status});
    }

    if (!_.isUndefined(name) && !_.isEmpty(name)) {
        membershipFilter = membershipFilter.filter(r.row('name').match('(?i)' + name));
    }

    return membershipFilter;

}

exports.getMembershipAndPageIndex = function (params) {
    var membershipFilter = __buildMembershipFilter(params);
    var totalCount       = parseInt(params.total) || -1;// 总记录数
    var page             = parseInt(params.page) || 1;
    var limit            = parseInt(params.limit) || 10;
    var skip             = ( page - 1 ) * limit;
    var orderBy          = params.orderBy || "ctime";

    var items = membershipFilter.orderBy(r.asc(orderBy)).slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = membershipFilter.count().execute();
    }

    return Promise.props({items: items, count: totalCount});
};
