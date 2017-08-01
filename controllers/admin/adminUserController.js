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
var Wallet      = require('../../model/wallet');
var Member      = require('../../model/member');

const sysNotice  = require('../../model/admin/sysNotice');

exports.getUsersPageIndex    = getUsersPageIndex;
exports.updateAuditStatus    = updateAuditStatus;
exports.getAllUser           = getAllUserWithPageIndex;
exports.updateUser           = updateUser;
exports.getUserById          = getUserById;
exports.getUserEvent         = getUserEventWithPageIndex;
exports.getUserGroups         = getUserGroupsWithPageIndex;
exports.getUserOrders         = getUserOrderWithPageIndex;


// 获取须审核认证用户
async function getUsersPageIndex(req, res, next) {
    try {
        var params = req.query;
        var data            = await User.getUsersWithAuditPageIndex(params);
        var paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);

        return res.status(200).send(paginate);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }
}
// 修改用户审核状态
async function updateAuditStatus(req, res, next) {
    var body        = req.body;
    var userId      = body.userId;
    var newstatus   = body.status;
    if (_.isEmpty(userId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "userId")
        });
    }
    if (_.isEmpty(newstatus)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "status")
        });
    }
    try {
        var auditInfo = {
            "status":newstatus,
            "note"  :_.isEmpty(body.note) ? '' : body.note
        }

        var results = await User.updateRealNameAuthentication(userId, auditInfo);
        //发送通知
        sysNotice.sendUserAuditNotcie(req,results)
        return res.status(200).send(results);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }

}

// 分页获取所有用户
async function getAllUserWithPageIndex(req, res, next) {
    var params       = req.query;
    try {
        var attributeNames = ['id', 'username', 'nickname', 'email', 'phone','lastLoginIp', 'ctime', 'userPackage', 'accountStatus','password'];

        var data = await User.getAllWithPageIndex(params,attributeNames);
        var userStatusList  = [
            {name:'disabled',str:'冻结'},
            {name:'normal',str:'正常'}
        ];
        var paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);
        paginate.userStatusList = userStatusList;

        return res.status(200).send(paginate);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

async function getUserById(req, res, next) {
    var id       = req.query.id;
    try {
        var user = await User.getUserById(id);
        // 获取用户VIP等级
        var count = await Event.getEventsByUserIdWithIsVip(id);
        var userPackage = user.userPackage;
        if(_.isEmpty(userPackage)){
            if(count > 0){
                user.userPackage = '专业版';
            }else{
                user.userPackage = '未开通';
            }
        }else{
            const now = new Date();
            if (now > userPackage.endDate) {
                if(count > 0){
                    user.userPackage = '专业版';
                }
            }else{
                user.userPackage = '至尊版';
            }
        }
        // 转换用户帐户状态
        if(user.accountStatus === 'registered'){
            user.accountStatus = '已注册';
        }else if(user.accountStatus === 'active'){
            user.accountStatus = '已激活';
        }else{
            user.accountStatus = '已冻结';
        }
        var wallet = await Wallet.getAccountsByUserId(id);

        user.wallet = wallet[0];

        return res.status(200).send(user);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

// 修改注册用户
async function updateUser(req, res, next) {
    var params        = req.body;
    var id            = params.userId;
    var accountStatus = params.accountStatus;

    if(_.isEmpty(id)){
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "userId")
        });
    };
    if(_.isEmpty(accountStatus)){
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "accountStatus")
        });
    }
    try {
        var userInfo = {
            "id"             : id,
            "accountStatus"  : accountStatus
        };
        var results = await User.update(userInfo);

        return res.status(200).send(results);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// 分页获取用户下所有活动
async function getUserEventWithPageIndex(req, res, next) {
    var params   = req.query;
    if(_.isEmpty(params.userId)){
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "userId")
        });
    };
    // logger.debug("params: "+JSON.stringify(params));
    try {
        var attributeNames = ['id', 'title', 'isPublic', 'startTime', 'endTime','categories','status'];
        var eventInfos = await Event.getEventsByUserIdWithPageIndex(params,attributeNames);
        var eventStatusList = Event.getEventStatusList(req);
        for(var i=0; i<eventInfos.items.length; i++){
            var eventInfo = eventInfos.items[i];
            var attendeesNum = await order.getPaidAattendeesNum(eventInfo.id);
            // 活动状态
            var eventStatusInfo = _.find(eventStatusList, {name: eventInfo.status});
            eventInfo.statusStr = eventStatusInfo.str;
            eventInfo.attendeesNum = attendeesNum;
            _.merge(eventInfos.items[i], eventInfo);
        }
        var paginate = myutil.getPaginate(req.query.page, req.query.limit, eventInfos.count, eventInfos.items);

        return res.status(200).send(paginate);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

// 分页获取用户下所有会员
async function getUserGroupsWithPageIndex(req, res, next) {
    var params   = req.query;
    if(_.isEmpty(params.userId)){
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "userId")
        });
    };
    try {
        var attributeNames = ['id', 'name', 'subDomain', 'status', 'duesType','duesCurrency'];
        var groupInfos = await Member.getGroupsByUserIdWithPageIndex(params,attributeNames);
        // var eventStatusList = Event.getEventStatusList(req);
        for(var i=0; i<groupInfos.items.length; i++){
            var groupInfo = groupInfos.items[i];
            var memberTotal = await Member.getMemberCountWithGroup(groupInfo.id);
            // 群组状态
            // var eventStatusInfo = _.find(eventStatusList, {name: eventInfo.status});
            // eventInfo.statusStr = eventStatusInfo.str;
            groupInfo.memberTotal = memberTotal;
            _.merge(groupInfos.items[i], groupInfo);
        }
        var paginate = myutil.getPaginate(req.query.page, req.query.limit, groupInfos.count, groupInfos.items);
        return res.status(200).send(paginate);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

// 分页获取用户下所有定单
async function getUserOrderWithPageIndex(req, res, next) {
    var params   = req.query;
    if(_.isEmpty(params.userId)){
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("Empty", "userId")
        });
    };
    try {
        var data = await order.getOrderByUserIdAndPageIndex(params);
        var orderDatas =[]
        var orderStatusList = order.getOrderStatusList(req);
        _.each(data.items,function (orderInfo) {
            var orderData = {};
            orderData.orderId = orderInfo.left.id;
            orderData.orderNumber = orderInfo.left.orderNumber;
            var orderStatus = _.find(orderStatusList, {name: orderInfo.left.status});
            orderData.status = orderStatus.str;
            orderData.totalPrice = orderInfo.left.paymentPriceUnitSign + orderInfo.left.totalPrice.toString();
            var ticketTotal = 0;
            _.each(orderInfo.left.orderDetails, function (orderDetail) {
                ticketTotal += orderDetail.ticketCount;
            });
            orderData.ticketTotal = ticketTotal;
            orderData.cTime = orderInfo.left.cTime;
            orderData.eventId = orderInfo.right.id;
            orderData.title = orderInfo.right.title;
            orderData.startTime = orderInfo.right.startTime;
            orderData.endTime = orderInfo.right.endTime;

            orderDatas.push(orderData);
        });

        var paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, orderDatas);
        return res.status(200).send(paginate);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}
