const myutil       = require('../util/util.js');
const thinky       = require('../util/thinky.js');
const type         = thinky.type;
const r            = thinky.r;
const nextId       = myutil.nextId;
const settings     = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const fp           = require('../util/fixParams.js');
const Promise      = require('bluebird');

// 胸卡
var EventBadgeFields = {
    id: type.string(),
    badgeName  : type.string().required(),   // 胸卡名称
    collectInfo: type.string().required(),   // 胸卡内容
    htmlContent: type.string(),              // 胸卡内容-html
    styleId: type.string().required(),       // 胸卡规格Id
    eventId: type.string().required(),       // 活动Id
    userId : type.string().required(),       // 用户Id
    cTime  : type.date(),    // 申请认证时间
    uTime  : type.date()     // 更新时间
}

var EventBadge = thinky.createModel("EventBadge", EventBadgeFields);

// secondary index
var EVENT_BADGE_INDICES = ['badgeName', 'styleId', 'eventId', 'userId'];
_.each(EVENT_BADGE_INDICES, function (index) {
    EventBadge.ensureIndex(index);
});
exports.EventBadgeModel  = EventBadge;
exports.EventBadgeFields = EventBadgeFields;

// 保存胸卡
exports.saveBadge = function(data){
    var badge = new EventBadge(data);
    badge.id  = nextId();
    var time = new Date();
    badge.ctime = time;
    badge.utime = time;

    return badge.save();
}

// 根据Id获取胸卡
exports.getBadge = function(id){
    return EventBadge.get(id).run();
}

// 根据胸卡Id获取胸卡及所属类型
exports.getBadgeWithStyle = function (id) {
    return r.table("EventBadge").getAll(id).eqJoin('styleId',r.table('BadgeStyle'))
        .map(function (doc) {
            return {
                badgeId    : doc('left')('id'),
                badgeName  : doc('left')('badgeName'),     // 胸卡名称
                collectInfo: doc('left')('collectInfo'),   // 胸卡内容
                htmlContent: doc('left')('htmlContent'),   // 胸卡内容-html
                styleId    : doc('left')('styleId'),       // 胸卡规格Id
                styleName  : doc('right')('styleName'),    // 胸卡类型名称
                pageSize   : doc('right')('pageSize'),     // 页面大小如：8.5in 11in
                pageMargin : doc('right')('pageMargin'),   // 页面的边距
                badgeWidth : doc('right')('badgeWidth'),   // 胸卡宽度
                badgeHeight: doc('right')('badgeHeight'),  // 胸卡规格Id

                perPageRow   : doc('right')('perPageRow'),    // 每页的行数
                perPageColumn: doc('right')('perPageColumn'), // 每页的列数
                webSiteStyle : doc('right')('webSiteStyle'),  // 设置页面中的胸卡大小和样式

                badgePadding  : doc('right')('badgePadding'),   // 每个胸卡相对于父tr的padding
                intervalWidth : doc('right')('intervalWidth'),  // 列相隔的宽度
                intervalHeight: doc('right')('intervalHeight'), // 行相隔的高度 可为空
                badgeStyle    : doc('right')('badgeStyle'),     // badge class的样式

                eventId: doc('left')('eventId')       // 活动Id   系统提供的胸卡类型 eventId固定为:'000000'
            }
        }).run();
}

// 修改胸卡
exports.updateBadge = function(id, update){
    update.utime = new Date();
    return EventBadge.get(id).update(update).run();
}

// 根据Id删除胸卡
exports.delBadge = function (id) {
    return EventBadge.get(id).delete().run();
}

// 根据条件分页获取胸卡
exports.getAllBadge = function(params, attributeNames){
    attributeNames  = _.isEmpty(attributeNames) ? _.keys(EventBadgeFields) : attributeNames;
    var badgeRsql  = __joiningBadgeRsql(params);

    var totalCount  = parseInt(params.total) || -1;  // 总记录数
    var page        = parseInt(params.page)  || 1;   // 第几页
    var limit       = parseInt(params.limit) || 10;  // 每页显示记录数
    var skip        = ( page - 1 ) * limit;
    var orderBy     = params.orderBy || "ctime";

    var items = badgeRsql.orderBy(r.desc(orderBy)).slice(skip, skip + limit).pluck(attributeNames).run();
    if (totalCount === -1) {
        totalCount = badgeRsql.count().run();
    }
    return Promise.props({items: items, count: totalCount});
}

// 根据条件分页获取胸卡及类型
exports.getAllBadgeWithStyle = function(params){
    var badgeRsql  = __joiningBadgeRsql(params);

    var totalCount  = parseInt(params.total) || -1;  // 总记录数
    var page        = parseInt(params.page)  || 1;   // 第几页
    var limit       = parseInt(params.limit) || 10;  // 每页显示记录数
    var skip        = ( page - 1 ) * limit;
    var orderBy     = params.orderBy || "ctime";

    var items = badgeRsql.eqJoin('styleId',r.table('BadgeStyle'))
        .orderBy(r.desc(orderBy)).slice(skip, skip + limit)
        .map(function (doc) {
            return {
                badgeId    : doc('left')('id'),
                badgeName  : doc('left')('badgeName'),     // 胸卡名称
                styleId    : doc('left')('styleId'),       // 胸卡规格Id
                styleName  : doc('right')('styleName'),    // 胸卡类型名称
                eventId    : doc('left')('eventId')        // 活动Id   系统提供的胸卡类型 eventId固定为:'000000'
            }
        }).run();
    if (totalCount === -1) {
        totalCount = badgeRsql.eqJoin('styleId',r.table('BadgeStyle')).count().run();
    }
    return Promise.props({items: items, count: totalCount});
}

// 拼接胸卡查询条件
function __joiningBadgeRsql(params) {
    var eventId      = params.eventId;     // 活动Id
    var styleId      = params.styleId;     // 规格Id
    var userId       = params.userId;      // 用户Id
    var badgeName    = params.badgeName;   // 胸卡名称

    var rsql = r.table('EventBadge').getAll(eventId, {index: 'eventId'})
    if(!_.isEmpty(userId) && !_.isUndefined(userId)){
        rsql = rsql.filter(function (doc) {
            return doc('userId').eq(userId);
        })
    }
    if(!_.isEmpty(styleId) && !_.isUndefined(styleId)){
        rsql = rsql.filter(function (doc) {
            return doc('eventId').eq(eventId);
        })
    }
    if(!_.isEmpty(styleId) && !_.isUndefined(styleId)){
        rsql = rsql.filter(function (doc) {
            return doc('styleId').eq(styleId);
        })
    }if(!_.isEmpty(badgeName) && !_.isUndefined(badgeName)){
        rsql = rsql.filter(function (doc) {
            return doc('badgeName').eq(badgeName);
        })
    }
    return rsql;
}

// 胸卡类型
var BadgeStyleFields = {
    id: type.string(),
    styleName  : type.string().required(),   // 胸卡类型名称
    pageSize   : type.string().required(),   // 页面大小如：8.5in 11in
    pageMargin : type.string(),              // 页面的边距
    badgeWidth : type.string().required(),   // 胸卡宽度
    badgeHeight: type.string().required(),   // 胸卡规格Id

    perPageRow   : type.number().default(1), // 每页的行数
    perPageColumn: type.number().default(1), // 每页的列数
    webSiteStyle : type.string().required(), // 设置页面中的胸卡大小和样式

    badgePadding  : type.string(),   // 每个胸卡相对于父tr的padding
    intervalWidth : type.string(),   // 列相隔的宽度
    intervalHeight: type.string(),             // 行相隔的高度 可为空
    badgeStyle    : type.string().required(),  // badge class的样式
    // status :type.number().default(1),        // 0:系统 1：自定义
    eventId: type.string().required(),       // 活动Id   系统提供的胸卡类型 eventId固定为:'000000'
    userId : type.string().required(),       // 用户Id   系统提供的胸卡类型 userId 固定为:'000000'
    isdel  : type.boolean().default(false),  // 是否删除
    cTime  : type.date(),    // 申请认证时间
    uTime  : type.date()     // 更新时间
}

var BadgeStyle = thinky.createModel("BadgeStyle", BadgeStyleFields);
// secondary index
var EVENT_STYLE_INDICES = ['styleName', 'eventId', 'userId'];
_.each(EVENT_STYLE_INDICES, function (index) {
    BadgeStyle.ensureIndex(index);
});
exports.BadgeStyleModel  = BadgeStyle;
exports.BadgeStyleFields = BadgeStyleFields;

// 保存胸卡类型
exports.saveStyle = function(data){
    var style = new BadgeStyle(data);
    style.id  = nextId();
    var time = new Date();
    style.ctime = time;
    style.utime = time;

    return style.save();
}

// 根据Id获取胸卡类型
exports.getStyle = function(id, attributeNames){
    attributeNames  = _.isEmpty(attributeNames) ? _.keys(BadgeStyleFields) : attributeNames;
    return BadgeStyle.get(id).pluck(attributeNames).run();
}

// 修改胸卡类型
exports.updateStyle = function(id, update){
    update.utime = new Date();
    return BadgeStyle.get(id).update(update).run();
}

// 根据Id删除胸卡类型
exports.delStyle = function (id) {
    return BadgeStyle.get(id).delete().run();
}

// 获取活动下所有胸卡类型 包括系统及自定胸卡类型
exports.getAllStyle = function(eventId,attributeNames){
    attributeNames  = _.isEmpty(attributeNames) ? _.keys(BadgeStyleFields) : attributeNames;
    return r.table('BadgeStyle')
        .getAll('000000',eventId, {index: 'eventId'})
        .orderBy(r.asc(eventId)).pluck(attributeNames).run();
}
