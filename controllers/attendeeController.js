/**
 * Created by zhaohongyu on 2017/2/17.
 */

'use strict';

var _ = require('lodash');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
const settings = require("../conf/settings");
const loggerSettings = require('../logger');
const logger = loggerSettings.winstonLogger;
var Promise = require('bluebird');
var errorCodes = require('../util/errorCodes.js').ErrorCodes;
var Order = require('../model/order');
var Event = require('../model/event');
var moment = require('moment');
var fs = require('fs');
var archiver = require('archiver');
var path = require('path');
var fixParams = require('../util/fixParams');
var util = require('../util/util');

exports.getAttendeesByEventIdAndPageIndex = getAttendeesByEventIdAndPageIndex;
exports.addAttendeeNotes = addAttendeeNotes;
exports.getAttendee = getAttendee;
exports.updateAttendee = updateAttendee;
exports.generateBarcode = generateBarcode;
exports.generateQRcode = generateQRcode;
exports.checkedIn = checkedIn;
exports.batchCheckedIn = batchCheckedIn;
exports.reSendEticket = reSendEticket;
exports.downloadEticket = downloadEticket;
exports.downloadAllEticket = downloadAllEticket;
exports.prepareExportAttendees = prepareExportAttendees;
exports.waitForWirtenCompleted = waitForWirtenCompleted;
exports.downloadFile = downloadFile;

// 根据对应语言返回对应的签到状态列表
function __getSignStatusList(req) {
    var signStatus = ['signIn', 'notSign'];
    var signStatusList = [];
    _.each(signStatus, function(status) {
        var i18nKey = "sign_status_" + status;
        signStatusList.push({
            name: status,
            str: req.__(i18nKey)
        })
    });
    return signStatusList;
}

// 返回活动的所有门票列表
function __getTicketList(tickets) {
    return _.map(tickets, function(ticketInfo) {
        return {
            name: ticketInfo.ticketId,
            str: ticketInfo.name
        };
    });
}

// 根据活动id查询所有参会者
async function getAttendeesByEventIdAndPageIndex(req, res, next) {
    const params = req.query;
    const eventId = params.eventId;

    if (_.isEmpty(eventId)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'eventId')
        });
    }

    try {

        // 分页返回数据
        const data = await Order.getAttendeesByEventIdAndPageIndex(params);

        const eventAttributeNames = ['tickets', 'collectItems'];
        const eventInfo = await Event.getEventById(eventId, eventAttributeNames);
        const collectItems = eventInfo.collectItems;

        // 门票类型对应的多语显示字符串
        const ticketTypeList = Order.getTicketTypeList(req);

        for (let attendeeInfo of data.items) {

            const isEarlyBirdTicket = Order.isEarlyBirdTicket(attendeeInfo.currentTicketInfo, attendeeInfo.cTime);
            attendeeInfo.currentTicketInfo.ticketType = isEarlyBirdTicket === true ? 'earlyBird' : 'normal';

            const i18nTicketType = _.find(ticketTypeList, {
                name: attendeeInfo.currentTicketInfo.ticketType
            });
            attendeeInfo.currentTicketInfo.ticketTypeStr = i18nTicketType.str;

            attendeeInfo.collectInfoDetails = __getCollectInfoDetails(attendeeInfo.collectInfo, collectItems);

        }

        const result = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        result.signStatusList = __getSignStatusList(req); // 签到状态
        result.ticketList = __getTicketList(eventInfo.tickets); // 所有门票列表
        result.attendeeStatusList = Order.getAttendeeStatusList(req); // 退票状态列表

        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 获取采集项展示详情给前端
function __getCollectInfoDetails(collectInfo, collectItems) {
    var collectInfoDetails = [];
    _.each(collectInfo, function(value, key) {
        var collectItemInfo = Event.getFormFieldByName(collectItems, key);

        if (!(_.isEmpty(collectItemInfo))) {
            collectInfoDetails.push({
                name: key,
                str: collectItemInfo.displayName,
                displayOrder: collectItemInfo.displayOrder,
                value: value
            });
        }

    });
    return collectInfoDetails;
}

// 根据参会人员主键id查询参会人员详情
async function getAttendee(req, res, next) {
    var params = req.query;
    var orderNumber = params.orderNumber;
    var attendeeId = params.attendeeId;

    if (_.isEmpty(orderNumber)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'orderNumber')
        });
    }

    if (_.isEmpty(attendeeId)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'attendeeId')
        });
    }

    try {

        // 根据订单号查询订单是否存在
        var orderAttributeNames = [
            'id', 'orderNumber', 'buyer', 'totalPrice', 'originalPriceTotal',
            'serviceFee', 'thirdPartyCharge', 'currencyType', 'paymentPriceUnitSign', 'status', 'paymentMethod',
            'purchasePlatform', 'orderDetails', 'attendees', 'invoice', 'discount',
            'uTime', 'cTime', 'eventId', 'userId', 'orderNote',
        ];
        var orderInfo = await __getOrderByOrderNum(orderNumber, orderAttributeNames);
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'orderNumber')
            });
        }

        // 根据参会者id查询参会者是否存在
        var attendeeInfo = _.find(orderInfo.attendees, {
            attendeeId: attendeeId
        });
        if (_.isEmpty(attendeeInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'attendeeId')
            });
        }

        // 根据活动id查询活动是否存在
        var eventId = orderInfo.eventId;
        var eventAttributeNames = ['id', 'tickets', 'collectItems', 'title', 'onlineAddress', 'detailedAddress', 'startTime', 'endTime', 'lng', 'lat'];
        var eventInfo = await Event.getEventById(eventId, eventAttributeNames);

        // 查询门票
        var ticketInfo = attendeeInfo.currentTicketInfo;

        // 根据表单收集项名字查询表单收集项信息
        attendeeInfo.collectInfoDetails = __getCollectInfoDetails(attendeeInfo.collectInfo, eventInfo.collectItems);
        attendeeInfo.notes = attendeeInfo.notes || '';

        // 订单状态对应的多语显示字符串
        var i18nStatus = _.find(Order.getOrderStatusList(req), {
            name: orderInfo.status
        });
        orderInfo.statusStr = i18nStatus.str;

        // 门票类型对应的多语显示字符串
        var isEarlyBirdTicket = Order.isEarlyBirdTicket(ticketInfo, orderInfo.cTime);
        ticketInfo.ticketType = isEarlyBirdTicket === true ? 'earlyBird' : 'normal';
        var i18nTicketType = _.find(Order.getTicketTypeList(req), {
            name: ticketInfo.ticketType
        });
        ticketInfo.ticketTypeStr = i18nTicketType.str;

        delete orderInfo.attendees;
        var resultObj = {
            attendeeInfo: attendeeInfo,
            ticketInfo: ticketInfo,
            orderInfo: orderInfo,
            eventInfo: _.pick(eventInfo, ['title', 'onlineAddress', 'detailedAddress', 'startTime', 'endTime', 'lng', 'lat']),
        };

        return res.status(200).send(resultObj);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 根据订单号查询所有参会人员详情
exports.getAllAttendee = async function(req, res, next) {
    const params = req.query;
    const orderNumber = params.orderNumber;

    if (_.isEmpty(orderNumber)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'orderNumber')
        });
    }

    try {

        // 根据订单号查询订单是否存在
        const orderAttributeNames = [
            'id', 'orderNumber', 'buyer', 'totalPrice', 'originalPriceTotal',
            'serviceFee', 'thirdPartyCharge', 'currencyType', 'paymentPriceUnitSign', 'status', 'paymentMethod',
            'purchasePlatform', 'orderDetails', 'attendees', 'invoice', 'discount',
            'uTime', 'cTime', 'eventId', 'userId', 'orderNote',
        ];
        const orderInfo = await __getOrderByOrderNum(orderNumber, orderAttributeNames);
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'orderNumber')
            });
        }

        // 订单状态对应的多语显示字符串
        const i18nStatus = _.find(Order.getOrderStatusList(req), {
            name: orderInfo.status
        });
        orderInfo.statusStr = i18nStatus.str;

        // 根据活动id查询活动是否存在
        const eventId = orderInfo.eventId;
        const eventAttributeNames = ['id', 'tickets', 'collectItems', 'title', 'onlineAddress', 'detailedAddress', 'startTime', 'endTime', 'lng', 'lat'];
        const eventInfo = await Event.getEventById(eventId, eventAttributeNames);

        for (let attendeeInfo of orderInfo.attendees) {

            // 根据表单收集项名字查询表单收集项信息
            attendeeInfo.collectInfoDetails = __getCollectInfoDetails(attendeeInfo.collectInfo, eventInfo.collectItems);
            attendeeInfo.notes = attendeeInfo.notes || '';

            // 查询门票
            const ticketInfo = attendeeInfo.currentTicketInfo;
            // 门票类型对应的多语显示字符串
            const isEarlyBirdTicket = Order.isEarlyBirdTicket(ticketInfo, orderInfo.cTime);
            ticketInfo.ticketType = isEarlyBirdTicket === true ? 'earlyBird' : 'normal';
            const i18nTicketType = _.find(Order.getTicketTypeList(req), {
                name: ticketInfo.ticketType
            });
            ticketInfo.ticketTypeStr = i18nTicketType.str;

            attendeeInfo.currentTicketInfo = ticketInfo;

        }

        const resultObj = {
            orderInfo: orderInfo,
            eventInfo: _.pick(eventInfo, ['title', 'onlineAddress', 'detailedAddress', 'startTime', 'endTime', 'lng', 'lat']),
        };

        return res.status(200).send(resultObj);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
};

// 根据参会人员主键id更新参会人员信息
async function updateAttendee(req, res, next) {
    var params = req.body;
    var orderNumber = params.orderNumber;
    var attendeeId = params.attendeeId;
    var collectInfo = params.collectInfo;

    if (_.isEmpty(orderNumber)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'orderNumber')
        });
    }

    if (_.isEmpty(attendeeId)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'attendeeId')
        });
    }

    if (_.isEmpty(collectInfo)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'collectInfo')
        });
    }

    try {

        // 1. 根据订单号查询订单是否存在
        var orderAttributeNames = ['id', 'attendees'];
        var orderInfo = await __getOrderByOrderNum(orderNumber, orderAttributeNames);
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'orderNumber')
            });
        }

        // 2. 根据参会者id查询参会者是否存在
        var attendeeIndex = _.findIndex(orderInfo.attendees, {
            attendeeId: attendeeId
        });
        if (attendeeIndex === -1) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'attendeeId')
            });
        }

        // 3. 取得原有表单收集项的字段信息
        var originCollectInfo = orderInfo['attendees'][attendeeIndex]['collectInfo'];

        // 4. 去除新提交的collectInfo中不在originCollectInfoField的字段
        var purenessReq = myutil.getPurenessRequsetFields(collectInfo, originCollectInfo); // 准备需要插入数据库的数据

        // 5. 更新
        _.each(purenessReq, function(value, key) {
            orderInfo['attendees'][attendeeIndex]['collectInfo'][key] = value;
        });

        // todo 验证变更参数的唯一性

        // 6. 同步到数据库
        var result = Order.updateAttendees(orderInfo.id, orderInfo.attendees);
        return res.status(200).send(orderInfo.attendees[attendeeIndex]);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 根据订单号和参会者id修改参会者
exports.updateAttendeeById = async function updateAttendeeById(req, res, next) {

    const body = req.body;
    const orderNumber = body.orderNumber; //订单编号
    const attendeeId = body.attendeeId; //参会者id
    const qrCodeTicket = body.qrCode;
    const wxopenId = body.wxopenId;

    try {

        // 根据订单号查询订单信息 中的所有参会者信息
        const attributeNames = ['id', 'attendees'];
        const orderInfo = await __getOrderByOrderNum(orderNumber, attributeNames);

        // 该订单下的所有参会者信息
        const attendeeList = orderInfo.attendees || [];

        // 根据参会者id查询参会者信息下标
        const attendeeIndex = _.findIndex(attendeeList, {
            attendeeId: attendeeId
        });
        if (attendeeIndex === -1) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'attendeeId')
            });
        }
        //这个参会者信息
        const attendeeInfo = attendeeList[attendeeIndex];

        // 该参会者需要更新的字段
        const updateParams = myutil.getPurenessRequsetFields(body, Order.OrderFields.attendees[0]);

        // 新对象的值会覆盖原对象的值
        const updateData = _.merge(attendeeInfo, updateParams);

        await Order.updateAttendeesByONu(orderNumber, updateData, {
            attendeeIndex: attendeeIndex
        });

        return res.status(200).send(updateParams);

    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message,
        });
    }
};

// 根据参会人员主键id数组重新发送电子票
async function reSendEticket(req, res, next) {
    var params = req.body;
    var orderNumber = params.orderNumber;
    var attendeeIds = params.attendeeIds;

    if (_.isEmpty(orderNumber)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'orderNumber')
        });
    }

    if (_.isEmpty(attendeeIds)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'attendeeIds')
        });
    }

    try {

        // 根据订单号查询订单是否存在
        var orderAttributeNames = ['id', 'orderNumber', 'attendees', 'cTime', 'eventId', 'buyer'];
        var orderInfo = await __getOrderByOrderNum(orderNumber, orderAttributeNames);
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'orderNumber')
            });
        }

        // 如果订单未支付不能进行重新发送电子票操作
        if (orderInfo.status !== fixParams.ORDER_STATUS.ORDER_STATUS_PAID) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('order_not_paid')
            });
        }

        // 根据活动id查询活动是否存在
        var eventAttributeNames = ['id', 'userId', 'title', 'organizers', 'tickets', 'onlineAddress', 'detailedAddress', 'thumbnail', 'contact'];
        var eventInfo = await Event.getEventById(orderInfo.eventId, eventAttributeNames);

        // 根据参会者主键id数组查询参会者详情信息数组
        var needSendETicketAttendees = Order.getAttendees(attendeeIds, orderInfo.attendees);
        if (_.isEmpty(needSendETicketAttendees)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'attendeeIds')
            });
        }

        for (var attendeeInfo of needSendETicketAttendees) {
            let attendeeInfos = [attendeeInfo]; //参会者
            let pdfName = attendeeInfo.attendeeId; //pdf名称
            var toReplaceData = await Order.getTicketReplaceData(eventInfo, orderInfo, attendeeInfos, req); // 拼装要进行替换的变量
            var pdfPath = await Order.createETicket(orderInfo, pdfName, toReplaceData, req);
            Order.sendETicketEmail(eventInfo, orderInfo, attendeeInfo, toReplaceData, req);
            Order.updateETicketSent(orderInfo, attendeeInfo.attendeeId);
        }

        return res.status(200).send();
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 下载单张电子票
async function downloadEticket(req, res, next) {
    var params = req.query;
    var orderNumber = params.orderNumber;
    var attendeeId = params.attendeeId;

    if (_.isEmpty(orderNumber)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'orderNumber')
        });
    }

    if (_.isEmpty(attendeeId)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'attendeeId')
        });
    }

    try {

        // 根据订单号查询订单是否存在
        var orderAttributeNames = ['id', 'orderNumber', 'status', 'attendees', 'cTime', 'eventId', 'buyer'];
        var orderInfo = await __getOrderByOrderNum(orderNumber, orderAttributeNames);
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'orderNumber')
            });
        }

        // 如果订单未支付不能进行下载电子票操作
        if (orderInfo.status !== fixParams.ORDER_STATUS.ORDER_STATUS_PAID) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('order_not_paid')
            });
        }

        // 根据活动id查询活动是否存在
        var eventAttributeNames = ['id', 'title', 'organizers', 'tickets', 'onlineAddress', 'detailedAddress', 'thumbnail', 'contact'];
        var eventInfo = await Event.getEventById(orderInfo.eventId, eventAttributeNames);

        // 根据参会者id查询参会者是否存在
        var attendeeInfo = _.find(orderInfo.attendees, {
            attendeeId: attendeeId
        });
        if (_.isEmpty(attendeeInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'attendeeId')
            });
        }

        const attendeeInfos = [attendeeInfo]; //参会者
        const pdfName = attendeeInfo.attendeeId; //pdf名称

        var toReplaceData = await Order.getTicketReplaceData(eventInfo, orderInfo, attendeeInfos, req); // 拼装要进行替换的变量
        var pdfPath = await Order.createETicket(orderInfo, pdfName, toReplaceData, req);

        res.set({
            'Content-Type': 'application/pdf'
        });
        return res.download(pdfPath);
    } catch (err) {
        logger.error('downloadEticket ', err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 下载所有电子票
async function downloadAllEticket(req, res, next) {
    var params = req.query;
    var orderNumber = params.orderNumber;

    if (_.isEmpty(orderNumber)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'orderNumber')
        });
    }

    try {

        // 根据订单号查询订单是否存在
        var orderAttributeNames = ['id', 'orderNumber', 'status', 'attendees', 'cTime', 'eventId', 'buyer'];
        var orderInfo = await __getOrderByOrderNum(orderNumber, orderAttributeNames);
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'orderNumber')
            });
        }

        // 如果订单未支付不能进行下载电子票操作
        if (orderInfo.status !== fixParams.ORDER_STATUS.ORDER_STATUS_PAID) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('order_not_paid')
            });
        }

        // 根据活动id查询活动是否存在
        var eventAttributeNames = ['id', 'title', 'organizers', 'tickets', 'onlineAddress', 'detailedAddress', 'thumbnail', 'contact'];
        var eventInfo = await Event.getEventById(orderInfo.eventId, eventAttributeNames);

        res.set({
            'Content-Type': 'application/octet-stream'
        });
        var ticketZipPath = Order.getTicketPath(orderInfo.cTime, orderInfo.orderNumber + '.zip');
        var fileExists = myutil.fsExistsSync(ticketZipPath);
        if (fileExists) {
            return res.download(ticketZipPath);
        }

        var output = fs.createWriteStream(ticketZipPath); // 创建一最终打包文件的输出流
        var archive = archiver('zip', {
            zlib: {
                level: 9
            }
        }); // 生成archiver对象，打包类型为zip
        archive.pipe(output); // 将打包对象与输出流关联

        for (var attendeeInfo of orderInfo.attendees) {
            let attendeeInfos = [attendeeInfo]; //参会者
            let pdfName = attendeeInfo.attendeeId; //pdf名称
            var toReplaceData = await Order.getTicketReplaceData(eventInfo, orderInfo, attendeeInfos, req); // 拼装要进行替换的变量
            var pdfPath = await Order.createETicket(orderInfo, pdfName, toReplaceData, req);
            archive.append(fs.createReadStream(pdfPath), {
                name: path.basename(pdfPath)
            }); // 将被打包文件的流添加进archiver对象中
        }

        archive.finalize(); // 打包

        return res.download(ticketZipPath);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// todo 根据参会人员主键id进行退票操作

// 签到/取消签到
async function checkedIn(req, res, next) {
    const checkedInInfo = req.body;

    let validRes = __validCheckedInInfo(req, checkedInInfo);
    if (!validRes.isValid) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: validRes.responseText
        });
    }

    try {

        let validResFromDb = await __validCheckedInInfoFromDb(req, checkedInInfo);
        if (!validResFromDb.isValid) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: validResFromDb.responseText
            });
        }

        return res.status(200).send(validResFromDb.orderInfo.attendees[validResFromDb.attendeeIndex]);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 校验签到信息参数是否合规
function __validCheckedInInfo(req, checkedInInfo) {
    checkedInInfo = checkedInInfo || {};
    const orderNumber = checkedInInfo.orderNumber;
    const attendeeId = checkedInInfo.attendeeId;
    const checkedInType = checkedInInfo.checkedInType;
    const checkedStatus = checkedInInfo.checkedStatus;

    if (_.isEmpty(orderNumber)) {
        return {
            isValid: false,
            responseText: req.__('Empty', 'orderNumber'),
        };
    }

    if (_.isEmpty(attendeeId)) {
        return {
            isValid: false,
            responseText: req.__('Empty', 'attendeeId'),
        };
    }

    if (_.isEmpty(checkedInType)) {
        return {
            isValid: false,
            responseText: req.__('Empty', 'checkedInType'),
        };
    }

    if (!_.isBoolean(checkedStatus)) {
        return {
            isValid: false,
            responseText: req.__('type_must_be_boolean', 'checkedStatus'),
        };
    }

    if (!myutil.inArray(checkedInType, ['admin', 'user'])) {
        return {
            isValid: false,
            responseText: req.__("err_invalid_req_parameters"),
        };
    }

    return {
        isValid: true,
        responseText: '',
    };
}

// 在数据库层面校验签到信息是否合规,并且更新对应的签到信息
async function __validCheckedInInfoFromDb(req, checkedInInfo) {
    try {

        const orderNumber = checkedInInfo.orderNumber;
        const attendeeId = checkedInInfo.attendeeId;
        const checkedInType = checkedInInfo.checkedInType;
        const checkedStatus = checkedInInfo.checkedStatus;
        const checkedInTime = _.isUndefined(checkedInInfo.checkedInTime) ? new Date() : new Date(checkedInInfo.checkedInTime);

        // 根据订单号查询订单是否存在,是否已经支付过
        const orderAttributeNames = ['id', 'attendees', 'status'];
        const orderInfo = await __getOrderByOrderNum(orderNumber, orderAttributeNames);
        if (_.isEmpty(orderInfo)) {
            return {
                isValid: false,
                responseText: req.__('NotExists', 'orderNumber=' + orderNumber),
            };
        }

        // 根据参会者id查询参会者是否存在
        const attendeeIndex = _.findIndex(orderInfo.attendees, {
            attendeeId: attendeeId
        });
        if (attendeeIndex === -1) {
            return {
                isValid: false,
                responseText: req.__('NotExists', 'attendeeId=' + attendeeId),
            };
        }

        const attendeeInfo = orderInfo.attendees[attendeeIndex];

        if (!Order.isAttendeeCanCheckedIn(attendeeInfo)) {
            return {
                isValid: false,
                responseText: req.__('not_paid', 'attendeeId=' + attendeeId),
            };
        }

        const toBeUpdateData = {
            isCheckedIn: checkedStatus,
            checkedInType: checkedInType,
            checkedInTime: checkedInTime,
        };

        // 组装更新数据
        _.each(toBeUpdateData, function(value, key) {
            orderInfo['attendees'][attendeeIndex][key] = value;
        });

        // 更新
        await Order.updateAttendees(orderInfo.id, orderInfo['attendees']);

        return {
            isValid: true,
            responseText: '',
            orderInfo: orderInfo,
            attendeeIndex: attendeeIndex
        };
    } catch (err) {
        return {
            isValid: false,
            responseText: err.message,
        };
    }
}

// 校验批量签到数组,取出合规的和不合规的
async function __validCheckedInArr(req, checkedInArr) {

    let legalCheckedInfoArr = []; // 合规的签到信息数组
    let illegalCheckedInfoArr = []; // 不合规的签到信息数组

    for (let checkedInInfo of checkedInArr) {

        let validRes = __validCheckedInInfo(req, checkedInInfo);
        if (!validRes.isValid) {

            // 记录不合规的签到信息
            let newCheckedInInfo = _.cloneDeep(checkedInInfo);
            newCheckedInInfo.responseText = validRes.responseText;
            illegalCheckedInfoArr.push(newCheckedInInfo);

            continue;
        }

        let validResFromDb = await __validCheckedInInfoFromDb(req, checkedInInfo);
        if (!validResFromDb.isValid) {

            // 记录不合规的签到信息
            let newCheckedInInfo = _.cloneDeep(checkedInInfo);
            newCheckedInInfo.responseText = validResFromDb.responseText;
            illegalCheckedInfoArr.push(newCheckedInInfo);

            continue;
        }

        legalCheckedInfoArr.push(checkedInInfo);

    }

    return {
        legalCheckedInfoArr: legalCheckedInfoArr,
        illegalCheckedInfoArr: illegalCheckedInfoArr,
    }
}

// 批量签到/取消签到
async function batchCheckedIn(req, res, next) {
    var checkedInArr = req.body;

    if (_.isEmpty(checkedInArr)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'checkedInArr')
        });
    }

    try {

        let result = await __validCheckedInArr(req, checkedInArr);

        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 添加备注
async function addAttendeeNotes(req, res, next) {
    var params = req.body;
    var orderNumber = params.orderNumber;
    var attendeeId = params.attendeeId;
    var notes = params.notes;

    if (_.isEmpty(orderNumber)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'orderNumber')
        });
    }

    if (_.isEmpty(attendeeId)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'attendeeId')
        });
    }

    if (_.isEmpty(notes)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'notes')
        });
    }

    try {

        // 1. 根据订单号查询订单是否存在
        var orderAttributeNames = ['id', 'attendees'];
        var orderInfo = await __getOrderByOrderNum(orderNumber, orderAttributeNames);
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'orderNumber')
            });
        }

        // 2. 根据参会者id查询参会者是否存在
        var attendeeIndex = _.findIndex(orderInfo.attendees, {
            attendeeId: attendeeId
        });
        if (attendeeIndex === -1) {
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('NotExists', 'attendeeId')
            });
        }

        // 3. 更新参会者信息
        orderInfo.attendees[attendeeIndex].notes = notes;
        orderInfo.attendees[attendeeIndex].notesTimestamp = new Date();

        // 4. 同步到数据库
        var result = Order.updateAttendees(orderInfo.id, orderInfo.attendees);
        return res.status(200).send(orderInfo.attendees[attendeeIndex]);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 根据给定内容生成barcode
function generateBarcode(req, res, next) {
    var params = req.query;
    var text = params.text;
    if (_.isEmpty(text)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'text')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            var Barcode = myutil.getBarcode(text);
            res.set({
                'Content-Type': 'image/png',
            });
            return res.status(200).send(Barcode);
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER,
                responseText: err.message
            });
        }
    })();
}

// 根据给定内容生成二维码
function generateQRcode(req, res, next) {
    var params = req.query;
    var text = params.text;
    if (_.isEmpty(text)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'text')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            var QRcode = yield myutil.getQRcode(text);
            res.set({
                'Content-Type': 'image/svg+xml',
            });
            return res.status(200).send(QRcode);
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER,
                responseText: err.message
            });
        }
    })();
}

/**
 * 根据订单号查询订单详情
 * @param orderNumber
 * @param orderAttributeNames
 * @returns {*}
 * @private
 */
async function __getOrderByOrderNum(orderNumber, orderAttributeNames) {
    var orderInfo = await Order.getOrderByOrderNum(orderNumber, orderAttributeNames);
    return orderInfo;
}

// 获取导出参会者列表的excel表头
function __getAttendeesHeaders(req) {
    var headers = [
        req.__('attendees_headers_name'), req.__('attendees_headers_email'),
        req.__('attendees_headers_mobile'), req.__('attendees_headers_signTime'),
        req.__('attendees_headers_ticketName'), req.__('attendees_headers_signStatus'),
        req.__('attendees_headers_attendeesStatus'), req.__('attendees_headers_registrationTime'),
        req.__('attendees_headers_orderStatus'), req.__('attendees_headers_orderNumber'),
        req.__('attendees_headers_payMethod'), req.__('attendees_headers_discountCode')
    ];
    return headers;
}

// 获取导出参会者列表的excel数据
async function __getAttendeesData(req, eventInfo) {

    // [
    //     "姓名", "邮箱", "手机", "签到时间", "票名", "签到状态",
    //     "参会者状态", "报名时间", "订单状态", "订单号", "支付方式", "优惠码"
    // ]

    var attendeesData = [];

    var params = req.query;
    var eventId = params.eventId;

    var headers = __getAttendeesHeaders(req);

    // 组装参会者信息
    const attendees = await Order.getAllAttendeesByEventId(params);

    var orderStatusList = Order.getOrderStatusList(req); // 查询所有订单状态
    var paymentMethodList = Order.getPaymentMethodList(req, false); // 查询所有支付方式
    var attendeeStatusList = Order.getAttendeeStatusList(req); // 退票状态列表
    var signStatusList = __getSignStatusList(req); // 签到状态

    for (var attendeeInfo of attendees.items) {

        var orderInfo = await __getOrderByOrderNum(attendeeInfo.codeObj.orderNumber, ['cTime', 'purchasePlatform', 'status', 'paymentMethod', 'orderDetails']);
        var collectInfoDetails = __getCollectInfoDetails(attendeeInfo.collectInfo, eventInfo.collectItems);
        var orderDetails = orderInfo.orderDetails;

        var name = attendeeInfo.collectInfo.name || ''; // 姓名
        var email = attendeeInfo.collectInfo.email || ''; // 邮箱
        var mobile = attendeeInfo.collectInfo.mobile || ''; // 手机
        var signTime = attendeeInfo.checkedInTime || ''; // 签到时间
        var ticketName = attendeeInfo.codeObj.ticketName || ''; // 票名

        var signStatusName = attendeeInfo.isCheckedIn === true ? 'signIn' : 'notSign';
        var i18nSignStatus = _.find(signStatusList, {
            name: signStatusName
        });
        var signStatus = i18nSignStatus.str || ''; // 签到状态

        var i18nAttendeesStatus = _.find(attendeeStatusList, {
            name: attendeeInfo.attendeeStatus
        });
        var attendeesStatus = i18nAttendeesStatus.str || ''; // 参会者状态

        var registrationTime = moment(orderInfo.cTime).format('YYYY-MM-DD HH:mm') || ''; // 报名时间

        var i18nOrderStatus = _.find(orderStatusList, {
            name: orderInfo.status
        });
        var orderStatus = i18nOrderStatus.str || ''; // 订单状态

        var orderNumber = attendeeInfo.codeObj.orderNumber || ''; // 订单号

        var i18nPayMethod = _.find(paymentMethodList, {
            name: orderInfo.paymentMethod
        });
        var payMethod = i18nPayMethod.str || ''; // 支付方式


        var orderDetail = _.find(orderDetails, {
            ticketId: attendeeInfo.codeObj.ticketId
        });
        var discountCode = orderDetail.discountCode || ''; // 优惠码

        var oneAttendeeInfo = [];
        oneAttendeeInfo.push(name);
        oneAttendeeInfo.push(email);
        oneAttendeeInfo.push(mobile);
        oneAttendeeInfo.push(signTime);
        oneAttendeeInfo.push(ticketName);
        oneAttendeeInfo.push(signStatus);
        oneAttendeeInfo.push(attendeesStatus);
        oneAttendeeInfo.push(registrationTime);
        oneAttendeeInfo.push(orderStatus);
        oneAttendeeInfo.push(orderNumber);
        oneAttendeeInfo.push(payMethod);
        oneAttendeeInfo.push(discountCode);

        // 自定义表单收集项
        for (var collectInfoDetail of collectInfoDetails) {

            if (!myutil.inArray(collectInfoDetail.name, ['name', 'email'])) {
                headers.push(collectInfoDetail.str);
                oneAttendeeInfo.push(collectInfoDetail.value);
            }

        }

        attendeesData.push(oneAttendeeInfo);
    }

    return {
        data: attendeesData,
        headers: _.uniq(headers)
    };
}

function __createAttendeesExcel(req, filePath) {
    Promise.coroutine(function*() {

        var params = req.query;
        var eventId = params.eventId;

        logger.debug('eventId=' + eventId + '正在创建导出参会人员excel数据...');

        var eventAttributeNames = ['id', 'title', 'startTime', 'endTime', 'detailedAddress', 'onlineAddress', 'collectItems'];
        var eventInfo = yield Event.getEventById(eventId, eventAttributeNames);

        var eventTitle = eventInfo.title;
        var eventTime = Event.getEventTimeStr(eventInfo);
        var eventLocation = Event.getEventLocation(req, eventInfo);
        var attendeesData = yield __getAttendeesData(req, eventInfo);
        var sheets = [{
            name: req.__('attendees_sheet_name'),
            info: [
                req.__('attendees_event_name', eventTitle),
                req.__('attendees_event_time', eventTime),
                req.__('attendees_event_location', eventLocation),
            ],
            headers: attendeesData.headers,
            data: attendeesData.data
        }];

        logger.debug('eventId=' + eventId + '导出参会人员excel数据完成...');

        myutil.createExcel(sheets, filePath);
    })();
}

async function prepareExportAttendees(req, res, next) {
    var params = req.query;
    var eventId = params.eventId;

    if (_.isEmpty(eventId)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'eventId')
        });
    }

    try {

        var filePath = __getAttendeesExcelPath(eventId);

        __createAttendeesExcel(req, filePath);

        return res.status(200).send({
            filePath: filePath
        });
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

// 获取参会者excel文件的路径
function __getAttendeesExcelPath(eventId) {
    var appDir = myutil.getAppDir();
    var folderName = 'attendees';
    var fileName = eventId + '.xlsx';
    var filePath = path.join("public/files/", folderName, fileName);
    return filePath;
}

// 检测文件是否写入完成
async function waitForWirtenCompleted(req, res, next) {
    var params = req.query;
    var filePath = params.filePath;

    if (_.isEmpty(filePath)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'filePath')
        });
    }

    var isAllow = _.startsWith(filePath, 'public');

    if (!isAllow) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('illegal_operation')
        });
    }

    try {

        var isWriteComplete = await myutil.waitForWirtenCompleted(filePath);

        return res.status(200).send({
            isWriteComplete: isWriteComplete
        });
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}


function downloadFile(req, res, next) {
    var params = req.query;
    var filePath = params.filePath;

    if (_.isEmpty(filePath)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'filePath')
        });
    }

    var isAllow = _.startsWith(filePath, 'public');

    if (!isAllow) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('illegal_operation')
        });
    }

    var fileExists = myutil.fsExistsSync(filePath);
    if (!fileExists) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('NotExists', 'filePath')
        });
    }

    return res.download(filePath);
}

// 根据条件搜索参会者信息
exports.serchAttendeesByQuery = async function(req, res, next) {

    logger.info(req.body.eventId)
    req.checkBody('eventId').notEmpty()
    req.checkBody('user').notEmpty()
    req.getValidationResult().then(function(result) {
        if (!result.isEmpty()) {
            res.status(400).send('validation errors: ' + JSON.stringify(result.array()));
            return
        }
    }, function(e) {
        logger.error('验证出错', e)
    })

    let eventId = _.trim(req.body.eventId)
    let user = _.trim(req.body.user).split(',')

    let resultArr = []


    // user.forEach((val)=>{

    // })

    for (var i = user.length - 1; i >= 0; i--) {
        let val = user[i]
        let key = util.getSearchType(val)
        let dbResult = await Order.searchEventAttendeesByKey(eventId, key, val);
        resultArr.push(dbResult)
    }

    res.send(resultArr)

}