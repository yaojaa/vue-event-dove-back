'use strict';

const _              = require('lodash');
const myutil         = require('../util/util.js');
const thinky         = require('../util/thinky.js');
const fixParams      = require('../util/fixParams.js');
const type           = thinky.type;
const r              = thinky.r;
const nextId         = myutil.nextId;
const Promise        = require('bluebird');
const moment         = require('moment');
const Big            = require('big.js');
const Queue          = require('../util/queue');
const exchangeName   = 'event.delay.exchange';
const queueName      = 'event.delay.queue';
const settings       = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const RabbitMQConfig = require("../conf/settings").RabbitMQConfig;
const redisUtil      = require('../util/redisUtil');
const redisClinet    = redisUtil.redisClinet;
const REDIS_PREFIX   = require('../util/fixParams').REDIS_PREFIX;
const Recommend      = require('./selectObjectRecommend');
const Order          = require('./order.js');

exports.exchangeName = exchangeName;
exports.queueName    = queueName;

var EventFields = {
    id              : type.string(),
    title           : type.string().required(),// 活动标题
    breakUpTitle2   : [],   // 拆分词以两个词拆分
    breakUpTitle3   : [],   // 拆分词以三个词拆分
    content         : [],// 活动详情
    logoUrl         : type.string(),// 活动图标
    bannerUrl       : type.string(),// 活动banner地址
    thumbnail       : type.string().default(function () {
        return this.bannerUrl;
    }),// 活动的缩略图
    mobileBannerUrl : type.string().default(function () {
        return this.bannerUrl;
    }),// 移动端活动banner地址
    startTime       : type.date().required(),// 活动开始时间
    endTime         : type.date().required(),// 活动截止时间
    pubTime         : type.date(), // 活动发布时间
    isPublic        : type.boolean().default(true),// 是否公开
    smsNotice       : type.boolean().default(true),// 是否发送短信通知
    customSmsContent: type.string().default(
        function () {
            return `您参加“${this.title}”的签到码是 #签到码#。详见 #电子票#`;
        }
    ),// 自定义购票成功短信
    userId          : type.string(),// 注册用户Id
    organizers      : [{  // 主办方,可以为多个主办方
        name   : type.string(),       // 主办方名称
        website: type.string(),        // 主办方官网地址
        logo   : type.string(),        // 主办方logo
    }],
    contact         : {
        mobile: type.string(),
        email : type.string()
    },// 此次活动的联系方式
    categories      : [type.string()],// 活动分类
    keyWords        : [type.string()],// 关键字
    status          : type.string()
                          .enum(
                              fixParams.EVENT_STATUS.EVENT_STATUS_UNPUBLISHED,
                              fixParams.EVENT_STATUS.EVENT_STATUS_PUBLISHED,
                              fixParams.EVENT_STATUS.EVENT_STATUS_AUDIT_REJECTED,
                              fixParams.EVENT_STATUS.EVENT_STATUS_HANG_UP,
                              fixParams.EVENT_STATUS.EVENT_STATUS_CANCELED,
                              fixParams.EVENT_STATUS.EVENT_STATUS_FINISHED
                          )
                          .default(fixParams.EVENT_STATUS.EVENT_STATUS_UNPUBLISHED),// 活动状态
    emailBalance    : type.number().integer().default(500),  // 免费邮件数量 不分专业版和免费版统一默认 500条
    domainName      : type.string(),    // 活动域名

    // address
    country        : type.string(),
    province       : type.string(),
    city           : type.string(),
    zipCode        : type.string(),
    detailedAddress: type.string(),
    lng            : type.number(),
    lat            : type.number(),
    onlineAddress  : type.boolean(),
    geohash        : type.string(),

    // paymentSettings
    paymentMethod       : [
        type.string().enum(
            // 线上支付方式
            fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
            fixParams.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL,
            fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,
            fixParams.PAYMENT_METHOD.PAYMENT_METHOD_EBANK,
            // 线下支付方式
            fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ONSITE,
            fixParams.PAYMENT_METHOD.PAYMENT_METHOD_TRANSFER
        )
    ],// 活动支持的支付方式
    paymentAccountIds   : [type.string()],// 收款账户主键id数组,paymentMethod里包含paypal或者transfer时此值不能为空
    paymentPriceUnit    : type.string()
                              .enum(
                                  fixParams.CURRENCY_NAME.YUAN,
                                  fixParams.CURRENCY_NAME.DOLLAR
                              ).default(fixParams.CURRENCY_NAME.YUAN).required(),// 收款币种
    paymentPriceUnitSign: type.string()
                              .enum(
                                  fixParams.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_YUAN,
                                  fixParams.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_DOLLAR
                              ).default(fixParams.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_YUAN).required(),// 收款币种

    // serviceFee
    basePrice: type.number().default(0),// 基础服务费(服务费低于该额度以该额度计)    默认 0: 无
    percent  : type.number().default(0),// 票服务费比例(占票价百分比)   默认为 0%
    maxFee   : type.number().default(0),// 最高服务费(服务费超过该额度以该额度收取) 0: 无

    // 发票设置
    isProvideInvoice: type.boolean().default(false),// 是否提供发票,默认不能,值为false
    invoiceSetting  : {
        type         : [
            type.string().enum(
                fixParams.INVOICE_TYPE.INVOICE_TYPE_NORMAL,
                fixParams.INVOICE_TYPE.INVOICE_TYPE_SPECIAL
            )
        ],// 发票类型
        serviceItems : [type.string()],// 服务项目
        taxPoint     : type.number(),// 税点设置,不需要税点请填写0,如需要收取税点设置为对应的值
        deliverMethod: [
            type.string().enum(
                fixParams.INVOICE_DELIVER_METHOD.INVOICE_DELIVER_METHOD_ONSITE,
                fixParams.INVOICE_DELIVER_METHOD.INVOICE_DELIVER_METHOD_EXPRESS
            )
        ],// 发票领取方式,onsite现场领取,express快递领取
        deliverFee   : type.number(),// 快递费,包邮请设置为0
        isSplitable  : type.boolean().default(false),// 是否能拆分发票,拆分开票是指将订单支付总金额根据每个参会者对应购买价分开开票
    },

    isSelfRefundable: type.boolean().default(false),// 是否开启用户自主退票,默认不能,值为false
    refundSettings  : [{
        daysBeforeStart: type.number(),// 距活动开始剩余天数
        refundRate     : type.number(),// 应扣退票费百分比,其中0代表全额退款,100代表不允许退款
    }],
    tickets         : [{
        ticketId      : type.string(),// 票的主键id
        name          : type.string().required(),// 票名称
        describe      : type.string(),// 门票说明
        needAudit     : type.boolean().default(false),// 是否审核
        defaultPrice  : type.number().required(),// 原价
        startSalesTime: type.date().default(function () { return new Date()}),// 开售时间 不限制必填 默认创建时间
        endSalesTime  : type.date().required(),// 截止时间
        totalCount    : type.number().integer().required(),// 总库存
        status        : type.string()
                            .enum("normal", "deleted")
                            .default("normal"),// 票的状态

        minCount: type.number().integer().default(1),// 每个订单最少购买张数 默认: 1
        maxCount: type.number().integer().default(10),// 每个订单最大购张数 默认: 100

        isServiceFeeInclude : type.boolean().default(true),// 是否包含服务费
        ticketServiceFee    : type.number().default(0),// 服务费
        isMemberOnlyTicket  : type.boolean().default(false),// 是否只允许会员进行购买
        applyToMemberships  : [type.string()],// 允许购买的此门票的会员组主键id
        isAllowGroupPurchase: type.boolean().default(false),// 是否允许团购
        isRefundable        : type.boolean().default(false),// 该门票是否能退票,默认不能,值为false

        // 团购设置
        groupPurchaseTicketSetting: {
            minGroupCount   : type.number().integer(),// 团购最少购买张数
            preferentialType: type.string().enum("fixed", "rate"),// 优惠方式 fixed(优惠金额),rate(打几折)
            value           : type.number(),// 值fixed时代表直接优惠了多少钱,值为rate代表打几折
            isAllowDiscount : type.boolean().default(true)// 团购基础上是否允许使用优惠券    默认: 允许
        },

        // 早鸟票设置
        earlyBirdTicketSetting: {
            startTime: type.date().default(function () {return this.startSalesTime;}),
            endTime  : type.date(),
            price    : type.number()
        }
    }],

    isCollectAttendees: type.boolean().default(true),// 是否收集参会者信息,默认true收集,false为只收集购票者信息
    // 活动设置采集项
    collectItems      : [{
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
    }],
    /** 是否专业版 */
    isVIP             : type.boolean().default(false),

    browseCount       : type.number().default(0),// 活动浏览次数
    userBrowseCount   : type.number().default(0),// 活动浏览用户数
    audited           : type.boolean().default(false),// 该条记录是否已经审计过
    auditNotes        : type.string(),// 审核被拒绝时填写的被拒原因
    /** 微信邀请函设置 **/
    sendWXInvitation  : type.boolean().default(false), //是否发送活动邀请开关
    invitationTemplate: type.string().default('1'), //微信模板
    ctime             : type.date().default(function () { return new Date();}),// 记录创建时间
    utime             : type.date().default(function () { return new Date();})// 记录更新时间
};

var Event = thinky.createModel("Event", EventFields);

exports.EventModel  = Event;
exports.EventFields = EventFields;

// secondary index
const EVENT_INDICES = ['userId', 'geohash', 'title', 'startTime', 'endTime', 'domainName', 'breakUpTitle3', 'breakUpTitle2'];

_.each(EVENT_INDICES, function (index) {
    if (myutil.inArray(index, ['breakUpTitle3', 'breakUpTitle2'])) {
        Event.ensureIndex(index, {multi: true});
    } else {
        Event.ensureIndex(index);
    }

});

exports.addEvent = function (data) {
    var newEvent = new Event(data);
    newEvent.id  = nextId();
    return newEvent.save();
};

exports.updateEventById = function (evtId, update, options) {
    update         = myutil.dealObjectTime(update);
    update.utime   = new Date();
    update.audited = false;
    return Event.get(evtId).update(update).run();
};

// 更新门票里的一条记录
exports.updateEventTicketById = function (evtId, update, options) {
    return Event.get(evtId).update({
        tickets: r.row('tickets').changeAt(options.ticketIndex, update),
        utime  : new Date()
    }).run();
};

exports.getEventById    = function (eventId, attributeNames, options) {
    attributeNames = _.isEmpty(attributeNames) ? _.keys(EventFields) : attributeNames;
    return r.table("Event").get(eventId).pluck(attributeNames).run();
};
// 删除会议
exports.deleteEventById = async function (eventId, req) {
    const status    = ['unpublished', 'auditRejected', 'canceled']
    let isHasSuitEv = await r.table("Event").filter(function (doc) {
        return r.expr(status).contains(doc("status")).and(doc("id").eq(eventId));
    });
    let errMessage;
    if (_.isEmpty(isHasSuitEv)) {
        errMessage = req.__('wrong_state');
        return [false, errMessage];
    }
    let isEvHasOrder = await r.table("Order").filter({"eventId": eventId})
    if (!_.isEmpty(isEvHasOrder)) {
        errMessage = req.__('event_has_order');
        return [false, errMessage];
    } else {
        let result = await r.table("Event").filter({'id': eventId}).delete()
        return [true, null]
    }

};

// 取消会议
exports.cancelEventByEventId = async function (eventId) {
    return r.table("Event").get(eventId).update({'status': fixParams.EVENT_STATUS.EVENT_STATUS_CANCELED});
};

exports.getEventsByUserIdAndPageIndex = function (params, attributeNames) {
    attributeNames  = _.isEmpty(attributeNames) ? _.keys(EventFields) : attributeNames;
    var eventFilter = __buildEventFilter(params);
    var totalCount  = parseInt(params.total) || -1;// 总记录数
    var page        = parseInt(params.page) || 1;// 第几页
    var limit       = parseInt(params.limit) || 10;// 每页显示记录数
    var skip        = ( page - 1 ) * limit;
    var orderBy     = params.orderBy || "startTime";

    var items = eventFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit).pluck(attributeNames).run();

    if (totalCount === -1) {
        totalCount = eventFilter.count().execute();
    }

    return Promise.props({items: items, count: totalCount});
};

// 拼装搜索条件
function __buildEventFilter(params) {
    var eventStatus = params.eventStatus;
    var userId      = params.userId;
    var title       = params.title;
    var domainName  = params.domainName;
    var eventFilter = Event;

    if (!_.isUndefined(userId) && !_.isEmpty(userId)) {
        eventFilter = eventFilter.filter({userId: userId});
    }

    if (!_.isUndefined(title) && !_.isEmpty(title)) {
        eventFilter = eventFilter.filter(r.row('title').match('(?i)' + title).or(r.row('keyWords').contains(title)));
    }

    if (!_.isUndefined(domainName) && !_.isEmpty(domainName)) {
        eventFilter = eventFilter.filter(r.row('domainName').match('(?i)' + domainName));
    }

    switch (eventStatus) {
        case 'published':// 已发布,进行中
            eventFilter = eventFilter.filter({status: "published"});
            break;
        case 'unpublished':// 未发布
            eventFilter = eventFilter.filter(
                function (eventInfo) {
                    return r.expr(["unpublished", "canceled"])
                            .contains(eventInfo("status"));
                }
            );
            break;
        case 'finished':// 已结束
            eventFilter = eventFilter.filter({status: "finished"});
            break;
        case 'auditRejected':// 审核未通过
            eventFilter = eventFilter.filter(
                function (eventInfo) {
                    return r.expr(["auditRejected", "hangUp"])
                            .contains(eventInfo("status"));
                }
            );
            break;
        default:
    }

    return eventFilter;
}

exports.getEventCountDomainName = function (domainName, options) {
    return r.table("Event").getAll(domainName, {index: "domainName"})
            .count().run();
};

// 根据活动标题查询活动总数
exports.getEventCountTitle = function (title, options) {
    return r.table("Event").getAll(title, {index: "title"}).count().run();
};

// 根据活动标题查询活动
exports.getEventByTitle = function (title, options) {
    return Event.getAll(title, {index: "title"}).run();
};

/**
 * 获得一个用户的所有Event
 * @param userId
 * @param attributeNames
 * @param options
 * @returns {*}
 */
exports.getEventsByUserId = function (userId, attributeNames, options) {
    attributeNames = _.isEmpty(attributeNames) ? _.keys(EventFields) : attributeNames;
    return r.table('Event').getAll(userId, {index: "userId"}).pluck(attributeNames).run();
};

function __buildEventFilter4discover(opts) {

    let ef           = Event;
    const searchText = opts.searchText;
    const category   = opts.category;
    const city       = opts.city;

    // 公开的
    ef = ef.filter(r.row('isPublic').eq(true));

    // 已发布或者已结束的
    ef = ef.filter(
        function (row) {
            return r.expr([
                fixParams.EVENT_STATUS.EVENT_STATUS_PUBLISHED,
                fixParams.EVENT_STATUS.EVENT_STATUS_FINISHED
            ]).contains(row("status"));
        }
    );

    // 标题模糊匹配, 关键字精确匹配只支持一个
    if (searchText) {
        ef = ef.filter(r.row('title').match('(?i)' + searchText).or(r.row('keyWords').contains(searchText)));
    }

    // 时间段成对出现,才做时间判断 YYYY-MM-DD
    if (opts.startDate && opts.endDate) {
        const timeZone   = "Z";
        const startDate  = moment(opts.startDate);
        const endDate    = moment(opts.endDate);
        const startYear  = Number(startDate.format('YYYY'));
        const startMonth = Number(startDate.format('MM'));
        const startDay   = Number(startDate.format('DD'));
        const endYear    = Number(endDate.format('YYYY'));
        const endMonth   = Number(endDate.format('MM'));
        const endDay     = Number(endDate.format('DD'));

        const startRTime = r.time(startYear, startMonth, startDay, timeZone);
        const endRTime   = r.time(endYear, endMonth, endDay, 23, 59, 59, timeZone);

        ef = ef.filter(
            r.row('startTime').during(startRTime, endRTime).or(r.row('endTime').during(startRTime, endRTime))
        );
    }

    if (category) {
        ef = ef.filter(r.row('categories').contains(category));
    }

    if (city) {
        ef = ef.filter(r.row('city').match('(?i)' + city));
    }

    return ef;
}

// 发现活动
exports.discoverEvents = function (opts) {
    const columns     = _.isEmpty(opts.attributeNames) ? _.keys(EventFields) : opts.attributeNames;
    let totalCount    = parseInt(opts.total) || -1;// 总记录数
    const currentPage = parseInt(opts.page) || 1;
    const rowsPerPage = parseInt(opts.limit) || 15;
    const skip        = ( currentPage - 1 ) * rowsPerPage;
    let orderBy       = opts.orderBy;
    const ef          = __buildEventFilter4discover(opts);

    if (!orderBy) {
        orderBy = 'comprehensive';
    }
    let items;
    switch (orderBy) {
        case 'comprehensive' :
            items = comprehensiveInfo();
            break;
        case 'hotClicks' :
            items = hotClicks();
            break;
        case 'latestRelease' :
            items = latestRelease();
            break;
        default:
            items = comprehensiveInfo();
    }
    function hotClicks() {
        return ef.distinct().orderBy(r.desc('browseCount')).slice(skip, skip + rowsPerPage).pluck(columns).run()
    }

    function latestRelease() {
        return eventStatusInOrder(r.desc("pubTime"));
    }

    function comprehensiveInfo() {
        return eventStatusInOrder(r.asc("startTime"));
    }

    function eventStatusInOrder(index) {
        return ef.map({
            going     : r.branch(
                r.row("startTime").gt(r.now()),
                'A',
                r.row("startTime").lt(r.now()).and(r.now().lt(r.row("endTime"))),
                'B',
                'C'
            ),
            thumbnail : r.branch(
                r.row.hasFields("thumbnail"),
                r.row("thumbnail"),
                ''
            ),
            title     : r.row("title"),
            id        : r.row("id"),
            startTime : r.row("startTime"),
            city      : r.branch(
                r.row.hasFields("city"),
                r.row("city"),
                ''
            ),
            endTime   : r.row("endTime"),
            organizers: r.branch(
                r.row.hasFields("organizers"),
                r.row("organizers"),
                []
            ),

            browseCount: r.branch(
                r.row.hasFields("browseCount"),
                r.row("browseCount"),
                ''
            ),
            categories : r.branch(
                r.row.hasFields("categories"),
                r.row("categories"),
                []
            ),
            pubTime    : r.branch(
                r.row.hasFields("pubTime"),
                r.row("pubTime"),
                r.row("utime")
            )
        }).orderBy(r.asc("going"), index).slice(skip, skip + rowsPerPage).pluck(columns).run();
    }

    if (totalCount === -1) {
        totalCount = ef.count().execute();
    }

    return Promise.props({count: totalCount, items: items});
};


// 根据活动标题分词查询活动结果
exports.lenovoDiscoverEvent = function (searchText) {
    var eventRsql = r.table('Event');
    // 标题分词查询
    if (searchText) {
        var textArr = this.getTitleToArr(searchText);
        if (textArr.length >= 3) {
            var breakUpWords = this.getBreakUpTitle(3, textArr);
            // logger.debug("breakUpWords: " + breakUpWords);
            // eventRsql = eventRsql.getAll(r.args(breakUpWords),{index:'breakUpTitle3'});
            eventRsql = eventRsql.getAll(breakUpWords[0], {index: 'breakUpTitle3'});
        } else {
            eventRsql = eventRsql.getAll(searchText, {index: 'breakUpTitle2'});
        }
    }
    ;
    // 公开的
    eventRsql = eventRsql.filter(r.row('isPublic').eq(true));
    // 已发布或者已结束的
    eventRsql = eventRsql.filter(
        function (row) {
            return r.expr([
                fixParams.EVENT_STATUS.EVENT_STATUS_PUBLISHED,
                fixParams.EVENT_STATUS.EVENT_STATUS_FINISHED
            ]).contains(row("status"));
        }
    );
    eventRsql = eventRsql.pluck('id', 'title', 'organizers').filter(r.row('title').match('(?i)' + searchText)).limit(5);

    return eventRsql.run();
};

/**
 * 根据ticketId计算已经出售的总票数
 * @param eventOrders 活动的所有订单
 * @param ticketId 门票id
 * @returns {*}
 */
exports.getSoldTicketCount = function (eventOrders, ticketId) {
    var totalSold = _.reduce(eventOrders, function (sum1, order) {
        return sum1 + _.reduce(order.orderDetails, function (sum2, orderDetail) {
                let isInvalidStatus = myutil.inArray(orderDetail.status, ['reject', 'timeOut', 'cancel', 'partRefund', 'Refunded']);
                let isValidCount    = (ticketId === orderDetail.ticketId) && !isInvalidStatus;
                return isValidCount ? (sum2 + orderDetail.ticketCount) : sum2;
            }, 0);
    }, 0);
    return totalSold;
};

// 根据支付单位获取货比标识符
exports.getPaymentPriceUnitSign = function (paymentPriceUnit) {
    var paymentPriceUnitSign = fixParams.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_YUAN;
    paymentPriceUnit         = paymentPriceUnit || fixParams.CURRENCY_NAME.YUAN;
    switch (paymentPriceUnit) {
        case fixParams.CURRENCY_NAME.YUAN:
            paymentPriceUnitSign = fixParams.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_YUAN;
            break;
        case fixParams.CURRENCY_NAME.DOLLAR:
            paymentPriceUnitSign = fixParams.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_DOLLAR;
            break;
        default:
            paymentPriceUnitSign = fixParams.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_YUAN;
    }
    return paymentPriceUnitSign;
};

// 计算活动的实际签到信息
exports.getCheckedInDetail = async function (eventId) {
    const totalCheckedInCount = await Order.getCheckedInCount(eventId);// 已签到人数
    const totalAttendeesCount = await Order.getAttendeeCount(eventId);// 报名人数

    const checkedInRate = (totalAttendeesCount === 0)
        ? 0 : Number(Big(totalCheckedInCount).div(Big(totalAttendeesCount)).times(100).round(2));
    return {
        totalCheckedInCount: totalCheckedInCount,
        totalAttendeesCount: totalAttendeesCount,
        checkedInRate      : checkedInRate,
    };
};

// 获取一个订单中参会者的签到数量
function __getAttendeesCheckedInCount(attendees) {
    var newAttendees = _.filter(attendees, {isCheckedIn: true});
    return newAttendees.length;
};
//根据活动id获取参会者数量
exports.getAttendeeCountByeventId = async function (id) {
    const orders = await Order.getOrderByEventId(id, ['attendees']);
    let count    = 0;
    for (let item of orders) {
        count += item.attendees.length;
    }
    return count;
}

// 计算活动门票的售票率
exports.getTicketsSoldOutRate = function (tickets, eventOrders) {
    var totalSoldOut = 0;// 总共卖出的门票
    var totalCount   = 0;// 门票的总数量
    _.each(tickets, function (ticketInfo) {
        var soldOut  = exports.getSoldTicketCount(eventOrders, ticketInfo.ticketId);
        totalSoldOut = totalSoldOut + soldOut;
        totalCount   = totalCount + ticketInfo.totalCount;
    });

    const ticketsSoldOutRate = (totalCount === 0) ? 0 : Number(Big(totalSoldOut).div(Big(totalCount)).times(100).round(2));

    return {
        totalSoldOut      : totalSoldOut,
        totalCount        : totalCount,
        ticketsSoldOutRate: ticketsSoldOutRate,
    };
};

// 获取活动子状态
exports.getEventSubStatus = function (startTime, endTime) {
    var subStatus = '';
    var nowTime   = moment();

    if (nowTime < moment(startTime)) {
        subStatus = 'beginInAMinute';// 即将开始,即当前时间在活动开始时间之前
    }

    if ((nowTime >= moment(startTime)) && (nowTime <= moment(endTime))) {
        subStatus = 'inProgress';// 进行中,即当前时间在活动开始时间和结束时间之间
    }

    if (nowTime > moment(endTime)) {
        subStatus = 'finished';// 已结束,即当前时间大于活动结束时间
    }

    return subStatus;
};

// 根据itemName查询表单收集项详情
exports.getFormFieldByName = function (collectItems, itemName) {
    return _.find(collectItems, {itemName: itemName});
};

// 根据票id查询票详情
exports.getTicketByTicketId = function (ticketId, ticketSetting) {
    return _.find(ticketSetting, {ticketId: ticketId});
};

// 获取开票状态列表
exports.getInvoiceStatusList = function (req) {
    var invoiceStatus     = _.values(fixParams.INVOICE_STATUS);
    var invoiceStatusList = [];
    _.each(invoiceStatus, function (invoiceStatusInfo) {
        var i18nKey = "invoice_status_" + invoiceStatusInfo;
        invoiceStatusList.push({name: invoiceStatusInfo, str: req.__(i18nKey)})
    });
    return invoiceStatusList;
};

// 获取发票快递方式列表
exports.getDeliverMethodList = function (req) {
    var deliverMethods    = _.values(fixParams.INVOICE_DELIVER_METHOD);
    var deliverMethodList = [];
    _.each(deliverMethods, function (deliverMethod) {
        var i18nKey = "deliver_method_" + deliverMethod;
        deliverMethodList.push({name: deliverMethod, str: req.__(i18nKey)})
    });
    return deliverMethodList;
};

// 获取发票类型列表
exports.getInvoiceTypeList = function (req) {
    var invoiceTypes    = _.values(fixParams.INVOICE_TYPE);
    var invoiceTypeList = [];
    _.each(invoiceTypes, function (invoiceType) {
        var i18nKey = "invoice_type_" + invoiceType;
        invoiceTypeList.push({name: invoiceType, str: req.__(i18nKey)})
    });
    return invoiceTypeList;
};

// 获取活动时间字符串拼接
exports.getEventTimeStr = function (eventInfo) {
    var eventStartTime = moment(eventInfo.startTime).format('YYYY-MM-DD HH:mm');
    var eventEndTime   = moment(eventInfo.endTime).format('YYYY-MM-DD HH:mm');
    var eventTime      = eventStartTime + ' - ' + eventEndTime;
    return eventTime;
};

// 获取活动地址
exports.getEventLocation = function (req, eventInfo) {
    return eventInfo.onlineAddress ? req.__('online_event') : eventInfo.detailedAddress;
};

// 活动状态
exports.getEventStatusList = function (req) {
    var eventStatusTypes = _.values(fixParams.EVENT_STATUS);
    var eventStatusList  = [];
    _.each(eventStatusTypes, function (eventStatusType) {
        var i18nKey = "event_status_" + eventStatusType;
        eventStatusList.push({name: eventStatusType, str: req.__(i18nKey)})
    });
    return eventStatusList;
};

// 活动分类
exports.getEventCategoriesList = async function (req) {
    const eventCategoryList = await Recommend.getRecommendByObjectType('eventCategory');
    const eventCategories   = _.map(eventCategoryList, function (category) {
        var i18nKey = "event_categories_" + category.objectId;
        var newName = req.__(i18nKey);
        return {
            originName: category.objectId,
            name      : newName,
            value     : category.id,
            img       : category.banner
        }
    });

    return eventCategories;
};

// 计算每种门票的库存
exports.getTicketsSoldOut = function (tickets, eventOrders) {
    var numberOfTicketsRemaining, soldOut;
    var newTickets = [];
    _.each(tickets, function (ticketInfo) {
        soldOut                             = exports.getSoldTicketCount(eventOrders, ticketInfo.ticketId);
        ticketInfo.soldOut                  = soldOut;// 已售出的门票数量
        numberOfTicketsRemaining            = ticketInfo.totalCount - soldOut;
        ticketInfo.numberOfTicketsRemaining = (numberOfTicketsRemaining >= 0) ? numberOfTicketsRemaining : 0;// 可售卖的门票数量
        newTickets.push(ticketInfo);
    });
    return newTickets;
};

// 整理活动详情中的发票设置数据
exports.getInvoiceSetting = function (invoiceSetting, req) {

    invoiceSetting = invoiceSetting || {};

    // 处理发票设置中的发票类型
    const type  = invoiceSetting.type;
    let newType = [];
    _.each(type, function (typeEn) {
        let i18nKey = "invoice_type_" + typeEn;
        newType.push({name: typeEn, str: req.__(i18nKey)});
    });
    invoiceSetting.type            = newType;
    invoiceSetting.invoiceTypeList = exports.getInvoiceTypeList(req);

    // 处理发票设置中的快递方式
    const deliverMethod  = invoiceSetting.deliverMethod;
    let newDeliverMethod = [];
    _.each(deliverMethod, function (deliverMethodEn) {
        let i18nKey = "deliver_method_" + deliverMethodEn;
        newDeliverMethod.push({name: deliverMethodEn, str: req.__(i18nKey)});
    });
    invoiceSetting.deliverMethod     = newDeliverMethod;
    invoiceSetting.deliverMethodList = exports.getDeliverMethodList(req);

    return invoiceSetting;
};

exports.getOrgNameArr = function (eventInfo) {
    var organizers       = eventInfo.organizers;
    var organizerNameArr = _.reduce(organizers, function (organizerName, organizerInfo) {
        return organizerInfo.name ? organizerName.concat(organizerInfo.name) : organizerName;
    }, []);
    return organizerNameArr;
};

// 在指定时间后变更活动状态为已完成
exports.produceFinishedEvent = async function (eventInfo, diffMilliseconds) {
    let options         = {deliveryMode: 2, durable: true, headers: {"x-delay": diffMilliseconds}};
    let payload         = {type: 'finishedEvent', id: eventInfo.id, endTime: eventInfo.endTime};
    let delayedExchange = await Queue.createDelayedExchange(exchangeName, RabbitMQConfig.connUrl);
    Queue.addPublisher(delayedExchange, queueName, exchangeName, payload, options);
};

// 消费变更活动状态的消息
exports.consumeFinishedEvent = async function (msg, _channel) {
    try {
        let payloadStr = msg.content.toString();
        if (_.isEmpty(payloadStr)) { return; }

        let payload = JSON.parse(payloadStr);
        let type    = payload.type;// 消费的类型
        let id      = payload.id;// 主键id
        let endTime = payload.endTime;// 主键id

        if ('finishedEvent' !== type) { return; }

        let eventInfo = await exports.tryGetEventInfo(id, ['status', 'endTime']);

        logger.debug('consumeFinishedEvent....debugInfo');
        logger.debug('payload ', payload);
        logger.debug('eventInfo ', eventInfo);
        logger.debug('consumeFinishedEvent....debugInfo');

        const isIllegalStatus = (eventInfo.status !== fixParams.EVENT_STATUS.EVENT_STATUS_PUBLISHED);
        if (isIllegalStatus) {
            logger.debug('非法状态,不能进行活动完成isIllegalStatus....', isIllegalStatus);
            return _channel.ack(msg);
        }

        const isNoEqEndTime = (new Date(endTime).toString()) !== (new Date(eventInfo.endTime).toString());
        if (isNoEqEndTime) {
            logger.debug('非法的活动结束时间,不能进行活动完成isNoEqEndTime....', isNoEqEndTime);
            return _channel.ack(msg);
        }

        // 当前时间必须大于等于eventInfo.endTime
        const curMillisecond          = moment().unix();
        const curEvEndTimeMillisecond = moment(eventInfo.endTime).unix();
        if (curMillisecond < curEvEndTimeMillisecond) {
            logger.debug('当前时间小于活动的结束时间不能进行活动的结束操作....');
            return _channel.ack(msg);
        }

        logger.debug('符合条件,consumeFinishedEvent即将执行...');

        await r.table("Event").get(id).update({status: fixParams.EVENT_STATUS.EVENT_STATUS_FINISHED}).run();

        return _channel.ack(msg);
    } catch (err) {
        await Promise.delay(10000);// 防止无节制报错重传,这里设定一下延时,10秒重试
        logger.error('消费consumeFinishedEvent...出错了,错误信息是', err);
        return _channel.reject(msg, true);// 重传该消息给下一个订阅者
    }
};

exports.auditEvent = async function (eventInfo) {
    try {
        // 生产定时结束活动的消息
        let diffMilliseconds = myutil.getDiffMilliseconds(eventInfo.endTime);
        diffMilliseconds     = (diffMilliseconds <= 0) ? 0 : diffMilliseconds;
        await exports.produceFinishedEvent(eventInfo, diffMilliseconds);

        await r.table("Event").get(eventInfo.id).update({audited: true}).run();

    } catch (err) {
        logger.error('处理 eventId = ' + eventInfo.id + '时出错了,报错信息是:' + err.message);
    }
};

// 添加活动浏览数
exports.addEventViewCount = async function (eventInfo) {
    try {
        const saveKey = REDIS_PREFIX.EVENT_BROWSE_COUNT + eventInfo.id;
        let viewCount = await  redisUtil.get(saveKey);
        if (_.isEmpty(viewCount)) {
            viewCount = eventInfo.browseCount + 1;
        } else {
            viewCount = Number(viewCount) + 1;
        }
        await redisClinet.setAsync(saveKey, viewCount);
        if (viewCount % 10 === 9) { await exports.updateEventById(eventInfo.id, {"browseCount": Number(viewCount)}); }
        // logger.debug('eventId= ',eventInfo.id,' 当前活动浏览次数为:', viewCount);
    } catch (err) {
        logger.error('添加活动浏览数到Redis失败了...', err.message)
    }
};

// 添加活动浏览用户数
exports.addEventUserViewCount = async function (eventInfo, req) {
    try {
        const ip                     = myutil.getClientIp(req);
        const userBrowseCountSaveKey = REDIS_PREFIX.EVENT_USER_BROWSE_COUNT + eventInfo.id;
        const userSaveKey            = REDIS_PREFIX.EVENT_USER_BROWSE_COUNT + eventInfo.id + '_' + ip;
        let viewCount                = await  redisUtil.get(userBrowseCountSaveKey);
        if (_.isEmpty(viewCount)) {
            viewCount = eventInfo.userBrowseCount + 1;
        } else {
            let userViewCount = await redisUtil.get(userSaveKey);
            if (_.isEmpty(userViewCount)) {
                viewCount = Number(viewCount) + 1;
            }
        }
        await redisClinet.setAsync(userSaveKey, 1);
        await redisClinet.expireAsync(userSaveKey, 1);// 60秒内不再重复记录
        await redisClinet.setAsync(userBrowseCountSaveKey, viewCount);
        if (viewCount % 5 === 4) { await exports.updateEventById(eventInfo.id, {"userBrowseCount": Number(viewCount)}); }
        // logger.debug('eventId= ',eventInfo.id,' 当前活动浏览用户数为:', viewCount);
    } catch (err) {
        logger.error('添加活动浏览用户数到Redis失败了...', err.message)
    }
};

// 根据用户Id分面查询所建活动
exports.getEventsByUserIdWithPageIndex = function (param, attributeNames) {
    const columns  = _.isEmpty(attributeNames) ? _.keys(EventFields) : attributeNames;
    var userId     = param.userId;
    var totalCount = parseInt(param.total) || -1;     // 总记录数
    var page       = parseInt(param.page) || 1;      // 第几页
    var limit      = parseInt(param.limit) || 10;     // 每页显示记录数
    var skip       = ( page - 1 ) * limit;
    var orderBy    = param.orderBy || "id";

    var items = Event.filter({userId: userId}).orderBy(r.desc(orderBy)).slice(skip, skip + limit).pluck(columns).run();
    if (totalCount === -1) {
        totalCount = Event.filter({userId: userId}).count().execute();
    }
    return Promise.props({items: items, count: totalCount});
};

// 获取用户下所有VIP活动
exports.getEventsByUserIdWithIsVip = function (userId) {
    return Event.filter({userId: userId, isVIP: true}).count().execute();
};

// 处理转换成的数组并分词
exports.getBreakUpTitleAll = function (num, title) {
    var title_arr = this.getTitleToArr(title);
    var result    = this.getBreakUpTitle(num, title_arr);

    return result;
};

// 处理分词
exports.getBreakUpTitle = function (num, title_arr) {
    // 按需求进行分词分词并去重
    var result = [];
    for (var m = 0, len = title_arr.length; m < title_arr.length; m++) {
        var end        = m + num;
        var transition = title_arr.slice(m, end).join('');
        result.push(transition);
        if (end >= len) {
            break;
        }
    }
    return _.uniq(result);
};

// 获取标题转换成的数组
exports.getTitleToArr = function (title) {
    // 区分中文字符和英文字符 将每个汉字拆分成数组
    var chineseRegex = /[^\x00-\xff]/g;       // 校验是否是中文
    var strLength    = title.replace(chineseRegex, "**").length;
    var title_cn_str = '';
    for (var i = 0; i < strLength; i++) {
        var singleChar = title.charAt(i).toString();
        if (singleChar.match(chineseRegex) != null) { // 为中文字符
            title_cn_str += ',' + singleChar + ',';
        } else {  // 非中文字符
            title_cn_str += singleChar;
        }
    }
    // 将中文字符截成数组并去除空值
    var title_cn_arr = _.compact(title_cn_str.split(","));
    var title_arr    = [];  //每个汉字及英文单词拆分成的数组

    // 将每个英文单词拆分成数组
    for (var j = 0; j < title_cn_arr.length; j++) {
        var title_en_str = title_cn_arr[j];
        var title_en_arr = _.compact(title_en_str.split(' '));
        if (title_en_arr.length > 1) {
            for (var m = 0; m < title_en_arr.length; m++) {
                title_arr.push(title_en_arr[m]);
            }
        } else {
            title_arr.push(title_cn_arr[j]);
        }
    }
    return title_arr;
};

// 待插入的表单收集项是否已经存在
exports.isCollectItemExist = function (collectItems, formField) {
    const formFieldIndex = _.findIndex(collectItems, {itemName: formField.itemName, isDeleted: false});
    return (formFieldIndex !== -1);
};

// 插入表单收集项
exports.addFormField = async function (eventId, formField) {
    formField.isDeleted = false;
    formField.itemId    = myutil.nextId();
    const update        = {collectItems: r.row('collectItems').default([]).append(formField)};
    return r.table("Event").get(eventId).update(update).run();
};

// 根据分类id数组获取分类名称数组
exports.getCateStrArr = async function (categories, req) {
    const cateSys     = await exports.getEventCategoriesList(req);
    let newCateStrArr = [];
    _.each(categories, function (value) {
        let tmpIndex = _.findIndex(cateSys, {value: value});
        if (tmpIndex !== -1) {
            newCateStrArr.push(cateSys[tmpIndex].name);
        }
    });
    return newCateStrArr;
};

// 根据用户id查询该用户名下所有活动总数量
exports.getEventTotalCount = async function (userId) {

    let eventTotalCount = 0;

    try {

        eventTotalCount = await r.table("Event")
                                 .getAll(userId, {index: 'userId'}).count()
    }
    catch (err) {}

    return eventTotalCount;
};

// 根据用户id查询该用户名下所有活动的统计
exports.getEventStatisticsByUserId = async function (userId) {
    return await r.table("Event")
                  .getAll(userId, {index: 'userId'})
                  .group(
                      [r.row('ctime').year(), r.row('ctime').month(), r.row('ctime').day()]
                  )
                  .pluck('id')
                  .ungroup()
                  .map(
                      function (doc) {
                          return {
                              time : doc('group'),
                              total: doc('reduction').count()
                          };
                      }
                  );
};

// 判断活动是否需要短信通知
exports.isNeedSmsNotice = async function (eventId) {

    let isNeedSmsNotice = false;

    try {

        const eventInfo        = await exports.getEventById(eventId, ['smsNotice', 'customSmsContent']);
        const smsNotice        = _.isUndefined(eventInfo.smsNotice) ? false : eventInfo.smsNotice;
        const customSmsContent = _.isUndefined(eventInfo.customSmsContent) ? '' : eventInfo.customSmsContent;

        if (smsNotice && !(_.isEmpty(customSmsContent))) {
            isNeedSmsNotice = true;
        }

    } catch (err) { }

    return isNeedSmsNotice;
};

// 获取短信通知内容
exports.getSmsNoticeContent = async function (customSmsContent, orderInfo) {

    let result = '';

    try {

        // #姓名#,您参加“活动名称xxx”的签到码是 #签到码#。详见 #电子票#,活动地址 #活动链接#

        let compiled = _.template(customSmsContent, {interpolate: /#([\s\S]+?)#/g,});
        result       = compiled({
            '姓名'  : orderInfo.name,
            '签到码' : orderInfo.attendeeId,
            '电子票' : orderInfo.ticketUrl,
            '活动链接': orderInfo.eventUrl,
        });

        logger.debug('eventId=', orderInfo.eventId, ' 发送活动短信通知的模板是 ', customSmsContent);
        logger.debug('eventId=', orderInfo.eventId, ' 发送活动短信通知的内容是 ', result);

    } catch (err) { }

    return result;

};

// 用户是否拥有此活动
exports.isOwnEvent = async function (userId, eventId) {
    try {

        const result = await r.table('Event').filter({id: eventId}).pluck('userId');

        if (_.isEmpty(result)) {
            return false
        }

        const isEqual = (userId === (result[0].userId));

        return isEqual;
    } catch (err) {
        return false;
    }
};

// 是否设置了AccountIds,当活动是美元收款时必须设置paymentAccountIds字段
exports.isSetAccountIds = function (reqParams) {
    try {
        const paymentAccountIds = _.isUndefined(reqParams.paymentAccountIds) ? '' : reqParams.paymentAccountIds;

        if (!(_.isArray(paymentAccountIds)) || _.isEmpty(paymentAccountIds)) {
            return false;
        }

        return true;
    } catch (err) {
        return false;
    }
};

// 获取门票的退票设置
exports.getRefundSettings = async function (eventId) {

    let refundSettings = [];

    try {

        const eventAttributeNames = ['refundSettings'];
        const eventInfo           = await exports.getEventById(eventId, eventAttributeNames);
        refundSettings            = _.sortBy(eventInfo.refundSettings, 'daysBeforeStart');
        refundSettings            = refundSettings.reverse();

    } catch (err) {
        logger.error('getRefundSettings ', err);
    }

    return refundSettings;
};

// 尝试获取活动信息
exports.tryGetEventInfo = async function (eventId, eventAttributeNames) {

    let eventInfo = {};

    try {

        eventInfo = await exports.getEventById(eventId, eventAttributeNames);

    } catch (err) {
        logger.error('tryGetEventInfo ', err);
    }

    return eventInfo;
};


/**
 * change the flag of sending wechat invitation
 */
exports.updateSendWXInvitation = async function (eventId, flag) {
    return Event.get(eventId).update({sendWXInvitation: flag, utime: r.now()})
}

/**
 * change the wechat invitation template
 */
exports.updateInvitationTemplate = async function (eventId, templateId) {
    return Event.get(eventId).update({invitationTemplate: templateId, utime: r.now()})
}

// 获取发票状态对应的多语言信息
exports.getOrderInvoiceStatusI18nInfo = function (req, orderInvoiceStatus) {
    const invoiceStatusList = exports.getInvoiceStatusList(req);// 所有开票状态列表
    let i18nInvoiceStatus   = _.find(invoiceStatusList, {name: orderInvoiceStatus});
    if (_.isUndefined(i18nInvoiceStatus)) {
        i18nInvoiceStatus = {name: orderInvoiceStatus, str: '未知开票状态'};
    }
    return i18nInvoiceStatus;
};

// 判断活动的收集用户信息模式是否是购票者模式
exports.isBuyerModel = async function (eventId) {
    let isBuyerModel = false;

    try {

        const eventInfo = await exports.tryGetEventInfo(eventId, ['isCollectAttendees']);

        // isCollectAttendees: type.boolean().default(true),// 是否收集参会者信息,默认true收集,false为只收集购票者信息

        isBuyerModel = (eventInfo.isCollectAttendees === false);

    } catch (err) {
        logger.error('isBuyerModel ', err);
    }

    return isBuyerModel;
};

// 通过accountId查询该银行卡所关联的活动
exports.getEventsByAccountId = function (accountId) {
    return r.table("Event").pluck('id', 'title', 'paymentAccountIds')
            .filter(
                function (doc) {
                    return doc('paymentAccountIds').ne([]).and(
                        r.expr(doc('paymentAccountIds')).contains(accountId)
                    );
                }
            )
};

// 通过accountId查询该银行卡是否有关联活动
exports.IsAccountIdHasEvent = async function (accountId) {
    let result = await exports.getEventsByAccountId(accountId);
    return (!_.isEmpty(result));
};

// 表单收集项是否是必填
exports.isItemRequired = function (collectItemInfo) {
    let isItemRequired = false;

    try {

        if (!_.isUndefined(collectItemInfo.rules) && !_.isUndefined(collectItemInfo.rules.required)) {
            isItemRequired = (collectItemInfo.rules.required === true);
        }

    } catch (err) {
        logger.error('isItemRequired ', err);
    }

    return isItemRequired;
};

//获得表单收集项
exports.getCollectItemsFieldByEventId = async function (eventId,...attribute) {
    return r.db("eventdove").table("Event").filter(function (var_1) {
        return var_1('collectItems').ne([]).and(var_1('id').eq(eventId))
    }).concatMap(function(var_2){
        return  var_2('collectItems')
    }).filter(function(var_3){
        return  var_3('isDeleted').eq(false)
    }).pluck(attribute)
};
