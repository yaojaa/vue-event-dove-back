const _      = require('lodash');
const myutil = require('../util/util.js');
const thinky = require('../util/thinky.js');
const type   = thinky.type;
const r      = thinky.r;
const nextId = myutil.nextId;
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

// 推广表
const PopularizeFields = {
    id           : type.string(),
    eventId      : type.string().required(),
    name         : type.string().required(),// 渠道名
    code         : type.string().required(),// 推广code
    phone        : type.string(),// 推广人员手机号
    pwd          : type.string(),// 推广人员查看密码
    salt         : type.string(),
    royaltyMethod: type.string().enum('rate', 'fixed'),// 提成方式
    uTime        : type.date().default(function () {return new Date();}),// 修改时间
    cTime        : type.date().default(function () {return new Date();}),// 创建时间
};

const Popularize = thinky.createModel("Popularize", PopularizeFields);

const popularize_INDICES = ['eventId', 'name', 'code', 'phone'];
_.each(popularize_INDICES, function (index) {
    Popularize.ensureIndex(index);
});

exports.PopularizeModel  = Popularize;
exports.PopularizeFields = PopularizeFields;

// 活动访问量表
const VisitFields = {
    id            : type.string(),
    eventId       : type.string().required(),// 活动id
    userId        : type.string().required(),// 活动所属的用户id
    browseCount   : type.number().default(1),// 活动浏览次数
    deviceType    : type.string().enum("iOS", "android", "pc").default("pc"),// 访问的设备类型
    visitUrl      : type.string(),// 访问的url
    popularizeCode: type.string(),// 推广code
    userAgent     : type.string(),
    ip            : type.string(),
    uTime         : type.date().default(function () {return new Date();}),// 修改时间
    cTime         : type.date().default(function () {return new Date();}),// 创建时间
};

const Visit = thinky.createModel("Visit", VisitFields);

const visit_INDICES = ['eventId', 'userId', 'deviceType', 'popularizeCode'];
_.each(visit_INDICES, function (index) {
    Visit.ensureIndex(index);
});

exports.VisitModel  = Visit;
exports.VisitFields = VisitFields;

exports.saveVisit = function (data, options) {
    let obj = new Visit(data);
    obj.id  = nextId();
    return obj.save();
};

// 添加活动浏览数
exports.addVisit = async function (eventInfo, req) {
    try {

        const query          = req.query;
        const eventId        = eventInfo.id;
        const userId         = eventInfo.userId;
        const browseCount    = 1;
        const deviceType     = query.deviceType || 'pc';
        const visitUrl       = req.url;
        const popularizeCode = query.utmCode || '';
        const userAgent      = req.header('User-Agent');
        const ip             = query.ip || myutil.getClientIp(req);

        const insertVisitData = {
            eventId       : eventId,
            userId        : userId,
            browseCount   : browseCount,
            deviceType    : deviceType,
            visitUrl      : visitUrl,
            popularizeCode: popularizeCode,
            userAgent     : userAgent,
            ip            : ip,
        };

        exports.saveVisit(insertVisitData);

    } catch (err) {
        logger.error(err);
        logger.error('添加活动浏览数到Visit失败了...', err.message)
    }
};

// 根据用户id查询该用户活动的总访问量
exports.totalVisitStatistics = async function (userId) {

    let count = 0;

    try {

        count = await r.table("Visit").getAll(userId, {index: "userId"}).count();
    }
    catch (err) {}

    return count;
};

// 根据用户id查询该用户活动的pc活动访问量统计
exports.pcVisitStatistics = async function (userId) {
    return r.table("Visit")
            .getAll(userId, {index: "userId"})
            .filter({"deviceType": "pc"})
            .group(
                [r.row('cTime').year(), r.row('cTime').month(), r.row('cTime').day()]
            )
            .ungroup()
            .map(
                function (doc) {
                    return {
                        time : doc('group'),
                        count: doc('reduction').count()
                    };
                }
            );
};

// 根据用户id查询该用户活动的mobile活动访问量统计
exports.mobileVisitStatistics = async function (userId) {
    return r.table("Visit")
            .getAll(userId, {index: "userId"})
            .filter(
                function (doc) {
                    return r.expr([
                        "iOS",
                        "android"
                    ]).contains(doc("deviceType"));
                })
            .group(
                [r.row('cTime').year(), r.row('cTime').month(), r.row('cTime').day()]
            )
            .ungroup()
            .map(
                function (doc) {
                    return {
                        time : doc('group'),
                        count: doc('reduction').count()
                    };
                }
            )
};
