var _       = require('lodash');
var myutil  = require('../util/util.js');
var nextId  = myutil.nextId;
var thinky  = require('../util/thinky.js');
var type    = thinky.type;
var r       = thinky.r;
var Promise = require('bluebird');
var Event   = require('./event.js');
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

var EventDomainFields = {
    id        : type.string(),
    domainName: type.string().required(),// 活动域名
    ctime     : type.date().default(function () { return new Date();}),// 记录创建时间
    utime     : type.date().default(function () { return new Date();})// 记录更新时间
};

var EventDomain = thinky.createModel("EventDomain", EventDomainFields);

const EventDomain_INDICES = ['domainName'];
_.each(EventDomain_INDICES, function (index) {
    EventDomain.ensureIndex(index);
});

exports.EventDomainModel  = EventDomain;
exports.EventDomainFields = EventDomainFields;

exports.addEventDomain = function (data) {
    var newEventDomain = new EventDomain(data);
    newEventDomain.id  = nextId();
    return newEventDomain.save();
};

exports.deleteEventDomain = function (EventDomainId, options) {
    return EventDomain.get(EventDomainId).delete().execute();
};

exports.updateEventDomainById = function (id, update, options) {
    update.utime = new Date();
    return EventDomain.get(id).update(update).run();
};

exports.getEventDomainById = function (id, options) {
    return EventDomain.get(id).run();
};

exports.getEventDomainByDomainName = async function (domainName, options) {
    var domainInfoArr = await EventDomain.getAll(domainName, {index: "domainName"}).run();
    return domainInfoArr[0];
};

exports.getAllEventDomains = function (params) {
    var totalCount = parseInt(params.total) || -1;// 总记录数
    var page       = parseInt(params.page) || 1;
    var limit      = parseInt(params.limit) || 10;
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "id";

    var items = EventDomain.orderBy(r.desc(orderBy))
                           .slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = r.table("EventDomain").count().run();
    }

    return Promise.props({items: items, count: totalCount});
};

// 判断域名是否已经使用过
exports.isValidateDomainName = async function (domainName) {
    try {

        // 判断域名在活动表中是否存在
        var count = await Event.getEventCountDomainName(domainName);
        if (count > 0) {
            return false;
        }

        // 判断域名在系统域名保留表中是否存在
        var domainInfo = await exports.getEventDomainByDomainName(domainName);
        if (!_.isEmpty(domainInfo)) {
            return false;
        }

        return true;
    } catch (err) {
        return false;
    }
};
