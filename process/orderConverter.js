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
function orderConverter(oldOrder) {
    var newOrder = {};
    newOrder.id = oldOrder.orderId.toString();
    newOrder.orderNumber = oldOrder.orderNumber;
    newOrder.buyer = {
        name  : oldOrder.pdataUserName,
        email : oldOrder.pdataUserMail,
        mobile: oldOrder.cellphone
    };
    newOrder.totalPrice = oldOrder.totalPrice;
    newOrder.originalPriceTotal = oldOrder.rawTotalPrice;
    newOrder.serviceFee = oldOrder.totalFee;
    newOrder.thirdPartyCharge = oldOrder.chargeFee;
    newOrder.taxes = 0;              // 原数据无税点设置
    newOrder.totalDeliverFee = 0;    // 原数据无发票费设置
    newOrder.currencyType = (oldOrder.currencySign === '¥') ? fp.CURRENCY_NAME.YUAN : fp.CURRENCY_NAME.DOLLAR;
    newOrder.paymentPriceUnitSign = oldOrder.currencySign;
    newOrder.status = __getOrderStatus(oldOrder.payStatus);
    newOrder.paymentMethod = __getOrderPaymentMethod(oldOrder.payWay);
    newOrder.purchasePlatform = __getOrderPurchasePlatform(oldOrder.buyerSource);
    newOrder.audited = true;
    newOrder.uTime = _.isNull(oldOrder.modifyTime)? null : moment(oldOrder.modifyTime).add(8,'h').toDate();
    newOrder.cTime = _.isNull(oldOrder.orderTime)? null : moment(oldOrder.orderTime).add(8,'h').toDate();
    newOrder.eventId = oldOrder.eventId.toString();
    newOrder.eventUserId = oldOrder.eventUserId;
    newOrder.userId = (_.isNull(oldOrder.loginId)) ? '' : oldOrder.loginId.toString();
    newOrder.orderNote = _.isEmpty(oldOrder.profileData) ? '' :JSON.stringify(oldOrder.profileData);

    return newOrder;
};

// 转换定单详情
var __convertOrderDetails = Promise.coroutine(function* (connection, orderId, discountId,discountCode) {
    var detailQuery = 'SELECT * from TicketOrderDetail where orderId=' + orderId;
    var orderDetails = yield connection.query(detailQuery);
    var orderDetailsInfo = {};
    var newOrderDetails = [];
    var ticketInfos = [];
    for(var i=0; i<orderDetails.length; i++){
        var ticketQuery = 'SELECT * from Ticket where ticketId=' + orderDetails[i].ticketId;
        var tickets = yield connection.query(ticketQuery);
        var newOrderDetail = {};
        if(!_.isEmpty(tickets)){
            newOrderDetail.ticketId     = tickets[0].ticketId.toString();
            newOrderDetail.ticketName   = tickets[0].ticketName;
            newOrderDetail.ticketCount  = orderDetails[i].quantity;
        }else{           // 关联票给物理删除
            console.log('定单号rderId: '+orderId +' 的票ticketId: '+orderDetails[i].ticketId+' 被物理删除');
            newOrderDetail.ticketId     = orderDetails[i].ticketId.toString();
            newOrderDetail.ticketName   = '';
            newOrderDetail.ticketCount  = 0;
        }
        newOrderDetail.discountId   = _.isEmpty(orderDetails[i].discountId) ? '' : discountId;
        newOrderDetail.discountCode = _.isEmpty(orderDetails[i].discountId) ? '' : discountCode;

        newOrderDetails.push(newOrderDetail);

        // 获取票信息以备组装参会者
        var ticketInfo = _.extend({},newOrderDetail);

        // 门票实际价格中包含服务费
        if(orderDetails[i].totalPrice === 0 || orderDetails[i].quantity === 0){
            // 为退票或其它 票数量置为 0
            ticketInfo.actualTicketPrice = 0;
        }else{
            ticketInfo.actualTicketPrice = orderDetails[i].totalPrice / orderDetails[i].quantity;
        }
        ticketInfo.currentTicketInfo = _.isEmpty(tickets[0]) ? {} : yield __convertCurrentTicketInfo(connection, tickets[0]);
        ticketInfos.push(ticketInfo);
    }
    // console.log("--newOrderDetails--: "+JSON.stringify(newOrderDetails));

    orderDetailsInfo.orderDetails = newOrderDetails;
    orderDetailsInfo.ticketInfos = ticketInfos;

    return orderDetailsInfo;
});

// 转换 票快照
var __convertCurrentTicketInfo = Promise.coroutine(function* (connection, oldTicket) {

    var newTicket = {};
    newTicket.ticketId = oldTicket.ticketId.toString();
    newTicket.name = oldTicket.ticketName;
    newTicket.describe = oldTicket.ticketDescription;
    newTicket.needAudit = (oldTicket.needAudit === 1);
    //1: 票价不包含服务费:price+fee 2: 票价包含服务费:price+fee
    newTicket.defaultPrice = oldTicket.price + oldTicket.fee;
    newTicket.startSalesTime = _.isNull(oldTicket.startSalesTime)? null : moment(oldTicket.startSalesTime).add(8,'h').toDate();
    newTicket.endSalesTime = _.isNull(oldTicket.endSalesTime)? null : moment(oldTicket.endSalesTime).add(8,'h').toDate();
    newTicket.totalCount = oldTicket.ticketCount;
    // 0:未开始售票,1:售票中,2:暂停售票,3:己售完,4:售票结束,5:活动结束
    newTicket.status = (oldTicket.ticketStatus >= 2) ? 'deleted' : 'normal';
    newTicket.minCount = oldTicket.minCountPerOrder;
    newTicket.maxCount = oldTicket.maxCountPerOrder;
    newTicket.isServiceFeeInclude = true;
    newTicket.ticketServiceFee = oldTicket.fee;

    // 会员票设置
    var newTicket = yield __conversionMemberTicket(connection, oldTicket.ticketId, newTicket);

    newTicket.isAllowGroupPurchase = false;     // 是否允许团购
    newTicket.isRefundable         = false;     // 该门票是否能退票,默认不能,值为false

    // console.log("newTicket: " + JSON.stringify(newTicket))
    return newTicket;
});

// 转换 是否为会员票
var __conversionMemberTicket = Promise.coroutine(function* (connection, ticketId, newTicket) {
    var isMemberOnlyTicket = false;
    var applyToMemberships = [];

    // 根据票Id 获取票与会员组关系数据
    var groupTicketQuery = 'SELECT * from GroupEventMemberTicket where ticketId=' + ticketId;
    var groupTickets = yield connection.query(groupTicketQuery);

    if(!_.isEmpty(groupTickets)){
        isMemberOnlyTicket = true;
        var matchGroupIds = [];
        _.each(groupTickets, function (groupTicket) {
            matchGroupIds.push(groupTicket.matchGroupId);
        });
        // 获取会员组Ids
        var eventGroupQuery = 'SELECT * from EventMatchGroup where matchGroupId in (' + matchGroupIds.join() +')';
        var eventGroups = yield connection.query(eventGroupQuery);
        _.each(eventGroups, function (eventGroup) {
            applyToMemberships.push(eventGroup.eventGroupId.toString());
        });
    }
    newTicket.isMemberOnlyTicket = isMemberOnlyTicket;
    newTicket.applyToMemberships = applyToMemberships;

    return newTicket;
});

// 转换 参会者信息
var __convertAttendees = Promise.coroutine(function* (connection, orderId, orderNumber, eventId, ticketInfos) {
    var attendeeQuery = 'SELECT * from Attendee where orderId=' + orderId;
    var attendees = yield connection.query(attendeeQuery);
    var newAttendees = [];
    for(var i=0; i<attendees.length; i++){
        var attendeeTicketInfos = [];
        if(_.isNull(attendees[i].ticketId)){     // ticketId 为空表示参会者模式 不为空表示购票者模式
            var attendeeTicketQuery = 'SELECT * from AttendeeTicket where userProfileId=' + attendees[i].userProfileId;
            var attendeeTickets = yield connection.query(attendeeTicketQuery);
            attendeeTicketInfos = __jointAttendeeTickets(attendeeTickets, ticketInfos);
        }else{
            attendeeTicketInfos = __jointAttendeeTickets([attendees[i]], ticketInfos);
        }
        _.each(attendeeTicketInfos,function (attendeeTicketInfo) {
            var attendee = __jointAttendeeByOldData(eventId,orderNumber,attendees[i], attendeeTicketInfo);

            newAttendees.push(attendee);
        });
    };
    // console.log("--newAttendees--: "+JSON.stringify(newAttendees));
    return newAttendees;
});

// 转换优惠码信息
var __convertDiscount = Promise.coroutine(function* (connection, discountId) {
    var discount = {};
    if(!_.isNull(discountId)){
        var discountQuery = 'SELECT * from Discount where discountId=' + discountId;
        var discounts = yield connection.query(discountQuery);

        if( !_.isEmpty(discounts) ) {
            discount.discountId   = discounts[0].discountId.toString();
            discount.discountCode = discounts[0].discountCode;
        }
    }
    // console.log("--discount--: "+JSON.stringify(discount));
    return discount;
});

// 转换 发票信息
var __convertInvoice = Promise.coroutine(function* (connection, orderId) {
    var invoiceQuery = 'SELECT * from EventOrderInvoice where orderId=' + orderId;
    var orderInvoices = yield connection.query(invoiceQuery);

    var orderInvoice = {};
    var isNeedInvoice = false;           // 转换是否须要发票
    if(!_.isEmpty(orderInvoices)){
        isNeedInvoice = true;
        // 转换发票设置
        var invoiceSetting = {
            type: (orderInvoices[0].fapiaoType === 1)?fp.INVOICE_TYPE.INVOICE_TYPE_SPECIAL:fp.INVOICE_TYPE.INVOICE_TYPE_NORMAL,
            receiveType  : fp.RECEIVE_TYPE.RECEIVE_TYPE_PERSONAL,
            serviceItems : orderInvoices[0].services,
            taxPoint     : 0,
            deliverMethod: (orderInvoices[0].expressStatus === 1) ? 'express' : 'onsite',
            deliverFee   : 0,
            isSplitable  : false  //原数据发票无是否拆分发票设置
        };
        // console.log("--invoiceSetting--: "+JSON.stringify(invoiceSetting));
        orderInvoice.invoiceSetting = invoiceSetting;

        // 原数据 一个定单只开一张发票
        var invoice = {};
        invoice.invoiceId    = orderInvoices[0].orderInvoiceId.toString();
        invoice.title        = orderInvoices[0].head;
        invoice.invoiceAmount= orderInvoices[0].orderPrice;
        invoice.note         = orderInvoices[0].remark;
        invoice.attendeeId   = '';

        // 判断领取方式是否为快递
        if(orderInvoices[0].expressStatus === 1){
            invoice.receiver  = orderInvoices[0].addressee;
            invoice.contact   = orderInvoices[0].contactPhone;
            invoice.address   = orderInvoices[0].receiveAddress;
        }
        // console.log("--invoice.expressStatus--: "+JSON.stringify(invoice));

        // 判断发票类型是否为专用发票
        if(orderInvoices[0].fapiaoType === 1){
            invoice.taxRegistrationCertificateNumber = orderInvoices[0].taxNumber;      // 税务登记证号码
            invoice.companyRegisteredAddress         = orderInvoices[0].companyAddress; // 公司注册地址
            invoice.companyFinancialTelephone        = orderInvoices[0].companyPhone;   // 公司财务电话
            invoice.companyAccountName               = orderInvoices[0].companyBank;    // 公司开户行名称
            invoice.companyAccount                   = orderInvoices[0].bankAccount;    // 公司开户行银行账号
        }
        // console.log("--invoice.fapiaoType--: "+JSON.stringify(invoice));

        _.extend(invoice, __getOrderInvoiceInfo(orderInvoices[0].profileData));
        // console.log("--invoice.profileData--: "+JSON.stringify(invoice));

        orderInvoice.invoice = [invoice];
    }
    orderInvoice.isNeedInvoice = isNeedInvoice;
    // console.log("--orderInvoice--: "+JSON.stringify(orderInvoice));

    return orderInvoice;
});

function readAndConvert() {
    Promise.coroutine(function*() {
        try {
            console.log('trying to connnect rethinkdb...');
            // rConn = yield r.connect( {host: 'localhost', port: 28015, db:'eventdove'});
            rConn = yield r.connect(config.rdbConfig);
            // run this the second time will get error
            try {
                yield r.dbCreate("eventdove").run(rConn);
                yield r.db('eventdove').tableCreate('Order').run(rConn);
            } catch (err) {
                console.log('err:' + err);
            }

            console.log('trying to connnect mysql...');
            connection = yield mysql.createConnection(mysqlConfig);
            console.log('connected');

            var batchSize = 1000; // TODO: change to 1000
            var offset = -batchSize;
            for( ; ; ) {
                offset += batchSize; // where orderId = 9394 12467  263854 21771
                // if(offset >= 660000){
                //     break;
                // }
                var query = 'SELECT t.*, e.loginId as eventUserId FROM TicketOrder t LEFT JOIN Event e ' +
                    'ON t.eventId = e.eventId where e.modifyTimestamp <= "2017-07-12 04:50:27" and e.pubStatus in (3,5)' +
                    ' limit ' + batchSize + ' offset ' + offset;
                console.log('query: ', query);
                var rows = yield connection.query(query);
                console.log('get Order: ', rows.length +' - '+ new Date());

                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var oldOrder = rows[i];
                    // console.log("oldOrder.id: "+oldOrder.orderId);
                    var newOrder = orderConverter(oldOrder);

                    try {
                        // add 优惠码
                        newOrder.discount = yield __convertDiscount(connection, oldOrder.discountId);

                        // add 订单详情
                        var discountId   = _.isEmpty(newOrder.discount) ? '' : newOrder.discount.discountId;
                        var discountCode = _.isEmpty(newOrder.discount) ? '' : newOrder.discount.discountCode;
                        var orderrDetailsInfo = yield __convertOrderDetails(connection, oldOrder.orderId,discountId, discountCode);
                        newOrder.orderDetails = orderrDetailsInfo.orderDetails;

                        // add 参会者信息
                        var ticketInfos = orderrDetailsInfo.ticketInfos;
                        newOrder.attendees = yield __convertAttendees(connection, oldOrder.orderId, oldOrder.orderNumber, oldOrder.eventId,ticketInfos);

                        // add 订单发票
                        var orderInvoice = yield __convertInvoice(connection,oldOrder.orderId);
                        _.extend(newOrder,orderInvoice);
                        // console.log("newOrder: "+JSON.stringify(newOrder));

                        yield r.table('Order').insert(newOrder).run(rConn);
                    } catch (err) {
                        console.log('convert order fail:' + newOrder.id);
                        console.log('err:' + err);
                    }
                }
                break; //TODO: remove this after testing
            }

            var date = new Date();
            console.log('----done---'+date);
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
 * @returns
 * @private
 */
function __jointAttendeeByOldData(eventId,orderNumber,attendee, attendeeTicketInfo) {
    var newAttendee = {};
    newAttendee.attendeeId      = myutil.generateAttendeeId();
    newAttendee.isCheckedIn     = (attendeeTicketInfo.isCheckedIn === 1) ? true : false;
    newAttendee.isETicketSent   = true;     // 是否发送了电子票  true: 已发送  false: 未发送
    newAttendee.isNeedAudit     = (attendee.hasAudit === 0) ? false : true,    // 0.不需要审核、1.未审核 2.己审核 3 拒绝
    newAttendee.checkedInType   = 'admin';
    newAttendee.checkedInTime   = _.isNull(attendeeTicketInfo.checkedInTime) ? null : moment(attendeeTicketInfo.checkedInTime).add(8,'h').toDate();
    // newAttendee.attendeeStatus  = __getAttendeePayStatus(attendeeTicketInfo.payStatus);
    newAttendee.wxopenId        = '',      // 微信openid
    newAttendee.qrCodeTicket    = '',      // 电子票二维码
    newAttendee.attendeeStatus  = attendeeTicketInfo.attendeeStatus;
    newAttendee.payStatus       = attendeeTicketInfo.payStatus;
    newAttendee.actualTicketPrice = attendeeTicketInfo.actualTicketPrice;

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
    newAttendee.currentTicketInfo = _.isUndefined(attendeeTicketInfo.currentTicketInfo) ? {} : attendeeTicketInfo.currentTicketInfo;   // 当前门票的信息,即下单时门票的详情
    newAttendee.notes             = (attendee.attendeeNotes === '{}' ? '' : attendee.attendeeNotes);// 备注
    newAttendee.notesTimestamp    = _.isNull(attendee.noteTimestamp) ? null : moment(attendee.noteTimestamp).add(8,'h').toDate();

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
    var attendeeTicketInfos = _.map(attendeeTickets, function (attendeeTicket) {
        var ticketInfo = _.find(ticketInfos,{ticketId : attendeeTicket.ticketId.toString()});
        // 参会者 关联票Id与定单详情关联票Id不一致 取定单详情中结果(只限定单详情中只有一条记录的情况)
        if(_.isEmpty(ticketInfo) && ticketInfos.length === 1){
            ticketInfo = ticketInfos[0];
        }
        return {
            ticketId         : ticketInfo.ticketId,
            ticketName       : ticketInfo.ticketName,
            actualTicketPrice: ticketInfo.actualTicketPrice,
            isCheckedIn      : attendeeTicket.checkinStatus,
            checkedInTime    : _.isNull(attendeeTicket.checkinTimestamp) ? null : attendeeTicket.checkinTimestamp,
            attendeeStatus   : __getAttendeePayStatus(attendeeTicket.payStatus),
            payStatus        : attendeeTicket.payStatus === 1 ? fp.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID : fp.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_NONE,
            currentTicketInfo: ticketInfo.currentTicketInfo
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
    if (payStatus === 12 || payStatus === 2) {
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
