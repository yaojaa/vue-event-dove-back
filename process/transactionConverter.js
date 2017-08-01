var _ = require('underscore'),
    datautils = require("./datautils"),
    f2n = datautils.f2n,
    loc2hash = datautils.loc2hash,
    locale2Country = datautils.locale2Country;

var fs = require("fs");
var Promise = require('bluebird');
var mysql = require('promise-mysql');
var r = require('rethinkdb');

var config = require("./config");
var fp = require('../util/fixParams.js');
var myutil     = require('../util/util.js');
var mysqlConfig = config.mysqlConfig;
var moment     = require('moment');

/**
 * 转换定单主体属性值
 * @param oldOrder   原定单实体
 * @returns {{}}
 */
function transactionConverter(payOrder, loginId, objectId,type) {
    var transaction = {};
    transaction.id = payOrder.payOrderId.toString();
    transaction.timestamp = 0;            // 创建支付定单的时间搓微秒 原数据置0
    // 1 门票 2 群费 3 会员费 4 收费功能
    // transaction.type = fp.ORDER_TYPE.ORDER_TYPE_TICKET;
    transaction.type = type;
    transaction.refId = _.isNull(objectId) ? '' : objectId.toString();
    transaction.userId = _.isNull(loginId) ? '' : loginId.toString();
    //0：支付宝，1：银联 2：VISA 3:微信;
    transaction.paymentMethod = __getPaymentMethod(payOrder.payMethod,payOrder.priceSign);
    transaction.source = _.isEmpty(payOrder.payUserAccount) ? '' : payOrder.payUserAccount;         // 支付帐号
    transaction.destination = _.isEmpty(payOrder.receiveAccount) ? '' : payOrder.receiveAccount;    // 收款账号
    transaction.orderId = payOrder.orderNumber;
    transaction.paymentPlatformId = _.isEmpty(payOrder.returnOrderNumber) ? '' : payOrder.returnOrderNumber;
    transaction.amount = payOrder.paidPrice;             // 支付总金额
    transaction.eventdoveNetIncome = payOrder.feePrice;  // 服务费
    transaction.channelFee = payOrder.paidFee;           // 支付通道费
    // 主办方净收入
    transaction.netIncome = payOrder.paidPrice - payOrder.feePrice - payOrder.paidFee;
    transaction.currency = payOrder.priceSign === '$' ? fp.CURRENCY_NAME.DOLLAR : fp.CURRENCY_NAME.YUAN;
    transaction.rawNotification = '';
    transaction.orderDetail = {};

    transaction.audited = true;
    transaction.isHistory = true;
    transaction.ctime = _.isNull(payOrder.createTime) ? null : moment(payOrder.createTime).add(8,'h').toDate();

    return transaction;
};

// 转换 支付定单 支付通道
function __getPaymentMethod(payMethod,priceSign) {
    //0：支付宝，1：银联 2：VISA 3:微信;
    var paymentMethod = fp.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY;  // 备注 1、2 均走的支付宝通道
    if(payMethod === 3){
        paymentMethod = fp.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT;
    }
    if(priceSign === '$'){
        paymentMethod = fp.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL;
    }

    return paymentMethod;
}

function readAndConvert() {
    Promise.coroutine(function*() {
        try {
            console.log('trying to connnect rethinkdb...');
            rConn = yield r.connect( {host: 'localhost', port: 28015, db:'eventdove'});
            // run this the second time will get error
            try {
                // yield r.dbCreate("eventdove").run(rConn);
                yield r.db('eventdove').tableCreate('Transaction').run(rConn);
            } catch (err) {
                console.log('err:' + err);
            }

            console.log('trying to connnect mysql...');
            connection = yield mysql.createConnection(mysqlConfig);
            console.log('connected');

            var batchSize = 1000; // TODO: change to 1000
            var offset = -batchSize;
            for( ; ; ) {
                offset += batchSize;
                // 查询支付成功的所有门票、群组会费、短信充值 支付定单
                // payStatus = 1 门票、3 会费、4 群费、短信 备注: 标识只是理论上，实际数据库中各种都夹杂
                var query = 'SELECT * from PayOrder where payStatus = 1 and payFrom in (1, 3, 4) limit ' + batchSize + ' offset ' + offset;
                console.log('query: ', query);
                var rows = yield connection.query(query);
                console.log('get PayOrder: ', rows.length +' - '+ new Date());
                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var oldPayOrder = rows[i];
                    var ticketOrderQuery = 'SELECT loginId as loginId, eventId as eventId from TicketOrder where payOrderId = '+ oldPayOrder.payOrderId;
                    var ticketOrders = yield connection.query(ticketOrderQuery);

                    var transaction;
                    if(!_.isEmpty(ticketOrders)){
                        // 获取门票定单 关联的活动 及主办方
                        transaction = transactionConverter(oldPayOrder,ticketOrders[0].loginId, ticketOrders[0].eventId,fp.ORDER_TYPE.ORDER_TYPE_TICKET);

                    }else{
                        // 获取群组会费定单 关联的群组活动 及主办方
                        var memberFeeOrderQuery = 'SELECT eventGroupId as eventGroupId from MemberFeeOrder where payOrderId = '+ oldPayOrder.payOrderId;
                        var memberFeeOrders = yield connection.query(memberFeeOrderQuery);

                        if(!_.isEmpty(memberFeeOrders)){
                            var eventGroupQuery = 'SELECT loginId as loginId from EventGroup where eventGroupId = '+ memberFeeOrders[0].eventGroupId;
                            var eventGroups = yield connection.query(eventGroupQuery);
                            transaction = transactionConverter(oldPayOrder,eventGroups[0].loginId, memberFeeOrders[0].eventGroupId,fp.ORDER_TYPE.ORDER_TYPE_MEMBER);

                        }else{
                            // 获取短信充值定单
                            if(oldPayOrder.subject === 'Recharge SMS' || oldPayOrder.subject === '【短信充值】'){
                                transaction = transactionConverter(oldPayOrder,'', '',fp.ORDER_TYPE.ORDER_TYPE_SMS);
                            }
                            // else{
                            //     console.log("payOrderId: "+oldPayOrder.payOrderId+" -- "+oldPayOrder.subject+" -- "+oldPayOrder.payFrom);
                            // }
                        }
                    }
                    if(!_.isEmpty(transaction)){
                        // console.log("transaction: "+JSON.stringify(transaction));
                        try {
                            yield r.table('Transaction').insert(transaction).run(rConn);

                        }catch (err) {
                            console.log('convert transaction fail:' + transaction.id);
                            console.log('err:' + err);
                        }
                    }

                }
                // break; //TODO: remove this after testing
            }

            console.log('done'+' - '+ new Date());
            rConn.close();
            connection.end();
        } catch (err) {
            console.log('error:' + err);
            if (connection)
                connection.end();
            if( rConn)
                rConn.close();
        }
    })();
}

var connection = null;
var rConn = null;
readAndConvert();


/**
 * 转换定单状态
 * @param oops         原定单状态值
 * @returns {string}
 * @private
 */
function __getOrderStatus(oops) {
    // 0:未支付 1:已支付 2:超时未支付 3:支付金额不一致 4:正在付款 5:订单取消,
    // 6:未支付(线下) 10:挂起 11:支付拒绝 12:已经退款 15:收费待审核 16:收费审核通过，待收款
    // 17:审核拒绝不允许付费 18:未支付（线下）订单部分参会者已确认dia

    var orderStatus = fp.ORDER_STATUS.ORDER_STATUS_PAID_NONE;   //未支付
    if(oops === 1){          //已支付
        orderStatus = fp.ORDER_STATUS.ORDER_STATUS_PAID;
    }else if(oops === 2){    //超时未支付
        orderStatus = fp.ORDER_STATUS.ORDER_STATUS_PAID_TIMEOUT;
    }else if(oops === 5){    //订单取消
        orderStatus = fp.ORDER_STATUS.ORDER_STATUS_ORDER_CANCEL;
    }else if(oops === 10){   //支付挂起
        orderStatus = fp.ORDER_STATUS.ORDER_STATUS_PAID_HANG;
    }else if(oops === 12){   //已退款
        orderStatus = fp.ORDER_STATUS.ORDER_STATUS_ORDER_REFUND_REFUNDED;
    }else if(oops === 15){   //待审核
        orderStatus = fp.ORDER_STATUS.ORDER_STATUS_AUDIT_PENDING;
    }else if(oops === 16){   //已审核、待收款
        orderStatus = fp.ORDER_STATUS.ORDER_STATUS_AUDIT_AUDITED;
    }else if(oops === 17){   //审核拒绝
        orderStatus = fp.ORDER_STATUS.ORDER_STATUS_AUDIT_REJECT;
    }else if(oops === 18){   //部分支付
        orderStatus = fp.ORDER_STATUS.ORDER_STATUS_PAID_PART;
    }
    // else if(oops === 6 || oops === 4){                                       //未支付
    //     orderStatus = fp.ORDER_STATUS.ORDER_STATUS_PAID_NONE;
    // }

    return orderStatus;
}

/**
 * 转换定单支付方式
 * @param payWay      原定单支付方式
 * @returns {string}
 * @private
 */
function __getOrderPaymentMethod(payWay) {
    // 1:免费赠送 2:支付宝 3:银联付款 4:现场缴费 5:票到付款
    // 6:银行转帐 7:邮局付款 8:免费票 9:贝宝 10:线下支付 ,11:线下支付现场缴费,
    // 12:信用卡支付 13:微信支付

    var paymentMethod = fp.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY; //支付宝
    if(payWay === 1 || payWay === 8){            //免费
        paymentMethod = fp.PAYMENT_METHOD.PAYMENT_METHOD_FREE;
    }else if(payWay === 3 || payWay === 12){     //网银支付
        fp.PAYMENT_METHOD.PAYMENT_METHOD_EBANK;
    }else if(payWay === 4 || payWay === 5 || payWay === 11){     //现场缴费
        paymentMethod = fp.PAYMENT_METHOD.PAYMENT_METHOD_ONSITE;
    }else if(payWay === 6 || payWay === 7 || payWay === 10){     //银行转帐
        paymentMethod = fp.PAYMENT_METHOD.PAYMENT_METHOD_TRANSFER;
    }else if(payWay === 9){       //贝宝
        paymentMethod = fp.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL;
    }else if(payWay === 13){       //微信支付
        paymentMethod = fp.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT;
    }

    return paymentMethod;
}


/**
 * 转换订单购买平台
 * @param buyerSource    原定单订单购买平台
 * @returns {string}
 * @private
 */
function __getOrderPurchasePlatform(buyerSource) {
    // 0 普通 PC  1 Android 2 iOS 3 onsite 4 other 5 微信

    var platform = fp.ORDER_PLATFORM.ORDER_PLATFORM_WEB;     //web
    if(buyerSource === 1){        //Android
        platform = fp.ORDER_PLATFORM.ORDER_PLATFORM_ANDROID;
    }else if(buyerSource === 2){  //iOS
        platform = fp.ORDER_PLATFORM.ORDER_PLATFORM_IOS;
    }else if(buyerSource === 3){  //现场
        platform = fp.ORDER_PLATFORM.ORDER_PLATFORM_ONSITE;
    }else if(buyerSource === 5){  //微信
        platform = fp.ORDER_PLATFORM.ORDER_PLATFORM_WECHAT;
    }else if(buyerSource === 4){  //上传
        platform = fp.ORDER_PLATFORM.ORDER_PLATFORM_UPLOAD;
    }

    return platform;
}

/**
 * 根据原参会者数据 拼接参会者对象
 * @param eventId                    活动Id
 * @param orderNumber                定单号
 * @param attendee                   原参会者信息
 * @param attendeeTicketInfos        原参会者对应票及签到信息
 * @returns {Array}
 * @private
 */
function __jointAttendeeByOldData(eventId,orderNumber,attendee, attendeeTicketInfo) {
    //var newAttendees = [];
   // _.each(attendeeTicketInfos,function (attendeeTicketInfo) {
        var newAttendee = {};
        newAttendee.attendeeId      = myutil.generateAttendeeId();
        newAttendee.isCheckedIn     = (attendeeTicketInfo.checkinStatus === 1) ? true : false;
        newAttendee.isETicketSent   = true;     // 是否发送了电子票  true: 已发送  false: 未发送
        newAttendee.isNeedAudit     = (attendee.hasAudit === 0) ? false : true,    // 0.不需要审核、1.未审核 2.己审核 3 拒绝
        newAttendee.checkedInType   = 'admin';
        newAttendee.checkedInTime   = _.isEmpty(attendeeTicketInfo.checkinTimestamp) ? null : attendeeTicketInfo.checkinTimestamp;
        newAttendee.attendeeStatus  = __getAttendeePayStatus(attendeeTicketInfo.payStatus);
        newAttendee.collectInfo     = __getAttendeeProfileData(attendee);
        newAttendee.codeObj = {
            eventId    : eventId,
            attendeeId : newAttendee.attendeeId,
            orderNumber: orderNumber,
            ticketId   : attendeeTicketInfo.ticketId,
            ticketName : attendeeTicketInfo.ticketName
        };
        var codeContent = myutil.getCodeContent({aId: newAttendee.attendeeId, oNu: orderNumber});
        newAttendee.barcode           = codeContent;    // 条形码
        newAttendee.qrCodeContent     = codeContent;    // 签到二维码
        newAttendee.actualTicketPrice = attendeeTicketInfo.actualTicketPrice;   // 下单时门票的实际价格
        newAttendee.notes             = (attendee.attendeeNotes === '{}' ? '' : attendee.attendeeNotes);// 备注
        newAttendee.notesTimestamp    = attendee.noteTimestamp;

        //newAttendees.push(newAttendee);
    //});
    // console.log("==newAttendee==: "+JSON.stringify(newAttendee));
    return newAttendee;
}

/**
 * 拼接参会者模式下参会者信息
 * @param attendeeTickets      原参会者模式下 参会者签到及票信息
 * @param ticketInfos          原参会者所在定单对应所有票信息
 * @returns {Array}
 * @private
 */
function __jointAttendeeTickets(attendeeTickets, ticketInfos) {
    // console.log("attendeeTickets: "+attendeeTickets.length);
    //console.log("ticketInfos: "+JSON.stringify(ticketInfos));
    var attendeeTicketInfos = _.map(attendeeTickets, function (attendeeTicket) {
        // console.log("attendeeTickets: "+attendeeTicket.ticketId);
        var ticketInfo = _.find(ticketInfos,{ticketId:attendeeTicket.ticketId});
        return {
            ticketId         : ticketInfo.ticketId,
            ticketName       : ticketInfo.ticketName,
            actualTicketPrice: ticketInfo.actualTicketPrice,
            isCheckedIn      : attendeeTicket.isCheckedIn,
            checkedInTime    : _.isEmpty(attendeeTicket.checkinTimestamp) ? null : attendeeTicket.checkinTimestamp,
            attendeeStatus   : __getAttendeePayStatus(attendeeTicket.payStatus)
        }
    });
    // console.log("attendeeTicketInfos: "+JSON.stringify(attendeeTicketInfos));
    return attendeeTicketInfos;
}

/**
 * 转换参会者支付状态为 退款状态
 * @param payStatus      原参会者支付状态
 * @returns {string}
 * @private
 */
function __getAttendeePayStatus(payStatus) {
    // 0:(未支付)订单被拒绝或取消 1:已支付 2:退款 6:线下支付 10:等待确认(支付平台) 12:退款(支付平台)
    // -99:临时状态(不记录到表中(其在数据库的表示(hasAudit=1))表示“待审核”供【活动人员统计】使用)
    // 16:邀请等待确认  17:拒绝参加

    var attendeeStatus = fp.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL;    // 正常
    if (payStatus === 12) {
        attendeeStatus = fp.ATTENDEE_STATUS.ATTENDEE_STATUS_REFUNDED;
    }
    return attendeeStatus;
}

/**
 * 获取参会采集项
 * @param attendee  原数库参会者实体
 * @private
 */
function __getAttendeeProfileData(attendee) {
    var profileData = _.isEmpty(attendee.profileData) ? {} : JSON.parse(attendee.profileData);

    _.isEmpty(attendee.firstName) ? '' : profileData['firstName'] = attendee.firstName;
    _.isEmpty(attendee.lastName) ? '' : profileData['lastName'] = attendee.lastName;
    _.isEmpty(attendee.userName) ? '' : profileData['userName'] = attendee.userName;
    _.isEmpty(attendee.userNamePinyin) ? '' : profileData['userNamePinyin'] = attendee.userNamePinyin;
    _.isEmpty(attendee.homePhone) ? '' : profileData['homePhone'] = attendee.homePhone;
    _.isEmpty(attendee.cellPhone) ? '' : profileData['cellPhone'] = attendee.cellPhone;
    _.isEmpty(attendee.emailAddress) ? '' : profileData['emailAddress'] = attendee.emailAddress;
    _.isEmpty(attendee.tempPassword) ? '' : profileData['tempPassword'] = attendee.tempPassword;
    _.isEmpty(attendee.homeAddress) ? '' : profileData['homeAddress'] = attendee.homeAddress;
    _.isEmpty(attendee.shippingAddress) ? '' : profileData['shippingAddress'] = attendee.shippingAddress;
    _.isEmpty(attendee.jobTitle) ? '' : profileData['jobTitle'] = attendee.jobTitle;
    _.isEmpty(attendee.companyOrorganization) ? '' : profileData['companyOrorganization'] = attendee.companyOrorganization;
    _.isEmpty(attendee.workAddress) ? '' : profileData['workAddress'] = attendee.workAddress;
    _.isEmpty(attendee.workPhone) ? '' : profileData['workPhone'] = attendee.workPhone;
    _.isEmpty(attendee.website) ? '' : profileData['website'] = attendee.website;
    _.isEmpty(attendee.blog) ? '' : profileData['blog'] = attendee.blog;
    _.isEmpty(attendee.gender) ? '' : profileData['gender'] = attendee.gender;
    _.isEmpty(attendee.birthDate) ? '' : profileData['birthDate'] = attendee.birthDate;
    _.isEmpty(attendee.age) ? '' : profileData['age'] = attendee.age;
    _.isEmpty(attendee.fax) ? '' : profileData['fax'] = attendee.fax;
    _.isEmpty(attendee.zipCode) ? '' : profileData['zipCode'] = attendee.zipCode;
    _.isEmpty(attendee.department) ? '' : profileData['department'] = attendee.department;
    _.isEmpty(attendee.address) ? '' : profileData['address'] = attendee.address;
    _.isEmpty(attendee.post) ? '' : profileData['post'] = attendee.post;

    //console.log("profileData: "+JSON.stringify(profileData));

    return profileData;
}

/**
 * 转换定单发票发送及状态信息
 * @param profileData        原定单发票主办方回填信息
 * @param invoice            新组装发票信息
 * @returns {*}
 * @private
 */
function __getOrderInvoiceInfo(profileData) {
    var invoiceInfo = {};
    if(!_.isEmpty(profileData) && profileData !== '{}'){
        var profileDatas = JSON.parse(profileData);
        var deliverInformation = {};
        for (var paramKey in profileDatas) {
            if (profileDatas.hasOwnProperty(paramKey)) {
                if(paramKey.indexOf('发票号') >= 0){
                    invoiceInfo.invoiceNumber = profileDatas[paramKey];
                    // console.log("invoiceNumber: "+invoiceInfo.invoiceNumber);
                }
                if(paramKey.indexOf('是否发送') >= 0 || paramKey.indexOf('是否已经开具发票') >= 0){
                    invoiceInfo.invoiceStatus = _.isEmpty(profileDatas[paramKey]) ? 'uninvoiced' : 'invoiced';
                    // console.log("invoiceStatus: "+invoiceInfo.invoiceStatus);
                }else{
                    invoiceInfo.invoiceStatus = 'uninvoiced';
                }
                if(paramKey.indexOf('快递单号') >= 0){
                    deliverInformation.deliverNumber = profileDatas[paramKey];
                    // console.log("deliverNumber: "+deliverInformation.deliverNumber);
                }
                if(paramKey.indexOf('哪家快递') >= 0){
                    deliverInformation.deliverName = profileDatas[paramKey];
                    // console.log("deliverName: "+deliverInformation.deliverName);
                }
            }
        }
        invoiceInfo.deliverInformation = deliverInformation;
    }
    return invoiceInfo;
}
