'use strict';

const _           = require('lodash');
const myutil      = require('../util/util.js');
const thinky      = require('../util/thinky.js');
const Promise     = require('bluebird');
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const errorCodes  = require('../util/errorCodes.js').ErrorCodes;
const fixParams   = require('../util/fixParams.js');
const Order       = require('../model/order');
const User        = require('../model/user');
const Event       = require('../model/event');
const Popularize  = require('../model/popularize');
const EventDomain = require('../model/eventDomain');
const moment      = require('moment');
const Transaction = require('../model/transaction');
const Big         = require('big.js');
const sysNotice   = require('../model/admin/sysNotice');
const path        = require('path');
const fs          = require('fs');
const iconv       = require('iconv-lite');
const uuid        = require('uuid');

exports.create                        = create;
exports.update                        = update;
exports.get                           = get;
exports.discover                      = discover;
exports.lenovoDiscover                = lenovoDiscover;
exports.getEventCategories            = getEventCategories;
exports.getEventsByUserIdAndPageIndex = getEventsByUserIdAndPageIndex;
exports.updateDomainName              = updateEventDomainName;
exports.updateSmsNotice               = updateSmsNotice;
exports.validateTitle                 = validateTitle;
exports.getTypeCount                  = getReceiverTypeCount;

// 根据用户选择的收款币种以及其他条件组装支付方式数组
function __getPaymentMethod(body) {
    var paymentMethod = [];

    // 人民币线上支付方式
    const CNY_ONLINE_PAYMENT_METHOD = [
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_EBANK,
    ];

    // 美元线上支付方式
    const USD_ONLINE_PAYMENT_METHOD = [
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL,
    ];

    var paymentPriceUnit = body.paymentPriceUnit || fixParams.CURRENCY_NAME.YUAN;// 收款币种
    if (paymentPriceUnit === fixParams.CURRENCY_NAME.DOLLAR) {
        paymentMethod = USD_ONLINE_PAYMENT_METHOD;
    }

    if (paymentPriceUnit === fixParams.CURRENCY_NAME.YUAN) {
        paymentMethod = CNY_ONLINE_PAYMENT_METHOD;
    }

    var transfer            = body.transfer;// 银行转帐
    var isSupportedTransfer = !(_.isUndefined(transfer))
        && (transfer === true)
        && (paymentPriceUnit === fixParams.CURRENCY_NAME.YUAN);
    if (isSupportedTransfer) {
        paymentMethod.push(fixParams.PAYMENT_METHOD.PAYMENT_METHOD_TRANSFER);
    }

    var onsite = body.onsite;// 现场收费
    if (!(_.isUndefined(onsite)) && (onsite === true)) {
        paymentMethod.push(fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ONSITE);
    }

    return paymentMethod;
}

// 创建活动时如果前端未传递名字和邮箱两个表单收集项过来时自动插入两个表单收集项到活动记录中
function __fillCollectItems(collectItems) {

    var nameCollectItem  = _.find(collectItems, {itemName: 'name'});
    var emailCollectItem = _.find(collectItems, {itemName: 'email'});

    if (_.isUndefined(nameCollectItem)) {
        nameCollectItem = {
            "itemName"    : "name",
            "displayName" : "name",
            "fieldType"   : "text",
            "isRequired"  : true,
            "displayOrder": 0,
            "isDeleted"   : false,
            "isUnique"    : false,
            "itemValues"  : [],
            "itemId"      : myutil.nextId()
        };
        collectItems.push(nameCollectItem);
    }

    if (_.isUndefined(emailCollectItem)) {
        emailCollectItem = {
            "itemName"    : "email",
            "displayName" : "email",
            "fieldType"   : "text",
            "isRequired"  : true,
            "displayOrder": 0,
            "isDeleted"   : false,
            "isUnique"    : true,
            "itemValues"  : [],
            "itemId"      : myutil.nextId()
        };
        collectItems.push(emailCollectItem);
    }

    return collectItems;
}

// 整理准备入库的tickes数据
function __makeTicketsParams(tickets) {

    _.each(tickets, function (ticket, index) {

        var ticketReq   = myutil.getPurenessRequsetFields(ticket, Event.EventFields.tickets[0]);
        var hasTicketId = ticketReq.hasOwnProperty('ticketId');
        if (!hasTicketId) {
            ticketReq.ticketId = myutil.nextId();
        }
        tickets[index] = ticketReq;

    });

    return tickets;
}

// 整理准备入库的collectItems数据
function __makeCollectItemsParams(collectItems) {

    _.each(collectItems, function (collectItem, index) {

        var collectItemReq = myutil.getPurenessRequsetFields(collectItem, Event.EventFields.collectItems[0]);
        var hasItemId      = collectItemReq.hasOwnProperty('itemId');
        if (!hasItemId) {
            collectItemReq.isDeleted = false;
            collectItemReq.itemId    = myutil.nextId();
        }
        collectItems[index] = collectItemReq;

    });

    return collectItems;
}

function create(req, res, next) {
    var body           = req.body;
    var title          = body.title;
    var keyWords       = body.keyWords;
    var purenessReq    = myutil.getPurenessRequsetFields(body, Event.EventFields);// 准备需要插入数据库的数据
    purenessReq.userId = req.user.id;

    const doSomething = Promise.coroutine(function*() {
        try {
            // 校验活动名称是否存在
            var count = yield Event.getEventCountTitle(title);
            if (count > 0) {
                return next({
                    errorCode   : errorCodes.EVENT_TITLE_IS_EXIST,
                    responseText: req.__('Exists', 'title')
                });
            }

            if (_.isEmpty(purenessReq)) {
                return next({
                    errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                    responseText: req.__('Empty', 'request')
                });
            }

            if (!(_.isEmpty(purenessReq.tickets))) {
                purenessReq.tickets = __makeTicketsParams(purenessReq.tickets);
            }

            if (!(_.isEmpty(purenessReq.collectItems))) {
                purenessReq.collectItems = __makeCollectItemsParams(purenessReq.collectItems);
                purenessReq.collectItems = __fillCollectItems(purenessReq.collectItems);
            }

            // 整理收款相关设置
            purenessReq.paymentPriceUnit     = purenessReq.paymentPriceUnit || fixParams.CURRENCY_NAME.YUAN;
            purenessReq.paymentPriceUnitSign = Event.getPaymentPriceUnitSign(purenessReq.paymentPriceUnit);
            purenessReq.paymentMethod        = __getPaymentMethod(body);

            // 当活动是美元收款时必须设置paymentAccountIds字段
            if (purenessReq.paymentPriceUnit === fixParams.CURRENCY_NAME.DOLLAR) {

                if (!(Event.isSetAccountIds(purenessReq))) {
                    return next({
                        errorCode   : errorCodes.EVENT_TITLE_IS_EXIST,
                        responseText: req.__('event_must_has_account_id')
                    });
                }

            }

            // 对查询标题进行分词
            if (!_.isEmpty(title) && !_.isUndefined(title)) {
                purenessReq.breakUpTitle2 = Event.getBreakUpTitleAll(2, title);
                purenessReq.breakUpTitle3 = Event.getBreakUpTitleAll(3, title);
            }

            myutil.deepRemove(purenessReq);// 递归删除null

            const result = yield Event.addEvent(purenessReq);
            return res.status(200).json(result);
        } catch (err) {
            logger.error(err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}


// 活动名称是否重复
async function __isDuplicatedEventTitle(req, res, next) {
    const body  = req.body;
    const title = body.title;

    // 校验活动名称是否存在
    const events = await Event.getEventByTitle(title);

    if (events.length > 1) {
        return next({
            errorCode   : errorCodes.EVENT_TITLE_IS_EXIST,
            responseText: req.__('Exists', 'title')
        });
    }

    if (events.length === 1) {
        if (body.id != events[0].id) {   // 查询得到的活动Id与修改的活动Id不相等
            return next({
                errorCode   : errorCodes.EVENT_TITLE_IS_EXIST,
                responseText: req.__('Exists', 'title')
            });
        }
    }
}

async function update(req, res, next) {
    const body        = req.body;
    const title       = body.title;
    const keyWords    = body.keyWords;
    const status      = body.status;
    const purenessReq = myutil.getPurenessRequsetFields(body, Event.EventFields);// 准备需要插入数据库的数据

    try {

        if (!_.isUndefined(title) && !_.isEmpty(title)) {
            await __isDuplicatedEventTitle(req, res, next);
        }

        if (_.isEmpty(body)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('Empty', 'request')
            });
        }

        if (!body.id) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('Empty', 'event id')
            });
        }

        if (!await Event.isOwnEvent(req.user.id, body.id)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('err_no_operation_permissions')
            });
        }

        if (!(_.isEmpty(purenessReq.paymentPriceUnit))) {
            purenessReq.paymentMethod = __getPaymentMethod(body);
        }

        if (!(_.isEmpty(purenessReq.tickets))) {
            purenessReq.tickets = __makeTicketsParams(purenessReq.tickets);
        }

        if (!(_.isEmpty(purenessReq.collectItems))) {
            purenessReq.collectItems = __makeCollectItemsParams(purenessReq.collectItems);
            purenessReq.collectItems = __fillCollectItems(purenessReq.collectItems);
        }

        if (!_.isUndefined(purenessReq.paymentPriceUnit)) {

            // 整理收款相关设置
            purenessReq.paymentPriceUnitSign = Event.getPaymentPriceUnitSign(purenessReq.paymentPriceUnit);
            purenessReq.paymentMethod        = __getPaymentMethod(body);

            // 当活动是美元收款时必须设置paymentAccountIds字段
            if (purenessReq.paymentPriceUnit === fixParams.CURRENCY_NAME.DOLLAR) {

                if (!(Event.isSetAccountIds(purenessReq))) {
                    return next({
                        errorCode   : errorCodes.EVENT_TITLE_IS_EXIST,
                        responseText: req.__('event_must_has_account_id')
                    });
                }

            }

        }

        // 对查询标题进行分词
        if (!_.isEmpty(title) && !_.isUndefined(title)) {
            purenessReq.breakUpTitle2 = Event.getBreakUpTitleAll(2, title);
            purenessReq.breakUpTitle3 = Event.getBreakUpTitleAll(3, title);
        }

        const eventId = purenessReq.id;
        delete purenessReq.id;

        myutil.deepRemove(purenessReq);// 递归删除null
        const result = await Event.updateEventById(eventId, purenessReq);

        if (!_.isUndefined(status) && !_.isEmpty(status)) {
            if(status=='published'){
                //发送发布活动通知
                const eventId           = result.id;
                const userInfo          = await  User.getUserById(result.userId, ['id', 'email']);
                const functionType      = fixParams.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知

                //群发邮件 短信推广 优惠码 社交分享 梅花网站 自定义报名表单
                const sendEmailUrl      = settings.serverUrl+'/activityManage/'+eventId+'/email/label1/1';
                const sendSmsUrl        = settings.serverUrl+'/activityManage/'+eventId+'/sms/label1/1';
                const discountCodeUrl   = settings.serverUrl+'/activityManage/'+eventId+'/discountCode';
                const socialSharingUrl  = settings.serverUrl+'/activityManage/'+eventId+'/socialSharing';
                const eventSiteiteUrl   = settings.serverUrl+'/site/'+eventId;
                const editEventUrl      = settings.serverUrl+'/editEvent/5/'+eventId;
                const toData={
                    eventName:result.title,sendEmailUrl:sendEmailUrl,sendSmsUrl:sendSmsUrl,discountCodeUrl:discountCodeUrl,
                    socialSharingUrl:socialSharingUrl,eventSiteiteUrl:eventSiteiteUrl,editEventUrl:editEventUrl

                }

                sysNotice.sendNotice(req, functionType, 'event_create_ok', 'email',toData,userInfo);
            }

        }
        return res.status(200).json(result);
    } catch (err) {
        logger.error('event/update ', err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

function get(req, res, next) {
    var p       = req.query;
    var eventId = p.id;

    if (!eventId) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'event id')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {
            var eventAttributeNames = [
                'id', 'title', 'content', 'logoUrl', 'bannerUrl', 'thumbnail', 'mobileBannerUrl',
                'startTime', 'endTime', 'pubTime', 'userId', 'organizers', 'categories',
                'keyWords', 'domainName', 'country', 'province', 'city', 'zipCode', 'detailedAddress',
                'lng', 'lat', 'onlineAddress', 'geohash', 'paymentMethod', 'paymentAccountIds', 'paymentPriceUnit',
                'paymentPriceUnitSign', 'tickets', 'isCollectAttendees', 'collectItems', 'ctime', 'utime',
                'isProvideInvoice', 'invoiceSetting', 'isSelfRefundable',
                'refundSettings', 'contact', 'browseCount', 'userBrowseCount', 'status',
                'smsNotice', 'customSmsContent',
            ];
            var orderFields         = ["orderDetails"];
            var values              = yield Promise.props(
                {
                    event : Event.getEventById(eventId, eventAttributeNames),
                    orders: Order.getOrderByEventId(eventId, orderFields),
                }
            );

            var eventInfo   = values.event;
            var eventOrders = values.orders;

            eventInfo.collectItems = _.filter(eventInfo.collectItems, {isDeleted: false});

            var normalTickets          = _.filter(eventInfo.tickets, {status: "normal"});
            eventInfo.tickets          = Event.getTicketsSoldOut(normalTickets, eventOrders);
            eventInfo.invoiceSetting   = Event.getInvoiceSetting(eventInfo.invoiceSetting, req);
            eventInfo.categoriesStrArr = yield Event.getCateStrArr(eventInfo.categories, req);
            eventInfo.categoriesStr    = eventInfo.categoriesStrArr.join();

            Popularize.addVisit(eventInfo, req);
            Event.addEventViewCount(eventInfo);
            Event.addEventUserViewCount(eventInfo, req);

            return res.status(200).send(eventInfo);
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

// 获取所有活动的所有订单
async function __getAllEventOrders(events) {
    try {
        var orderFields = ["orderDetails", "attendees"];
        var promiseArr  = [];
        _.each(events, function (eventInfo) {
            promiseArr.push(Order.getOrderByEventId(eventInfo.id, orderFields));
        });
        var allEventOrders = await Promise.all(promiseArr);
        return allEventOrders;
    } catch (err) {
        throw err;
    }
}

async function getEventsByUserIdAndPageIndex(req, res, next) {
    req.query.userId = req.user.id;

    try {

        const attributeNames = [
            "id", "title", "status", "startTime", "endTime",
            "country", "province", "city", "zipCode", "detailedAddress",
            "lng", "lat", "onlineAddress", "geohash", "tickets", "bannerUrl", "thumbnail",
            "auditNotes"
        ];
        const data           = await Event.getEventsByUserIdAndPageIndex(req.query, attributeNames);
        const allEventOrders = await __getAllEventOrders(data.items);

        let eventIndex = 0;
        for (let eventInfo of data.items) {

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

        const paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        return res.status(200).send(paginate);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}

// 修改活动域名
async function updateEventDomainName(req, res, next) {
    var body       = req.body;
    var eventId    = body.eventId;
    var domainName = body.domainName;

    if (_.isEmpty(eventId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "eventId")
        });
    }
    if (_.isEmpty(domainName)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "domainName")
        });
    }
    try {

        // 判断活动是否存在
        var eventInfo = await Event.getEventById(eventId, ['title', 'domainName']);
        if (_.isEmpty(eventInfo)) {
            return next({
                errorCode   : errorCodes.EVENT_NOT_EXIST,
                responseText: req.__("NotExists", eventId)
            });
        }

        // 新域名和旧域名相同直接返回成功
        if (domainName === eventInfo.domainName) {
            return res.status(200).send(eventInfo);
        }

        // 判断域名是否有效
        var isValidate = await EventDomain.isValidateDomainName(domainName);
        if (!isValidate) {
            return next({
                errorCode   : errorCodes.EVENT_DOMAIN_NAME_IS_EXIST,
                responseText: req.__("Exists", domainName)
            });
        }

        // 更新活动域名
        var results = await Event.updateEventById(eventId, {"domainName": domainName});

        return res.status(200).send(results);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

/**
 * 发现活动
 * @param req
 * @param res
 */
async function discover(req, res, next) {
    const p  = req.query;
    let opts = {
        searchText: p.searchText,
        startDate : p.startDate,
        endDate   : p.endDate,
        category  : p.category,
        city      : p.city,
        page      : p.page,
        limit     : p.limit,
        total     : p.total,
        orderBy   : p.orderBy
    };
    try {
        opts.attributeNames = [
            'id', 'title', 'startTime', 'endTime', 'categories',
            'bannerUrl', 'country', 'province', 'city',
            'detailedAddress', 'organizers', 'userBrowseCount', 'browseCount', 'thumbnail'
        ];

        let data = await Event.discoverEvents(opts);

        for (let eventInfo of data.items) {
            eventInfo.categoriesStrArr = await Event.getCateStrArr(eventInfo.categories, req);
            eventInfo.categoriesStr    = eventInfo.categoriesStrArr.join();
        }

        let paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        return res.status(200).send(paginate);
    } catch (err) {
        logger.error(err);
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}
// 联想返回活动标题
async function lenovoDiscover(req, res, next) {
    var searchText = req.query.searchText;
    var textArr    = Event.getTitleToArr(searchText);
    if (textArr.length < 2) {
        return next({
            statusCode  : 200,
            errorCode   : errorCodes.EVENT_SEARCH_TEXT_TOO_SHORT,
            responseText: req.__("event_search_text_too_short")
        });
    }
    try {
        var events = await Event.lenovoDiscoverEvent(searchText);
        // logger.debug("events: "+JSON.stringify(events));
        return res.status(200).send(events);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 获取活动发件人类别对应的总数
async function getReceiverTypeCount(req, res, next) {
    var params     = req.query;
    var eventId    = params.eventId;
    var recordType = params.recordType;
    // var findType   = params.findType;

    var attributeNames;
    if (_.isEmpty(eventId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "eventId")
        });
    }
    if (_.isEmpty(recordType)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "recordType")
        });
    }
    // if (_.isEmpty(findType)) {
    //     return next({
    //         errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
    //         responseText: req.__("Empty", "findType")
    //     });
    // }else{
    //     // 0: 所有参会人-attendee 1: 所有购票者-paid 2: 超时未支付者-timeOut 3:线下未支付人员-onsite
    //     // 4: 未审核人员-pending 5: 审核拒绝人员-reject
    //     attributeNames = ["buyer"];
    //     if(findType === '0'){
    //         findType = 'attendee';
    //         attributeNames = ["collectInfo"];
    //     }else if(findType === '1'){
    //         findType = 'paid';
    //     }else if(findType === '2'){
    //         findType = 'timeOut';
    //     }else if(findType === '3'){
    //         findType = 'onsite';
    //     }else if(findType === '4'){
    //         findType = 'pending';
    //     }else if(findType === '5'){
    //         findType = 'reject';
    //     }else{
    //         return next({
    //             errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
    //             responseText: req.__("incorrect","findType")
    //         });
    //     }
    // }
    try {
        var findTypes = ['attendee', 'paid', 'timeOut', 'onsite', 'pending', 'reject'];
        var params    = {
            eventId   : eventId,
            recordType: recordType
        };

        var typeCounts = [];
        for (var i = 0; i < findTypes.length; i++) {
            var findType    = findTypes[i]
            params.findType = findType;
            var count       = await Order.getReceiverTypeInfo(params, []);

            var typeObj       = {};
            typeObj[findType] = count;

            typeCounts.push(typeObj);
        }
        return res.status(200).send(typeCounts);

    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

async function getEventCategories(req, res, next) {

    var eventCategories = await Event.getEventCategoriesList(req);

    res.status(200).send(eventCategories);
}

// 更新活动是否开启短信通知
async function updateSmsNotice(req, res, next) {
    var body      = req.body;
    var eventId   = body.eventId;
    var smsNotice = body.smsNotice;

    if (_.isEmpty(eventId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "eventId")
        });
    }

    if (_.isUndefined(smsNotice)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "smsNotice")
        });
    }

    try {

        await Event.getEventById(eventId, ['id']);

        Event.updateEventById(eventId, {smsNotice: smsNotice});

        return res.status(200).send();
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 收款统计
exports.collectionStatistics = async function (req, res, next) {
    try {
        const query   = req.query;
        const eventId = query.eventId;

        if (_.isEmpty(eventId)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "eventId")
            });
        }

        const eventInfo = await Event.getEventById(eventId, ['paymentPriceUnitSign', 'browseCount', 'userBrowseCount']);

        const returnObj = {
            generalView         : {
                browseCount    : eventInfo.browseCount,// 浏览次数
                userBrowseCount: eventInfo.userBrowseCount,// 浏览用户数
                orderCount     : await Order.getOrderCountByEventId(eventId),// 总订单数量
                attendeeCount  : await Order.getAttendeeCount(eventId),// 报名人数
                checkedInCount : await Order.getCheckedInCount(eventId),// 已签到人数
                noSignInCount  : await Order.getNoSignInCount(eventId),// 未签到人数
            },
            collectionStatistics: {
                paymentPriceUnitSign: eventInfo.paymentPriceUnitSign,
                eventRevenue        : await Order.getEventRevenue(eventId),// 活动总收入
                onlineRevenue       : await Order.getOnlineRevenue(eventId),// 线上收款总额
                channelRevenue      : await Transaction.getChannelRevenue(eventId),// 支付通道费用
                systemRevenue       : await Transaction.getSystemRevenue(eventId),// 系统服务费
                availableCash       : await Transaction.getNetIncome(eventId),// 可提现总额
                netIncome           : await Transaction.getNetIncome(eventId),// 净收入总额
                offLineRevenue      : await Order.getOffLineRevenue(eventId),// 线下收款总额
            },
        };

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

function __myunique(reduction) {
    const reduction2 = _.uniqWith(reduction, _.isEqual);
    _.each(reduction, function (value) {
        _.each(reduction2, function (value2) {
            if (value.ticketId === value2.ticketId) {
                value2.total = value2.total || 0;
                value2.total += 1;
            }
        });
    });
    return reduction2;
}

// 处理门票统计数据
function __dealTicketStatistics(ticketStatistics) {
    return _.map(ticketStatistics, function (ticketStatisticInfo) {
        return {
            time     : ticketStatisticInfo.time,
            total    : ticketStatisticInfo.total,
            reduction: __myunique(ticketStatisticInfo.reduction),
        };

    });
}

// 报名统计,门票统计
exports.registrationStatistics = async function (req, res, next) {
    try {
        const query   = req.query;
        const eventId = query.eventId;

        if (_.isEmpty(eventId)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "eventId")
            });
        }

        let ticketStatistics = await Order.getTicketStatistics(eventId);// 门票统计
        ticketStatistics     = __dealTicketStatistics(ticketStatistics);

        const returnObj = {
            ticketStatistics      : ticketStatistics,
            registrationStatistics: await Order.getRegistrationStatistics(eventId),// 报名人数统计
        };

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

function __dealEveryTicketStatistics(ticketSaleList) {

    const totalSaleCountList = ticketSaleList.totalSaleCountList;
    const noSignInCountList  = ticketSaleList.noSignInCountList;
    const signInCountList    = ticketSaleList.signInCountList;

    return _.map(totalSaleCountList, function (ticketSaleInfo) {

        let curSignInCount   = _.find(signInCountList, {"group": ticketSaleInfo.group});
        let curNoSignInCount = _.find(noSignInCountList, {"group": ticketSaleInfo.group});

        if (_.isUndefined(curSignInCount)) {
            curSignInCount = {
                "group"    : ticketSaleInfo.group,
                "reduction": 0,
            }
        }

        if (_.isUndefined(curNoSignInCount)) {
            curNoSignInCount = {
                "group"    : ticketSaleInfo.group,
                "reduction": 0,
            }
        }

        let checkedInRate = (ticketSaleInfo.reduction === 0) ? 0 : Big(curSignInCount.reduction).div(Big(ticketSaleInfo.reduction));
        checkedInRate     = Number(checkedInRate.round(2));

        return {
            group         : ticketSaleInfo.group,
            totalSaleCount: ticketSaleInfo.reduction,
            signInCount   : curSignInCount.reduction,
            noSignInCount : curNoSignInCount.reduction,
            checkedInRate : checkedInRate,
        }
    });

}

// 签到统计
exports.attendeesStatistics = async function (req, res, next) {
    try {
        const query   = req.query;
        const eventId = query.eventId;

        if (_.isEmpty(eventId)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "eventId")
            });
        }

        const attendeeCount   = await Order.getAttendeeCount(eventId);
        const checkedInCount  = await Order.getCheckedInCount(eventId);
        const noSignInCount   = await Order.getNoSignInCount(eventId);
        let checkedInRate     = (attendeeCount === 0) ? Big(0) : Big(checkedInCount).div(Big(attendeeCount));
        checkedInRate         = Number(checkedInRate.round(2));
        const ticketSaleList  = await Order.getEveryTicketStatistics(eventId);
        let newTicketSaleList = __dealEveryTicketStatistics(ticketSaleList);

        const returnObj = {
            attendeeCount : attendeeCount,// 报名人数
            checkedInCount: checkedInCount,// 已签到人数
            noSignInCount : noSignInCount,// 未签到人数
            checkedInRate : checkedInRate,// 签到率
            ticketSaleList: newTicketSaleList,// 每种门票的销售信息
        };

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 参会者表单收集项信息统计
exports.attendeesInformationStatistics = async function (req, res, next) {
    try {
        const body = req.body;

        if (_.isEmpty(body.eventId)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "eventId")
            });
        }

        if (_.isEmpty(body.itemName)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "itemName")
            });
        }

        const returnObj = await Order.collectInfoStatistics(body);

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 校验活动名称是否已存在
async function validateTitle(req, res, next) {
    try {
        const title = req.query.title;
        var count   = await Event.getEventCountTitle(title);
        var result  = count > 0 ? false : true;

        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 根据用户id的数据概览
exports.dataOverview = async function (req, res, next) {
    try {

        const userId = req.user.id;

        if (_.isEmpty(userId)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "userId")
            });
        }

        // 活动访问量统计
        const totalVisitStatistics = await Popularize.totalVisitStatistics(userId);

        // 总收入
        const totalIncomeInfo = await Order.getTotalIncome(userId);

        // 总参会人员
        const totalAttendee = await Order.getTotalAttendee(userId);

        // 活动总数
        const eventTotalCount = await Event.getEventTotalCount(userId);

        const returnObj = {
            totalVisitStatistics: totalVisitStatistics,
            RMBTotalIncome      : Big(totalIncomeInfo.RMBTotalIncome).round(2),
            DollarTotalIncome   : Big(totalIncomeInfo.DollarTotalIncome).round(2),
            totalAttendee       : totalAttendee,
            eventTotalCount     : eventTotalCount,
        };

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 根据用户id的活动访问量统计
exports.visitStatistics = async function (req, res, next) {
    try {

        const userId = req.user.id;

        if (_.isEmpty(userId)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "userId")
            });
        }

        const pcVisitStatistics     = await Popularize.pcVisitStatistics(userId);
        const mobileVisitStatistics = await Popularize.mobileVisitStatistics(userId);

        const returnObj = {
            pcVisitStatistics    : pcVisitStatistics,
            mobileVisitStatistics: mobileVisitStatistics,
        };

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 根据用户id的总收入统计
exports.totalIncomeStatistics = async function (req, res, next) {
    try {

        const userId = req.user.id;

        if (_.isEmpty(userId)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "userId")
            });
        }

        const RMBTotalIncomeStatistics    = await Order.getRMBTotalIncomeStatistics(userId);
        const DollarTotalIncomeStatistics = await Order.getDollarTotalIncomeStatistics(userId);

        const returnObj = {
            RMBTotalIncomeStatistics   : RMBTotalIncomeStatistics,
            DollarTotalIncomeStatistics: DollarTotalIncomeStatistics,
        };

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 根据用户id的报名人数统计
exports.getRegistrationStatisticsByUserId = async function (req, res, next) {
    try {

        const userId = req.user.id;

        if (_.isEmpty(userId)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "userId")
            });
        }

        const statistics = await Order.getRegistrationStatisticsByUserId(userId);

        const returnObj = {
            statistics: statistics,
        };

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 根据用户id查询该用户名下所有活动的统计
exports.getEventStatisticsByUserId = async function (req, res, next) {
    try {

        const userId = req.user.id;

        if (_.isEmpty(userId)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "userId")
            });
        }

        const statistics = await Event.getEventStatisticsByUserId(userId);

        const returnObj = {
            statistics: statistics,
        };

        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};
//根据会议id删除会议
exports.deleteEventByEventId       = async function (req, res, next) {
    try {
        let eventId = req.body.eventId;
        if (_.isEmpty(eventId)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "eventId")
            });
        }
        let [isDelete, err] = await Event.deleteEventById(eventId, req);
        const returnObj     = {
            isDelete: isDelete,
        };
        if (err)
            throw Error(err);
        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 根据会议Id取消Ev
exports.cancelEventByEventId = async function (req, res, next) {
    try {
        let eventId = req.body.eventId;

        if (_.isEmpty(eventId)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "eventId")
            });
        }

        await Event.cancelEventByEventId(eventId);

        const isEvHasOrder = await Order.isEvHasOrder(eventId);

        const responseText = isEvHasOrder ? req.__('event_has_order') : '';

        if (!isEvHasOrder) {
            //发送取消发布通知 event_status_canceled

            const eventInfo    = await Event.getEventById(eventId, ['userId', 'title']);
            const userInfo     = await  User.getUserById(eventInfo.userId, ['id', 'email']);
            const functionType = fixParams.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
            sysNotice.sendNotice(req, functionType, 'event_status_canceled', 'email', {'name': eventInfo.title}, userInfo);
        }

        return next({
            statusCode  : 200,
            errorCode   : errorCodes.COMMON_SUCCESS,
            responseText: responseText,
        });
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

exports.getEventsByAccountId = async function (req, res, next) {
    const query     = req.query;
    const accountId = query.accountId;

    if (_.isEmpty(accountId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "accountId")
        });
    }

    try {

        const eventList = await Event.getEventsByAccountId(accountId);

        return res.status(200).send(eventList);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

exports.uploadRegisterListFile = async function (req, res, next) {
    try {
        let eventId = req.body.eventId;
        const files     = req.files;
        eventId='4103210';
        if(_.isEmpty(eventId)){
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "eventId")
            });
        }
        if (_.isEmpty(files.UpLoadFile)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "fileValue")
            });
        }

        const fileValue = files.UpLoadFile;

        // 判断文件大小
        if (fileValue.size > 2097152) {
            return next({
                errorCode   : errorCodes.ADDRESS_BOOK_FILE_SIZE_ERR,
                responseText: req.__("toMuch", 2097152 + " 字节")
            });
        }

        // 判断文件格式
        const isValidFileType = myutil.inArray(fileValue.type, ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']);
        if (isValidFileType === false) {
            return next({
                errorCode   : errorCodes.ADDRESS_BOOK_FILE_FORMAT_ERR,
                responseText: req.__('not_support_format_file')
            });
        }

        // 获得文件尾缀
        let fileAttribute = fileValue.originalFilename.split('.').pop();
        var appDir     = myutil.getAppDir();// 项目全路径
        var tempFolder = path.join("public/files/registerListFile/", moment().format('YYYYMMDD'));
        var dstPath    = path.join(tempFolder, uuid.v1()+'.'+fileAttribute);// 文件相对路径
        var fullPath   = path.join(appDir, dstPath);// 文件全路径
        myutil.mkdirs.sync(path.join(appDir, tempFolder));
        fs.renameSync(fileValue.path, fullPath);
        //判断文件格式尝试进行GBK转码
        let _table;
        let data =fs.readFileSync(fullPath);
        if(['csv'].indexOf(fileAttribute)!==-1){
            let _tableHeader = data.toString().split("\r\n").shift();
            if(_tableHeader.indexOf('�') !== -1){
                _tableHeader = iconv.decode(data, 'gbk');
            }
            convertToTable(_tableHeader).length<=1
            ?_table=false
            :_table=convertToTable(_tableHeader)[0]
        }
        //对于xls只包含表头转换为空数组
        if(['xls','xlsx'].indexOf(fileAttribute)!==-1){
          let jsonData = myutil.excelConvertJSON(data);
           if(jsonData.length===0){
               _table=false;
           }else{
               _table =  _.keys(jsonData[0])
           }
        }

        if(_table===false){
            return next({
                errorCode:  errorCodes.REGISTERLISTFILES_INVALID,
                responseText: req.__('invalid_file')
            });
        }
        const attribute = ['displayName','itemName','itemId'];
        let collectItems= await Event.getCollectItemsFieldByEventId(eventId,attribute);

        let returnObj ={
            xlsxFile:dstPath,
            xlsxHead:_table,
            collectItems:collectItems
        };
        return res.status(200).send(returnObj);

    } catch (err) {
        logger.error(err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }

    //csv转换
    function convertToTable(data) {
        let table = [];
        let rows = [];
        rows = data.split("\r\n");
        for (let i = 0; i < rows.length; i++) {
            table.push(rows[i].split(","));
        }
        return table;
    }
};

//导入file 对应关系
exports.saveRegisterListRelationship = async function (req, res, next) {
    try {
        let params = req.body;
        if(_.isEmpty(params.relation)){
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "relation")
            });
        }
        if(_.isEmpty(params.filePath)){
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "filePath")
            });
        }
        let fullPath = path.join(myutil.getAppDir(),params.filePath);
        let relationship = JSON.parse(params.relation);
        const attribute = ['displayName','itemName','itemId'];
        let collectItems= await Event.getCollectItemsFieldByEventId('4103210',attribute);

        console.log(collectItems,relationship)
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};
exports.test = async function (req, res, next) {
    try {
        const body     = req.body;
        const settings = require("../conf/settings");

        const ticketUrl_tpl = _.template(settings.eventdoveUrl.ticketUrl, settings.eventdoveUrl.templateSettings);
        let ticketUrl       = ticketUrl_tpl({'orderNumber': 'DD201707177946768648', 'attendeeId': '637888'});

        const eventUrl_tpl = _.template(settings.eventdoveUrl.eventUrl, settings.eventdoveUrl.templateSettings);
        let eventUrl       = eventUrl_tpl({'eventId': '6292548175140098048'});

        const returnObj = {
            eventUrl           : eventUrl,
            ticketUrl          : ticketUrl,
            IsAccountIdHasEvent: await Event.IsAccountIdHasEvent('1490'),
        };


        return res.status(200).send(returnObj);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

exports.getAttendees = async function (req, res, next) {
    const eventId = req.body.eventId
    const orderFields = ['attendees']
    Order.getOrderByEventId(eventId, orderFields)

}