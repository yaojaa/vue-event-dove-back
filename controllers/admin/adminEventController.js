'use strict';

var _           = require('lodash');
var myutil      = require('../../util/util.js');
var errorCodes  = require('../../util/errorCodes.js').ErrorCodes;
var fixParams   = require('../../util/fixParams.js');
const settings  = require("../../conf/settings");
const loggerSettings = require('../../logger');
const logger         = loggerSettings.winstonLogger;
var Promise     = require('bluebird');
var Event       = require('../../model/event');
var User        = require('../../model/user');
var order       = require('../../model/order');
var EventDomain = require('../../model/eventDomain');

exports.getEventsPageIndex    = getEventsPageIndex;
exports.updateEventStatus     = updateEventStatus;
exports.getAllEventDomains    = getAllEventDomains;
exports.get                   = get;
exports.addEventDomainName    = addEventDomainName;
exports.updateEventDomainName = updateEventDomainName;
exports.deleteEventDomainName = deleteEventDomainName;
const sysNotice   = require('../../model/admin/sysNotice');


// 获取所有活动的所有订单
async function __getAllEventOrders(events) {
    try {
        var orderFields = ["orderDetails", "attendees"];
        var promiseArr  = [];
        _.each(events, function (eventInfo) {
            promiseArr.push(order.getOrderByEventId(eventInfo.id, orderFields));
        });
        var allEventOrders = await Promise.all(promiseArr);
        return allEventOrders;
    } catch (err) {
        throw err;
    }
}

async function getEventsPageIndex(req, res, next) {
    try {

        const params = req.query;
        if (!_.isEmpty(params.userName)) {
            const userInfo = await User.findUserByUsername(params.userName);
            if (!_.isEmpty(userInfo)) {
                params.userId = userInfo[0].id;
            }
        }

        const attributeNames  = [
            "id", "title", "domainName", "ctime", "userId", "contact", "status", "startTime", "endTime",
            "country", "province", "city", "zipCode", "detailedAddress",
            "lng", "lat", "onlineAddress", "geohash", "tickets", "bannerUrl"
        ];
        const data            = await Event.getEventsByUserIdAndPageIndex(params, attributeNames);
        const allEventOrders  = await __getAllEventOrders(data.items);
        const eventStatusList = Event.getEventStatusList(req);

        for (let eventInfo of data.items) {

            let curUserInfo = {};
            try {
                curUserInfo = await User.getUserById(eventInfo.userId, ['username']);
            } catch (err) {
            }
            eventInfo.username = (!_.isEmpty(curUserInfo)) ? curUserInfo.username : '';

        }

        let eventIndex = 0;
        for (let eventInfo of data.items) {

            // 活动状态
            const eventStatusInfo = _.find(eventStatusList, {name: eventInfo.status});
            eventInfo.statusStr   = eventStatusInfo.str;

            // 组装门票售卖信息
            const ticketsSoldOutInfo = Event.getTicketsSoldOutRate(eventInfo.tickets, allEventOrders[eventIndex]);
            _.merge(eventInfo, ticketsSoldOutInfo);

            const isPublished = (eventInfo.status === 'published');
            if (isPublished) {

                // 组装门票子状态
                const subStatus = Event.getEventSubStatus(eventInfo.startTime, eventInfo.endTime);
                _.merge(eventInfo, {subStatus: subStatus});

                // 组装活动签到数量
                const checkedInDetail = await Event.getCheckedInDetail(eventInfo.id);

                _.merge(eventInfo, checkedInDetail);

            }

            eventIndex++;

        }

        let paginate             = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);
        paginate.eventStatusList = eventStatusList;

        return res.status(200).send(paginate);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}
// 修改活动状态
async function updateEventStatus(req, res, next) {
    const body       = req.body;
    const eventId    = body.eventId;
    const newstatus  = body.status;
    const auditNotes = body.auditNotes;

    if (_.isEmpty(newstatus)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "status")
        });
    }

    let updateInfo = {"status": newstatus};

    if (!_.isUndefined(auditNotes)) {
        updateInfo.auditNotes = auditNotes;
    }

    try {
        const results = await Event.updateEventById(eventId, updateInfo);

        //发送活动审核通知
        sysNotice.sendEventAuditNotice(req,results);

        return res.status(200).send(results);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }

}

// 所有活动域名
async function getAllEventDomains(req, res, next) {
    try {

        var data     = await EventDomain.getAllEventDomains(req.query);
        var paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        return res.status(200).send(paginate);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

// 添加活动域名
async function addEventDomainName(req, res, next) {
    var body       = req.body;
    var domainName = body.domainName;

    if (_.isEmpty(domainName)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "domainName")
        });
    }

    try {

        // 判断域名是否有效
        var isValidate = await EventDomain.isValidateDomainName(domainName);
        if (!isValidate) {
            return next({
                errorCode   : errorCodes.EVENT_DOMAIN_NAME_IS_EXIST,
                responseText: req.__("Exists", domainName)
            });
        }

        // 添加域名
        var results = await EventDomain.addEventDomain({"domainName": domainName});

        return res.status(200).send(results);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }

}

// 修改活动域名
async function updateEventDomainName(req, res, next) {
    var body          = req.body;
    var domainId      = body.domainId;
    var newDomainName = body.domainName;

    if (_.isEmpty(newDomainName)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "domainName")
        });
    }

    try {

        // 根据domainId查询域名信息
        var oldDomainInfo = await EventDomain.getEventDomainById(domainId);
        if (_.isEmpty(oldDomainInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", domainId)
            });
        }

        if (oldDomainInfo.domainName !== newDomainName) {

            // 判断新域名是否有效
            var isValidate = await EventDomain.isValidateDomainName(newDomainName);
            if (!isValidate) {
                return next({
                    errorCode   : errorCodes.EVENT_DOMAIN_NAME_IS_EXIST,
                    responseText: req.__("Exists", newDomainName)
                });
            }

        }


        // 更新域名
        var results = await EventDomain.updateEventDomainById(domainId, {"domainName": newDomainName});

        return res.status(200).send(results);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }

}

// 删除活动域名
async function deleteEventDomainName(req, res, next) {
    var body     = req.body;
    var domainId = body.domainId;

    if (_.isEmpty(domainId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "domainId")
        });
    }

    try {

        // 根据domainId查询域名信息
        var oldDomainInfo = await EventDomain.getEventDomainById(domainId);
        if (_.isEmpty(oldDomainInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", domainId)
            });
        }

        // 删除域名
        var results = await EventDomain.deleteEventDomain(domainId);

        return res.status(200).send(results);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }

}

async function get(req, res, next) {
    var p       = req.query;
    var eventId = p.id;

    if (!eventId) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'event id')
        });
    }

    try {
        var eventAttributeNames = [
            'id', 'title', 'status', 'startTime', 'endTime',
            'onlineAddress', 'detailedAddress', 'domainName', 'categories',
            'organizers', 'userId', 'contact', 'tickets', 'content',
        ];
        var orderFields         = ["orderDetails"];
        var values              = await Promise.props(
            {
                event : Event.getEventById(eventId, eventAttributeNames),
                orders: order.getOrderByEventId(eventId, orderFields),
            }
        );

        var eventInfo   = values.event;
        var eventOrders = values.orders;

        eventInfo.tickets             = Event.getTicketsSoldOut(eventInfo.tickets, eventOrders);
        eventInfo.invoiceSetting      = Event.getInvoiceSetting(eventInfo.invoiceSetting, req);
        eventInfo.eventCategoriesList = await Event.getEventCategoriesList(req);

        return res.status(200).send(eventInfo);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}
