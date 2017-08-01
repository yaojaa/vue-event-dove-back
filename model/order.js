'use strict';

const _              = require('lodash');
const myutil         = require('../util/util.js');
const thinky         = require('../util/thinky.js');
const fixParams      = require('../util/fixParams');
const validator      = require('validator');
const type           = thinky.type;
const r              = thinky.r;
const nextId         = myutil.nextId;
const Promise        = require('bluebird');
const settings       = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const moment         = require('moment');
const Event          = require('./event.js');
const User           = require('./user.js');
const path           = require('path');
const ts             = require("../services/templateService");
const Notice         = require('../controllers/noticeController.js');
const Queue          = require('../util/queue');
const exchangeName   = 'order.delay.exchange';
const queueName      = 'order.delay.queue';
const RabbitMQConfig = settings.RabbitMQConfig;
const AddressBook    = require('./addressBook.js');
const Big            = require('big.js');
const sysNotice      = require('./admin/sysNotice');

exports.exchangeName = exchangeName;
exports.queueName    = queueName;

var OrderFields = {
    id                : type.string(),
    orderNumber       : type.string().required(),// 订单号
    buyer             : {},// 购买人信息
    totalPrice        : type.number().required(),// 支付总额
    originalPriceTotal: type.number().required(),// 原价总额
    serviceFee        : type.number().required(),// 服务费总额
    thirdPartyCharge  : type.number().default(0),// 支付渠道费用总额
    taxes             : type.number().default(0),// 税点,开具发票时根据用户需要开发票的金额和税点计算出的金额
    totalDeliverFee   : type.number().default(0),// 发票费,开具发票需要的快递费总额

    // 货币类型
    currencyType        : type.string().enum(
        fixParams.CURRENCY_NAME.DOLLAR,
        fixParams.CURRENCY_NAME.YUAN
    ).required(),
    paymentPriceUnitSign: type.string()
                              .enum(
                                  fixParams.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_YUAN,
                                  fixParams.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_DOLLAR
                              ).default(fixParams.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_YUAN).required(),// 收款币种

    // 订单状态
    status: type.string().enum(
        fixParams.ORDER_STATUS.ORDER_STATUS_AUDIT_PENDING,
        fixParams.ORDER_STATUS.ORDER_STATUS_AUDIT_AUDITED,
        fixParams.ORDER_STATUS.ORDER_STATUS_AUDIT_REJECT,
        fixParams.ORDER_STATUS.ORDER_STATUS_PAID_NONE,
        fixParams.ORDER_STATUS.ORDER_STATUS_PAID_TIMEOUT,
        fixParams.ORDER_STATUS.ORDER_STATUS_PAID_HANG,
        fixParams.ORDER_STATUS.ORDER_STATUS_PAID_PART,
        fixParams.ORDER_STATUS.ORDER_STATUS_PAID,
        fixParams.ORDER_STATUS.ORDER_STATUS_ORDER_CANCEL,
        fixParams.ORDER_STATUS.ORDER_STATUS_ORDER_REFUND_PART,
        fixParams.ORDER_STATUS.ORDER_STATUS_ORDER_REFUND_REFUNDED
    ).default(fixParams.ORDER_STATUS.ORDER_STATUS_PAID_NONE).required(),

    // 支付方式
    paymentMethod: type.string().enum(
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_NONE,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_FREE,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ONSITE,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_TRANSFER
    ).default(fixParams.PAYMENT_METHOD.PAYMENT_METHOD_NONE).required(),

    // 购票平台
    purchasePlatform: type.string().enum(
        fixParams.ORDER_PLATFORM.ORDER_PLATFORM_WEB,
        fixParams.ORDER_PLATFORM.ORDER_PLATFORM_ANDROID,
        fixParams.ORDER_PLATFORM.ORDER_PLATFORM_IOS,
        fixParams.ORDER_PLATFORM.ORDER_PLATFORM_WECHAT,
        fixParams.ORDER_PLATFORM.ORDER_PLATFORM_ONSITE,
        fixParams.ORDER_PLATFORM.ORDER_PLATFORM_UPLOAD,
        fixParams.ORDER_PLATFORM.ORDER_PLATFORM_ADMIN
    ).default(fixParams.ORDER_PLATFORM.ORDER_PLATFORM_WEB).required(),

    // 订单详情
    orderDetails: [{
        ticketId    : type.string().required(),// 票的主键id
        ticketName  : type.string().required(),// 票名称
        ticketCount : type.number().integer().required(),// 票总数
        discountId  : type.string(),// 优惠码主键id
        discountCode: type.string(),// 优惠码
    }],

    // 参会者信息
    attendees: [{
        attendeeId   : type.string(),// 参会者Id
        isCheckedIn  : type.boolean().default(false).required(),// 是否签到  true: 已签到  false: 未签到
        isETicketSent: type.boolean().default(false).required(),// 是否发送了电子票  true: 已发送  false: 未发送
        isNeedAudit  : type.boolean().default(false).required(),// 该参会者的门票是否需要审核  true: 需要审核  false: 不需要审核
        checkedInType: type.string().enum('admin', 'user'),// 签到的操作人,admin管理员签到,user用户自行签到
        checkedInTime: type.date(),// 签到时间
        barcode      : type.string().required(),// 条形码
        qrCodeContent: type.string().required(),// 签到二维码
        wxopenId     : type.string(), // 微信openid
        qrCodeTicket : type.string(),// 电子票二维码

        attendeeStatus: type.string().enum(
            fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL,
            fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_REFUNDING,
            fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_REFUNDED
        ).default(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL), // 参会者退款状态

        payStatus: type.string().enum(
            fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID,
            fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_NONE
        ).default(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_NONE), // 参会者的支付状态

        // 采集参会者信息(参会者模式: 采集每个参会者信息, 购票者模式: 采集购票人信息)
        collectInfo      : {},// 参会者采集信息 json
        currentTicketInfo: {},// 当前门票的信息,即下单时门票的详情
        codeObj          : {},// 条形码和二维码存储的对象信息
        actualTicketPrice: type.number(),// 下单时门票的实际价格
        tags             : [type.string()],// 参会者标签,
        notes            : type.string(),// 备注
        notesTimestamp   : type.date(),// 备注时间
    }],

    // 订单发票
    isNeedInvoice : type.boolean().default(false),// 用户是否需要开发票默认不需要
    invoiceSetting: {
        type         : type.string().enum(
            fixParams.INVOICE_TYPE.INVOICE_TYPE_NORMAL,
            fixParams.INVOICE_TYPE.INVOICE_TYPE_SPECIAL
        ), // 发票类型
        receiveType  : type.string().enum(
            fixParams.RECEIVE_TYPE.RECEIVE_TYPE_COMPANY,
            fixParams.RECEIVE_TYPE.RECEIVE_TYPE_PERSONAL
        ),// 收票人类型
        serviceItems : type.string(),// 服务项目
        taxPoint     : type.number(),// 税点设置,不需要税点请填写0,如需要收取税点设置为对应的值
        deliverMethod: type.string().enum(
            fixParams.INVOICE_DELIVER_METHOD.INVOICE_DELIVER_METHOD_ONSITE,
            fixParams.INVOICE_DELIVER_METHOD.INVOICE_DELIVER_METHOD_EXPRESS
        ),// 发票领取方式,onsite现场领取,express快递领取
        deliverFee   : type.number(),// 快递费,包邮请设置为0
        isSplitable  : type.boolean().default(false),// 是否能拆分发票,拆分开票是指将订单支付总金额根据每个参会者对应购买价分开开票
    },
    invoice       : [{
        invoiceId                       : type.string(),// 发票主键id
        title                           : type.string(),// 发票抬头
        invoiceAmount                   : type.number(),// 发票金额
        receiver                        : type.string(),// 收件人姓名
        contact                         : type.string(),// 联系方式
        address                         : type.string(),// 收件人地址
        taxRegistrationCertificateNumber: type.string(),// 税务登记证号码
        companyRegisteredAddress        : type.string(),// 公司注册地址
        companyFinancialTelephone       : type.string(),// 公司财务电话
        companyAccountName              : type.string(),// 公司开户行名称
        companyAccount                  : type.string(),// 公司开户行银行账号
        note                            : type.string(),// 备注
        invoiceStatus                   : type.string()
                                              .enum(
                                                  fixParams.INVOICE_STATUS.INVOICE_STATUS_INVOICED,
                                                  fixParams.INVOICE_STATUS.INVOICE_STATUS_UNINVOICED
                                              )
                                              .default(
                                                  fixParams.INVOICE_STATUS.INVOICE_STATUS_UNINVOICED
                                              ),// 发票状态invoiced已开票,uninvoiced未开票
        attendeeId                      : type.string(),// 本张发票对应的参会者
        invoiceNumber                   : type.string(),// 发票编号
        deliverInformation              : {
            deliverName  : type.string(),// 快递名称
            deliverNumber: type.string()// 快递单号
        },// 快递信息
    }],// 发票信息

    discount: {
        discountId  : type.string(),// 优惠码主键id
        discountCode: type.string(),// 优惠码
    },// 折扣信息

    audited       : type.boolean().default(false),// 该条记录是否已经审计过,并将表单收集项的联系人提取到了联系人表中
    uTime         : type.date().default(function () {return new Date();}),// 修改时间
    cTime         : type.date().default(function () {return new Date();}),// 创建时间
    eventId       : type.string().required(),// 活动Id
    eventUserId   : type.string(),// 此订单关联的活动所属的用户id
    userId        : type.string(),// 创建此订单的用户Id
    popularizeCode: type.string(),// 创建此订单时用到的推广码
    orderNote     : type.string(),// 订单备注

    wxopenId: type.string(),// 微信openid
    qrCode  : type.string(),// 订单二维码  扫码推送订单信息至微信
};

// 订单
var Order = thinky.createModel("Order", OrderFields);

const Order_INDICES = ['createTime', 'updateTime', 'userId', 'eventId', 'orderNumber', 'eventUserId'];
_.each(Order_INDICES, function (index) {
    Order.ensureIndex(index);
});
exports.OrderModel  = Order;
exports.OrderFields = OrderFields;

// 订单
exports.addOrder = function (data) {
    var order = new Order(data);
    order.id  = nextId();
    return order.save();
};

exports.updateOrderById = function (id, udpate, options) {
    udpate.uTime = new Date();
    return Order.get(id).update(udpate).run();
};

// 线下订单确认收款
exports.confirmOfflineOrder = async function (id) {
    const toBeUpdateData = {
        status   : fixParams.ORDER_STATUS.ORDER_STATUS_PAID,
        attendees: r.row("attendees").map(
            function (doc) { return doc.merge({payStatus: fixParams.ORDER_STATUS.ORDER_STATUS_PAID}) }
        )
    };
    return await exports.updateOrderById(id, toBeUpdateData);
};

// 确认某个参会者的支付状态
exports.confirmAttendee = async function (id, attendeeId) {
    const toBeUpdateData = {
        attendees: r.row("attendees").map(
            function (doc) {
                return r.branch(
                    doc('attendeeId').eq(attendeeId),
                    doc.merge({payStatus: fixParams.ORDER_STATUS.ORDER_STATUS_PAID}),
                    doc
                );
            }
        )
    };

    let result = await exports.updateOrderById(id, toBeUpdateData);

    // 查询所有参会者
    const totalAttendee = await r.table('Order').get(id)("attendees").count();

    // 已经支付的参会者
    const paidAttendee = await r.table('Order').get(id)("attendees")
                                .filter(function (doc) {return doc("payStatus").eq(fixParams.ORDER_STATUS.ORDER_STATUS_PAID)}).count();

    if (totalAttendee === paidAttendee) {
        result = await exports.updateOrderById(id, {status: fixParams.ORDER_STATUS.ORDER_STATUS_PAID});
    } else {
        result = await exports.updateOrderById(id, {status: fixParams.ORDER_STATUS.ORDER_STATUS_PAID_PART});
    }

    return result;
};

exports.deleteOrder = function (id) {

    return Order.get(id).delete().execute();
};

/**
 * 根据订单编号获取订单中数组类型的属性
 * @param orderNum           订单号
 * @param attributeNames     需要返回的属性名数组
 * @param options
 */
exports.getOrderByOrderNum = async function (orderNum, attributeNames, options) {
    attributeNames   = _.isEmpty(attributeNames) ? _.keys(OrderFields) : attributeNames;
    var orderInfoArr = await r.table("Order").getAll(orderNum, {index: "orderNumber"}).pluck(attributeNames).run();
    return orderInfoArr[0];
};

exports.tryGetOrderByOrderNum = async function (orderNum, attributeNames, options) {
    let orderInfo = {};
    try {
        orderInfo = await exports.getOrderByOrderNum(orderNum, attributeNames, options);
    } catch (err) {
        logger.error('tryGetOrderByOrderNum ', err);
    }
    return orderInfo;
};

/**
 * 根据订单Id 获取订单
 * @param id
 */
exports.getOrderById = function (id) {
    return Order.get(id).run();
};
/**
 * 根据 活动Id 获取所有订单
 * @param id
 */
exports.getOrderByEventId = function (eventId, attributeNames, options) {
    attributeNames = _.isEmpty(attributeNames) ? _.keys(OrderFields) : attributeNames;
    return r.table("Order").getAll(eventId, {index: 'eventId'}).pluck(attributeNames).run();
};

/**
 * 根据 活动Id 所有订单(分页)
 * @param params
 */
exports.getOrderByEventIdAndPageIndex = function (params) {
    var orderFilter = __buildOrderFilter(params);
    var totalCount  = parseInt(params.total) || -1;// 总记录数
    var page        = parseInt(params.page) || 1;// 第几页
    var limit       = parseInt(params.limit) || 10;// 每页显示记录数
    var skip        = ( page - 1 ) * limit;
    var orderBy     = params.orderBy || "id";

    var items = orderFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = orderFilter.count().execute();
    }

    return Promise.props({items: items, count: totalCount});
};

// 拼装搜索条件
function __buildOrderFilter(params) {

    var eventId       = params.eventId;
    var search        = params.search;
    var searchType    = params.searchType;
    var orderStatus   = params.orderStatus;
    var paymentMethod = params.paymentMethod;
    var orderFilter   = Order;

    orderFilter = orderFilter.filter({eventId: eventId});

    switch (searchType) {
        case 'orderNumber':// 订单号
            orderFilter = orderFilter.filter({orderNumber: search});
            break;
        case 'name':// 购票人
            orderFilter = orderFilter.filter(
                r.row("buyer").hasFields("name")
                 .and(r.row("buyer")("name").match("^" + search))
            );
            break;
        case 'email':// 邮箱
            orderFilter = orderFilter.filter(
                r.row("buyer").hasFields("email")
                 .and(r.row("buyer")("email").eq(search))
            );
            break;
        case 'mobile':// 手机号
            orderFilter = orderFilter.filter(
                r.row("buyer").hasFields("mobile")
                 .and(r.row("buyer")("mobile").eq(search))
            );
            break;
        case 'discountCode':// 优惠码
            orderFilter = orderFilter.filter(
                r.row("discount").hasFields("discountCode")
                 .and(r.row("discount")("discountCode").eq(search))
            );
            break;
        default:
    }

    if (orderStatus) {
        orderFilter = orderFilter.filter({status: orderStatus});
    }

    if (paymentMethod) {
        orderFilter = orderFilter.filter({paymentMethod: paymentMethod});
    }

    return orderFilter;
}

/**
 *
 * @param eventId
 * @param status   订单状态
 * @param options  扩展参数
 */
exports.getOrderByEventIdAndPaymentStatus = function (eventId, status, options) {
    options         = options || {};
    options.orderBy = options.orderBy || 'id';
    return Order.getAll(eventId, {index: 'eventId'})
                .filter({paymentStatus: status})
                .orderBy(options.orderBy).run();
};

exports.updateAttendees = function (orderId, attendees, options) {
    return Order.get(orderId).update({attendees: attendees}).run();
};

// 根据参会者id 修改参会者信息
exports.updateAttendeesByONu = function (orderNumber, updateData, options) {
    const upDataInfo = {attendees: r.row('attendees').changeAt(options.attendeeIndex, updateData)};
    return Order.getAll(orderNumber, {index: "orderNumber"}).update(upDataInfo).run();
};
//参会者获取电子票信息
exports.attendeesGetTicket   = async function (params) {
    const orderNumber = params.orderNumber;
    const attendeeId  = params.attendeeId;
    const wxopenId    = params.wxopenId;

    let orderInfos = await Order.getAll(orderNumber, {index: 'orderNumber'}).run();

    // 该订单下的所有参会者信息
    const attendeeList = orderInfos[0].attendees || [];
    const eventId      = orderInfos[0].eventId; //活动id
    const eventInfo    = await r.table('Event').get(eventId);  //活动详情
    // 根据参会者id查询参会者信息下标
    let attendeeIndex = _.findIndex(attendeeList, {attendeeId: attendeeId});
    let attendeeInfo  = attendeeList[attendeeIndex];
    if (attendeeIndex === -1) {
        //参会者不存在
        return ({datas: '二维码无效...', resultCode: '99'});
    } else {
        if (attendeeInfo.wxopenId && attendeeInfo.wxopenId !== "") {
            //判断是否第一次绑定的参会者
            if (attendeeInfo.wxopenId === wxopenId) {
                return ({datas: eventInfo, resultCode: '0'});
            } else {
                return ({datas: '该电子票已被绑定', resultCode: '99'});
            }
        } else {
            //第一次生成电子票  绑定openid
            let uResult = r.table('Order').get(orderInfos[0].id)
                           .update(
                               {
                                   attendees: r.row("attendees").map(
                                       function (dataInfo) {
                                           return r.branch(
                                               dataInfo("attendeeId").eq(attendeeId),
                                               dataInfo.merge({"wxopenId": wxopenId}),
                                               dataInfo
                                           );
                                       })
                               }).run();

            //attendeeIndex = _.findIndex(attendeeList, {attendeeId: attendeeId});
            //attendeeInfo = attendeeList[attendeeIndex];
            return ({resultCode: '0', datas: eventInfo});
        }


    }


};

// 获取参会者列表输入框的搜索类型
function __getAttendeesSearchType(search) {
    let searchType = '';

    if (_.isEmpty(search)) {
        return searchType;
    }

    const emailPattern = /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}/;// 邮箱
    if (emailPattern.test(search)) {
        return searchType = 'email';
    }

    const orderNumberPattern = /^DD\d{18}/;// 订单号
    if (orderNumberPattern.test(search)) {
        return searchType = 'orderNumber';
    }

    const namePattern = /([a-zA-Z]|[0-9]|[^\x00-\xff]){1,8}/i;// 购票人
    if (namePattern.test(search)) {
        searchType = 'name';
    }

    return searchType;
}

function __buildAttendeesFilter(params) {
    const eventId        = params.eventId;// 活动id
    const signStatus     = params.signStatus;// 参会者的签到状态
    const ticketId       = params.ticketId;// 门票
    const attendeeStatus = params.attendeeStatus;// 参会者的退票状态
    const search         = params.search;// 搜索内容
    const searchType     = __getAttendeesSearchType(search);
    let attendeesFilter  = r.table('Order');

    attendeesFilter = attendeesFilter.getAll(eventId, {index: 'eventId'});

    if (searchType === 'orderNumber') {
        attendeesFilter = attendeesFilter.filter({"orderNumber": search});
    }

    // payStatus 为 paid 的记录
    attendeesFilter = attendeesFilter.map(
        function (doc) {
            return doc.merge(
                {
                    attendees: doc('attendees').filter(function (aInfo) {return aInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)})
                }
            )
        }
    );

    if (signStatus === 'signIn') {
        attendeesFilter = attendeesFilter.map(
            function (doc) {
                return doc.merge(
                    {
                        attendees: doc('attendees').filter(function (aInfo) {return aInfo("isCheckedIn").eq(true)})
                    }
                )
            }
        );
    }

    if (signStatus === 'notSign') {
        attendeesFilter = attendeesFilter.map(
            function (doc) {
                return doc.merge(
                    {
                        attendees: doc('attendees').filter(function (aInfo) {return aInfo("isCheckedIn").eq(false)})
                    }
                )
            }
        );
    }

    if (ticketId) {
        attendeesFilter = attendeesFilter.map(
            function (doc) {
                return doc.merge(
                    {
                        attendees: doc('attendees').filter(function (aInfo) {return aInfo("codeObj")("ticketId").eq(ticketId)})
                    }
                )
            }
        );
    }

    if (attendeeStatus) {
        attendeesFilter = attendeesFilter.map(
            function (doc) {
                return doc.merge(
                    {
                        attendees: doc('attendees').filter(function (aInfo) {return aInfo("attendeeStatus").eq(attendeeStatus)})
                    }
                )
            }
        );
    }

    if (searchType === 'email') {
        attendeesFilter = attendeesFilter.map(
            function (doc) {
                return doc.merge(
                    {
                        attendees: doc('attendees').filter(function (aInfo) {return aInfo("collectInfo")("email").eq(search)})
                    }
                )
            }
        );
    }

    if (searchType === 'name') {
        attendeesFilter = attendeesFilter.map(
            function (doc) {
                return doc.merge(
                    {
                        attendees: doc('attendees').filter(function (aInfo) {return aInfo("collectInfo")("name").eq(search)})
                    }
                )
            }
        );
    }

    attendeesFilter = attendeesFilter.filter(function (doc) { return doc('attendees').ne([]) });
    attendeesFilter = attendeesFilter.map(
        function (doc) {
            return doc.merge(
                {
                    attendees: doc('attendees').map(
                        function (aInfo) {
                            return aInfo.merge(
                                {
                                    cTime           : doc('cTime'),
                                    orderNumber     : doc('orderNumber'),
                                    purchasePlatform: doc('purchasePlatform'),
                                }
                            );
                        }
                    )
                }
            )
        }
    );
    attendeesFilter = attendeesFilter.concatMap(function (orderInfo) {return orderInfo("attendees")});

    return attendeesFilter;
}

exports.getAttendeesByEventIdAndPageIndex = function (params) {
    const attendeesFilter = __buildAttendeesFilter(params);
    let totalCount        = parseInt(params.total) || -1;// 总记录数
    const page            = parseInt(params.page) || 1;// 第几页
    const limit           = parseInt(params.limit) || 10;// 每页显示记录数
    const skip            = ( page - 1 ) * limit;
    const orderBy         = params.orderBy || "cTime";

    const items = attendeesFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = attendeesFilter.count();
    }

    return Promise.props({items: items, count: totalCount});
};

exports.getAllAttendeesByEventId = function (params) {
    const attendeesFilter = __buildAttendeesFilter(params);
    let totalCount        = parseInt(params.total) || -1;// 总记录数
    const orderBy         = params.orderBy || "cTime";

    const items = attendeesFilter.orderBy(r.desc(orderBy)).run();

    if (totalCount === -1) {
        totalCount = attendeesFilter.count();
    }

    return Promise.props({items: items, count: totalCount});
};

exports.getInvoiceListByEventIdAndPageIndex = function (params) {
    var orderList  = params.orderList || [];
    var totalCount = parseInt(params.total) || -1;// 总记录数
    var page       = parseInt(params.page) || 1;// 第几页
    var limit      = parseInt(params.limit) || 10;// 每页显示记录数
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "orderNumber";

    _.map(_.sortBy(orderList, orderBy), _.values);
    _(orderList).reverse().value();
    var items = _.slice(orderList, skip, skip + limit);

    if (totalCount === -1) {
        totalCount = orderList.length;
    }

    return {items: items, count: totalCount};
};

exports.getOrderInfoAndEventInfoByOrderId = function (orderId) {
    return r.table("Order")
            .filter({id: orderId})
            .innerJoin(
                r.table("Event"),
                function (order, event) {
                    return order("eventId").eq(event("id"));
                })
            .map({

                // Order表字段
                orderId    : r.row("left")("id"),
                eventId    : r.row("left")("eventId"),
                orderNumber: r.row("left")("orderNumber"),
                totalPrice : r.row("left")("totalPrice"),
                cTime      : r.row("left")("cTime"),
                orderStatus: r.row("left")("status"),

                // Event表字段
                title               : r.row("right")("title"),
                paymentMethod       : r.row("right")("paymentMethod"),
                paymentAccountIds   : r.row("right")("paymentAccountIds").default([]),
                paymentPriceUnit    : r.row("right")("paymentPriceUnit"),
                paymentPriceUnitSign: r.row("right")("paymentPriceUnitSign"),

            });
};

// 门票订单的微信请求参数
exports.getWxTicketOrderReqParams = function (req, orderInfo, WxPayConfig) {
    var body        = req.body;
    var orderNumber = body.orderNumber;
    var productName = body.productName;
    var reqParams   = {
        body            : productName,
        out_trade_no    : orderNumber,
        total_fee       : orderInfo.totalPrice * 100,
        spbill_create_ip: myutil.getClientIp(req),
        notify_url      : WxPayConfig.WX_NOTIFY_URL,
        trade_type      : 'NATIVE',
        product_id      : orderInfo.eventId
    };
    return reqParams;
};

exports.getOrderInfo4TicketOrderPayResult = function (orderNumber) {
    return r.table("Order")
            .filter({orderNumber: orderNumber})
            .innerJoin(
                r.table("Event"),
                function (order, event) {
                    return order("eventId").eq(event("id"));
                })
            .map({

                // Order表字段
                orderId             : r.row("left")("id"),
                eventId             : r.row("left")("eventId"),
                orderNumber         : r.row("left")("orderNumber"),
                currencyType        : r.row("left")("currencyType"),
                paymentPriceUnitSign: r.row("left")("paymentPriceUnitSign"),
                paymentMethod       : r.row("left")("paymentMethod"),
                totalPrice          : r.row("left")("totalPrice"),
                cTime               : r.row("left")("cTime"),
                uTime               : r.row("left")("uTime"),
                buyer               : r.row("left")("buyer"),
                orderStatus         : r.row("left")("status"),
                attendees           : r.row("left")("attendees"),

                // Event表字段
                title           : r.row("right")("title"),
                startTime       : r.row("right")("startTime"),
                endTime         : r.row("right")("endTime"),
                logoUrl         : r.row("right")("logoUrl"),
                bannerUrl       : r.row("right")("bannerUrl"),
                userId          : r.row("right")("userId"),
                organizers      : r.row("right")("organizers"),
                tickets         : r.row("right")("tickets"),
                onlineAddress   : r.row("right")("onlineAddress"),
                detailedAddress : r.row("right")("detailedAddress"),
                contact         : r.row("right")("contact"),
                smsNotice       : r.row("right")("smsNotice").default(false),// 是否需要短信通知
                customSmsContent: r.row("right")("customSmsContent").default(''),// 短信通知模板

            });
};

// 根据对应语言返回对应的订单状态列表
exports.getOrderStatusList = function (req) {
    var ORDER_STATUS    = _.keys(OrderFields.status._enum);
    var orderStatusList = [];
    _.each(ORDER_STATUS, function (status) {
        var i18nKey = "order_status_" + status;
        orderStatusList.push({name: status, str: req.__(i18nKey)})
    });
    return orderStatusList;
};

/**
 * 根据对应语言返回对应的支付方式列表
 * @param req
 * @param isPull 是否移除none和free两种支付方式
 * @returns {Array}
 */
exports.getPaymentMethodList = function (req, isPull) {
    var paymentMethods = _.keys(OrderFields.paymentMethod._enum);
    var isPull         = _.isUndefined(isPull) ? true : isPull;
    if (isPull) {
        paymentMethods = _.pullAll(paymentMethods, ['none', 'free']);
    }
    var paymentMethodList = [];
    _.each(paymentMethods, function (paymentMethodInfo) {
        var i18nKey = "payment_method_" + paymentMethodInfo;
        paymentMethodList.push({name: paymentMethodInfo, str: req.__(i18nKey)})
    });
    return paymentMethodList;
};

// 根据订单的下单时间判断门票是否是早鸟票
exports.isEarlyBirdTicket = function (ticketDetail, orderCTime) {

    // 是否是早鸟票,如果是早鸟票,取早鸟票的价格
    var earlyBirdSetting = ticketDetail.earlyBirdTicketSetting || {};
    if (_.isEmpty(earlyBirdSetting)) {
        return false;
    }

    // 该门票是否在早鸟票截止时间之前
    var validateTime =
            moment(earlyBirdSetting.startTime) > orderCTime ||
            moment(earlyBirdSetting.endTime) < orderCTime;

    if (validateTime) {
        return false;
    }

    return true;
};

// 根据对应语言返回对应门票类型列表
exports.getTicketTypeList = function (req) {
    var ticketTypes    = ['normal', 'earlyBird'];
    var ticketTypeList = [];
    _.each(ticketTypes, function (ticketType) {
        var i18nKey = "ticket_type_" + ticketType;
        ticketTypeList.push({name: ticketType, str: req.__(i18nKey)})
    });
    return ticketTypeList;
};

// 获取发票的开票总金额
exports.getTotalAmountOfTicketPayment = function (orderInfo) {
    return orderInfo.totalPrice - orderInfo.taxes - orderInfo.totalDeliverFee;
};

// 获取后端添加参会人员的支付方式列表
exports.getAdminPaymentMethodList = function (req) {
    var paymentMethods    = ['onsite', 'free'];
    var paymentMethodList = [];
    _.each(paymentMethods, function (paymentMethodInfo) {
        var i18nKey = "admin_payment_method_" + paymentMethodInfo;
        paymentMethodList.push({name: paymentMethodInfo, str: req.__(i18nKey)})
    });
    return paymentMethodList;
};

// 退票状态列表
exports.getAttendeeStatusList = function (req) {
    var attendeeStatus     = _.keys(OrderFields.attendees[0].attendeeStatus._enum);
    var attendeeStatusList = [];
    _.each(attendeeStatus, function (status) {
        var i18nKey = "attendee_status_" + status;
        attendeeStatusList.push({name: status, str: req.__(i18nKey)})
    });
    return attendeeStatusList;
};

function __jointEmailRecord(req, functionType, receivers, title, content, eventId, userId) {
    const params = {
        receivers: receivers,// 收件人
        title    : _.isEmpty(title) ? '' : title,// 邮件标题
        from     : fixParams.RECORD_SEND_SET.DEFAULT_FROM,// 发件人邮箱
        fromName : req.__("eventdove_customer_service"),// 发件人名称
        replyTo  : fixParams.RECORD_SEND_SET.DEFAULT_FROM,// 回复邮件地址 与 from 一致
        category : fixParams.SEND_RECORD_TYPE.RECORD_TYPE_EMAIL,// 记录 类别: 邮件
        content  : content,// 邮件内容
        sendType : fixParams.SEND_TYPE.SEND_TYPE_IMMEDIATELY,// 立即使发送
        type     : functionType,// 邮件短信类型 属性 帐户激活
        eventId  : _.isEmpty(eventId) ? '' : eventId,// 活动Id
        userId   : _.isEmpty(userId) ? '' : userId,// 用户Id
    };
    return params;
}

function __jointSmsRecord(functionType, receivers, content, eventId, userId) {
    const params = {
        receivers: receivers,// 收件人/手机号
        category : fixParams.SEND_RECORD_TYPE.RECORD_TYPE_SMS,// 记录 类别
        content  : content,// 短信内容
        sendType : fixParams.SEND_TYPE.SEND_TYPE_IMMEDIATELY,// 立即使发送
        type     : functionType,// 邮件短信类型 属性 帐户激活
        eventId  : _.isEmpty(eventId) ? '' : eventId,// 活动Id
        userId   : _.isEmpty(userId) ? '' : userId,// 用户Id
    };

    return params;
}

/**
 * 获取替换电子票模板的变量值
 * @param eventInfo 活动详情
 * @param orderInfo 订单详情
 * @param attendeeInfo 参会者详情
 * @param req 请求参数
 * @returns {{eventName: *, organizer: (*|string), eventTime, address: string, ticketName: *, name: (*|string), buyerName: (*|string), buyTime, QRcode: *}}
 */
exports.getTicketReplaceData = async function (eventInfo, orderInfo, attendeeInfos, req) {
    // 活动主办方
    const organizerNameArr = Event.getOrgNameArr(eventInfo);
    // 活动地址
    const address          = Event.getEventLocation(req, eventInfo);
    //门票信息
    let tickets            = [];
    const attendeeLengtn   = attendeeInfos.length;
    for (let i = 0; i < attendeeLengtn; i++) {
        let obj        = {};
        let ticketId   = attendeeInfos[i].codeObj.ticketId;
        let ticketInfo = await Event.getTicketByTicketId(ticketId, eventInfo.tickets);    //门票信息
        obj.ticketName = ticketInfo.name;
        obj.name       = attendeeInfos[i].collectInfo.name || '';
        obj.buyerName = orderInfo.buyer.name || '',
            obj.buyTime = moment(orderInfo.cTime).format('YYYY-MM-DD HH:mm'),
            obj.QRcode = await myutil.getQRcode(attendeeInfos[i].qrCodeContent);
        obj.attendeeId = attendeeInfos[i].attendeeId;
        tickets.push(obj);
    }
    const toReplaceData = {
        eventName: eventInfo.title || '',
        organizer: organizerNameArr.toString() || '',
        eventTime: Event.getEventTimeStr(eventInfo),
        address  : address,
        tickets  : tickets,
        thumbnail: eventInfo.thumbnail || '',
        mobile   : eventInfo.contact.mobile || '',
        email    : eventInfo.contact.email || '',
    };
    return toReplaceData;
};

/**
 * 生成电子票pdf文件,并返回电子票pdf路径
 * @param orderInfo 订单详情
 * @param pdfName pdf名称，  生成单个用参会者id， 生成全部用订单号
 * @param toReplaceData 要进行模板替换的变量
 * @param req 请求信息

 console.log('测试列表模板...')
 const toReplaceData     = { 'users': [{'name':'张三','sex':'男'},{'name':'李四','sex':'女'}]};
 exports.sendNotice(req,functionType,'list_test','email',toReplaceData,{'email':'347431645@qq.com'});

 */
exports.createETicket = async function (orderInfo, pdfName, toReplaceData, req) {
    // 判断电子票是否存在
    var pdfPath    = exports.getTicketPath(orderInfo.cTime, pdfName + '.pdf');
    var fileExists = myutil.fsExistsSync(pdfPath);
    if (!fileExists) {
        // 读取电子票模板替换对应的变量
        const result      = await r.table("EmailSmsTemplate").filter({'templateCode': 'ticket_pdf_template'}).run();
        const tempInfo    = result[0];
        const tempHtml    = myutil.escape2Html(tempInfo.templateContent);
        let template      = _.template(tempHtml); //模板内容
        const htmlContent = template(toReplaceData);  //变量放入模板
        // const templatePath = "./views/template/ticket.html";
        // const htmlContent  = ts.getTemplateContent(templatePath, toReplaceData);
        await myutil.html2pdf(htmlContent, pdfPath);

    }
    return pdfPath;
};

/**
 * 发送电子票邮件
 * @param eventInfo 活动详情
 * @param orderInfo 订单详情
 * @param attendeeInfo 参会者详情
 * @param toReplaceData 要替换的变量
 * @param req 请求信息
 */
exports.sendETicketEmail = async function (eventInfo, orderInfo, attendeeInfo, toReplaceData, req) {

    try {

        toReplaceData.downloadUrl = settings.serverApiUrl + '/attendee/downloadEticket?attendeeId=' + attendeeInfo.attendeeId + '&orderNumber=' + orderInfo.orderNumber;
        logger.debug('单张电子票下载地址是:', toReplaceData.downloadUrl);

        const templateEmailPath      = "./views/template/ticketEmail.html";// 获取电子票邮件模板
        const ticketEmailHtmlContent = ts.getTemplateContent(templateEmailPath, toReplaceData);// 进行模板变量替换

        // 拼接邮件并发送
        const email = attendeeInfo.collectInfo.email;
        if ((_.isUndefined(email)) || (_.isEmpty(email))) { return; }
        const functionType = fixParams.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 通知邮件
        const params       = __jointEmailRecord(
            req, functionType, email,
            req.__("eventdove_eticket", eventInfo.title), ticketEmailHtmlContent,
            eventInfo.id, eventInfo.userId
        );

        Notice.systemSendRecord(params);

    } catch (err) {
        logger.error('sendETicketEmail ', err);
    }

};

/**
 * 更新参会者信息为已发送电子票
 * @param orderInfo 订单详情
 * @param attendeeId 参会者签到码
 */
exports.updateETicketSent = async function (orderInfo, attendeeId) {

    try {

        // 根据参会者id查询参会者是否存在
        const attendeeIndex = _.findIndex(orderInfo.attendees, {attendeeId: attendeeId});
        if (attendeeIndex !== -1) {
            // 更新attendees的参会者信息中的isETicketSent字段
            orderInfo.attendees[attendeeIndex].isETicketSent = true;
            exports.updateAttendees(orderInfo.id, orderInfo.attendees);
        }

    } catch (err) { }

};

// 获取门票路径
exports.getTicketPath = function (orderCTime, ticketFile) {
    var appDir     = myutil.getAppDir();
    var folderName = moment(orderCTime).format('YYYYMMDD');
    var pdfPath    = path.join(appDir, "/public/files/ticket/", folderName, ticketFile);
    return pdfPath;
};

exports.sendETicketSmsAfterPay = async function (req, orderInfo) {
    try {
        // 拼接短信 并发送
        const mobile = orderInfo.mobile;
        if ((_.isUndefined(mobile)) || (_.isEmpty(mobile))) { return; }
        const content = orderInfo.content;
        if ((_.isUndefined(content)) || (_.isEmpty(content))) { return; }
        const functionType = fixParams.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;
        const params       = __jointSmsRecord(
            functionType, mobile, orderInfo.content,
            orderInfo.eventId, orderInfo.userId
        );
        Notice.systemSendRecord(params);

    } catch (err) {
        logger.error('sendETicketSmsAfterPay ', err);
    }

};

/**
 * 给购票者发送电子票
 * @param eventInfo 活动详情
 * @param orderInfo 订单详情
 * @param email 邮箱
 * @param toReplaceData 要替换的变量
 * @param req 请求信息
 */
exports.sendETicketEmailToBuyer = async function (eventInfo, orderInfo, email, toReplaceData, req) {

    try {

        toReplaceData.downloadUrl = settings.serverApiUrl + '/attendee/downloadAllEticket?orderNumber=' + orderInfo.orderNumber;
        logger.debug('电子票下载地址是:', toReplaceData.downloadUrl);

        const templateEmailPath      = "./views/template/ticketEmail.html";// 获取电子票邮件模板
        const ticketEmailHtmlContent = ts.getTemplateContent(templateEmailPath, toReplaceData);// 进行模板变量替换

        // 拼接邮件并发送
        if ((_.isUndefined(email)) || (_.isEmpty(email))) { return; }
        const functionType = fixParams.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 通知邮件
        const params       = __jointEmailRecord(
            req, functionType, email,
            req.__("eventdove_eticket", eventInfo.title), ticketEmailHtmlContent, eventInfo.id,
            eventInfo.userId
        );

        Notice.systemSendRecord(params);

    } catch (err) {
        logger.error('sendETicketEmailToBuyer ', err);
    }

};

// 在指定时间后变更订单状态为超时未支付,timeOut
exports.produceOrderTimeOut = async function (id, diffMilliseconds) {
    let options         = {deliveryMode: 2, durable: true, headers: {"x-delay": diffMilliseconds}};
    let payload         = {type: 'orderTimeOut', id: id};
    let delayedExchange = await Queue.createDelayedExchange(exchangeName, RabbitMQConfig.connUrl);
    Queue.addPublisher(delayedExchange, queueName, exchangeName, payload, options);
};

// 消费订单状态为超时未支付的消息
exports.consumeOrderTimeOut = async function (msg, _channel) {
    try {
        let payloadStr = msg.content.toString();
        if (_.isEmpty(payloadStr)) { return; }

        let payload = JSON.parse(payloadStr);
        let type    = payload.type;// 消费的类型
        let id      = payload.id;// 主键id

        if ('orderTimeOut' !== type) { return; }

        logger.debug('正在消费consumeOrderTimeOut...', payload);

        let orderInfo = await exports.getOrderById(id);

        if (orderInfo.status !== fixParams.ORDER_STATUS.ORDER_STATUS_PAID_NONE) { return _channel.ack(msg); }

        if (myutil.inArray(orderInfo.paymentMethod, [fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ONSITE, fixParams.PAYMENT_METHOD.PAYMENT_METHOD_TRANSFER])) { return _channel.ack(msg); }

        await exports.updateOrderById(id, {status: fixParams.ORDER_STATUS.ORDER_STATUS_PAID_TIMEOUT});

        return _channel.ack(msg);
    } catch (err) {
        await Promise.delay(10000);// 防止无节制报错重传,这里设定一下延时,10秒重试
        logger.error('消费consumeOrderTimeOut...出错了,错误信息是', err);
        return _channel.reject(msg, true);// 重传该消息给下一个订阅者
    }
};

// 计算订单门票购买数量
exports.getTicketCount = function (orderDetails) {
    return _.reduce(orderDetails, function (sum, orderInfo) {
        return orderInfo.ticketCount ? sum + orderInfo.ticketCount : sum;
    }, 0)
};

// 获取活动的参加人数
exports.getAttendeeCount = function (eventId) {
    return r.table("Order")
            .getAll(eventId, {index: 'eventId'})
            .concatMap(
                function (doc) {return doc("attendees")}
            )
            .filter(
                function (attendeeInfo) {return attendeeInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)}
            )
            .count();
};

// 获取活动的签到人数
exports.getCheckedInCount = function (eventId) {
    return r.table("Order")
            .getAll(eventId, {index: 'eventId'})
            .concatMap(
                function (doc) {return doc("attendees")}
            )
            .filter(
                function (attendeeInfo) {return attendeeInfo("isCheckedIn").eq(true)}
            )
            .filter(
                function (attendeeInfo) {return attendeeInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)}
            )
            .count();
};

// 获取活动的未签到人数
exports.getNoSignInCount = function (eventId) {
    return r.table("Order")
            .getAll(eventId, {index: 'eventId'})
            .concatMap(
                function (doc) {return doc("attendees")}
            )
            .filter(
                function (attendeeInfo) {return attendeeInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)}
            )
            .filter(
                function (attendeeInfo) {return attendeeInfo("isCheckedIn").eq(false)}
            )
            .count();
};

// 根据活动id查询活动总收入
exports.getEventRevenue = function (eventId) {
    // 只统计支付方式为alipay,paypal,wechat,onsite,transfer的订单
    // 并且参会者支付状态payStatus为paid
    // 并且参会者退票状态attendeeStatus为normal的订单记录

    const paymentMethodArr = [
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ONSITE,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_TRANSFER
    ];

    return r.table("Order")
            .getAll(eventId, {index: 'eventId'})
            .filter(function (doc) { return r.expr(paymentMethodArr).contains(doc("paymentMethod")) })
            .concatMap(function (orderInfo) {return orderInfo("attendees")})
            .filter(
                function (doc) {
                    return doc("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                           .and(doc("attendeeStatus").eq(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL))
                }
            ).sum('actualTicketPrice');
};

// 根据活动id查询线上收款总额
exports.getOnlineRevenue = function (eventId) {

    // 只统计支付方式为alipay,paypal,wechat的订单
    // 并且参会者支付状态payStatus为paid
    // 并且参会者退票状态attendeeStatus为normal的订单记录

    const paymentMethodArr = [
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,
    ];

    return r.table("Order")
            .getAll(eventId, {index: 'eventId'})
            .filter(function (doc) { return r.expr(paymentMethodArr).contains(doc("paymentMethod")) })
            .concatMap(function (orderInfo) {return orderInfo("attendees")})
            .filter(
                function (doc) {
                    return doc("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                           .and(doc("attendeeStatus").eq(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL))
                }
            ).sum('actualTicketPrice');


};

// 根据活动id查询线下订单收入
exports.getOffLineRevenue = function (eventId) {

    // 只统计支付方式为onsite和transfer的订单
    // 并且参会者支付状态payStatus为paid
    // 并且参会者退票状态attendeeStatus为normal的订单记录

    const paymentMethodArr = [fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ONSITE, fixParams.PAYMENT_METHOD.PAYMENT_METHOD_TRANSFER];

    return r.table("Order")
            .getAll(eventId, {index: 'eventId'})
            .filter(function (doc) { return r.expr(paymentMethodArr).contains(doc("paymentMethod")) })
            .concatMap(function (orderInfo) {return orderInfo("attendees")})
            .filter(
                function (doc) {
                    return doc("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                           .and(doc("attendeeStatus").eq(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL))
                }
            ).sum('actualTicketPrice');
};

// 根据活动id查询获取活动订单总数
exports.getOrderCountByEventId = function (eventId) {
    return r.table('Order').getAll(eventId, {index: 'eventId'}).count();
};

// 根据活动id查询获取报名人数统计
exports.getRegistrationStatistics = function (eventId) {
    return r.table("Order")
            .getAll(eventId, {index: 'eventId'})
            .map(
                function (doc) {
                    return doc.merge(
                        {
                            attendees: doc('attendees').filter(
                                function (attendeeInfo) {
                                    return attendeeInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                                                    .and(attendeeInfo("attendeeStatus").eq(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL))
                                }
                            )
                        }
                    )
                }
            )
            .filter(function (doc) { return doc('attendees').ne([])})
            .map(
                function (doc) {
                    return {
                        attendees: doc('attendees').map(
                            function (aInfo) {
                                return aInfo.merge({cTime: doc('cTime'), orderNumber: doc('orderNumber')});
                            }
                        )
                    }
                }
            )
            .concatMap(function (orderInfo) {return orderInfo("attendees")})
            .group(
                [r.row('cTime').year(), r.row('cTime').month(), r.row('cTime').day()]
            )
            .ungroup()
            .map(
                function (doc) {
                    return {
                        time : doc('group'),
                        total: doc('reduction').count(),
                    };
                }
            );
};

// 根据活动id查询获取门票统计
exports.getTicketStatistics = function (eventId) {

    return r.table("Order")
            .getAll(eventId, {index: 'eventId'})
            .map(
                function (doc) {
                    return doc.merge(
                        {
                            attendees: doc('attendees').filter(
                                function (attendeeInfo) {
                                    return attendeeInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                                                    .and(attendeeInfo("attendeeStatus").eq(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL))
                                }
                            )
                        }
                    )
                }
            )
            .filter(function (doc) { return doc('attendees').ne([])})
            .map(
                function (doc) {
                    return {
                        attendees: doc('attendees').map(
                            function (aInfo) {
                                return aInfo.merge({cTime: doc('cTime'), orderNumber: doc('orderNumber')});
                            }
                        )
                    }
                }
            )
            .concatMap(function (orderInfo) {return orderInfo("attendees")})
            .group(
                [r.row('cTime').year(), r.row('cTime').month(), r.row('cTime').day()]
            )
            .pluck({"currentTicketInfo": ["name", "ticketId"]})
            .ungroup()
            .map(
                function (doc) {
                    return {
                        time     : doc('group'),
                        total    : doc('reduction').count(),
                        reduction: doc('reduction').map(function (currentTicketInfo) {return currentTicketInfo("currentTicketInfo")})
                    };
                }
            );
};

// 根据活动id查询每种门票的销售信息
exports.getEveryTicketStatistics = async function (eventId) {
    // 每种门票总卖出数量
    const totalSaleCountList = await r.table("Order")
                                      .getAll(eventId, {index: 'eventId'})
                                      .concatMap(function (orderInfo) {return orderInfo("attendees")})
                                      .filter(
                                          function (attendeeInfo) {return attendeeInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)}
                                      )
                                      .pluck({"currentTicketInfo": ["name", "ticketId"]})
                                      .group(function (doc) { return doc("currentTicketInfo").pluck('name', 'ticketId') })
                                      .count();

    // 每种门票未签到数量
    const noSignInCountList = await r.table("Order")
                                     .getAll(eventId, {index: 'eventId'})
                                     .concatMap(function (orderInfo) {return orderInfo("attendees")})
                                     .filter(
                                         function (attendeeInfo) {
                                             return attendeeInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                                                             .and(attendeeInfo("isCheckedIn").eq(false))
                                         }
                                     )
                                     .pluck("isCheckedIn", {"currentTicketInfo": ["name", "ticketId"]})
                                     .group(function (doc) { return doc("currentTicketInfo").pluck('name', 'ticketId') })
                                     .count();

    // 每种门票已签到数量
    const signInCountList = await r.table("Order")
                                   .getAll(eventId, {index: 'eventId'})
                                   .concatMap(function (orderInfo) {return orderInfo("attendees")})
                                   .filter(
                                       function (attendeeInfo) {
                                           return attendeeInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                                                           .and(attendeeInfo("isCheckedIn").eq(true))
                                       }
                                   )
                                   .pluck("isCheckedIn", {"currentTicketInfo": ["name", "ticketId"]})
                                   .group(function (doc) { return doc("currentTicketInfo").pluck('name', 'ticketId') })
                                   .count();

    return {
        totalSaleCountList: totalSaleCountList,
        noSignInCountList : noSignInCountList,
        signInCountList   : signInCountList,
    }
};

// 根据活动id查询参会者信息统计
exports.collectInfoStatistics = async function (params) {
    const eventId     = params.eventId;
    const isCheckedIn = params.isCheckedIn;
    const itemName    = params.itemName;
    let orderFilter   = r.table('Order');

    orderFilter = orderFilter.getAll(eventId, {index: 'eventId'})
                             .map(
                                 function (doc) {
                                     return doc.merge(
                                         {
                                             attendees: doc('attendees').filter(
                                                 function (attendeeInfo) {
                                                     return attendeeInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                                                                     .and(attendeeInfo("attendeeStatus").eq(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL))
                                                 }
                                             )
                                         }
                                     )
                                 }
                             )
                             .filter(function (doc) { return doc('attendees').ne([])})
                             .concatMap(function (orderInfo) {return orderInfo("attendees")})
                             .pluck("isCheckedIn", "collectInfo");

    if (!_.isUndefined(isCheckedIn)) {
        orderFilter = orderFilter.filter(function (doc) {return doc("isCheckedIn").eq(isCheckedIn)})
    }

    return orderFilter.group(function (doc) { return doc("collectInfo").pluck(itemName) }).count();
};

// 根据用户Id分页获取订单
exports.getOrderByUserIdAndPageIndex = function (params) {
    var userId     = params.userId;
    var totalCount = parseInt(params.total) || -1;// 总记录数
    var page       = parseInt(params.page) || 1;  // 第几页
    var limit      = parseInt(params.limit) || 10;// 每页显示记录数
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "cTime";

    var items = r.table("Order")
                 .getAll(userId, {index: 'userId'})
                 .eqJoin("eventId", r.table("Event"))
                 .slice(skip, skip + limit)
                 .pluck(
                     {
                         'left': [
                             'id', 'orderNumber', 'totalPrice',
                             'cTime', 'status', 'paymentPriceUnitSign',
                             {'orderDetails': ['ticketName', 'ticketCount']},
                             {'attendees': ['attendeeId', 'isCheckedIn', 'codeObj', 'collectInfo', 'qrCodeTicket']},
                         ]
                     },
                     {
                         'right': [
                             'id', 'title', 'startTime', 'endTime', 'endTime',
                             'detailedAddress', 'contact', 'bannerUrl', 'thumbnail'
                         ]
                     }
                 )
                 .orderBy(r.desc(function (doc) { return doc('left')(orderBy) }))
                 .run();

    if (totalCount === -1) {
        totalCount = r.table("Order").getAll(userId, {index: 'userId'}).eqJoin("eventId", r.table("Event")).count().run();
    }

    return Promise.props({items: items, count: totalCount});
};

// 统计活动下所有已支付订单的参会者总数
exports.getPaidAattendeesNum = function (eventId) {
    return r.table("Order").filter({'eventId': eventId, 'status': 'paid'})('attendees').map(function (order) {
        return order.count()
    }).sum().run();
};

// 获取订单状态
exports.getOrderStatusList = function (req) {
    var orderStatusTypes = _.values(fixParams.ORDER_STATUS);
    var orderStatusList  = [];
    _.each(orderStatusTypes, function (orderStatusType) {
        var i18nKey = "order_status_" + orderStatusType;
        orderStatusList.push({name: orderStatusType, str: req.__(i18nKey)})
    });
    return orderStatusList;
};

// 获取支付状态
exports.getOrderPaymentMethodList = function (req) {
    var orderPaymentMethods    = _.values(fixParams.PAYMENT_METHOD);
    var orderPaymentMethodList = [];
    _.each(orderPaymentMethods, function (orderPaymentMethod) {
        var i18nKey = "order_PaymentMethod_" + orderPaymentMethod;
        orderPaymentMethodList.push({name: orderPaymentMethod, str: req.__(i18nKey)})
    });
    return orderPaymentMethodList;
};

// 根据用户id查询该用户名下所有参会人员数量
exports.getTotalAttendee = async function (userId) {

    let totalAttendee = 0;

    try {
        totalAttendee = await r.table("Order")
                               .getAll(userId, {index: 'eventUserId'})
                               .concatMap(function (orderInfo) {return orderInfo("attendees")})
                               .filter(
                                   function (doc) {
                                       return doc("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                                              .and(doc("attendeeStatus").eq(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL))
                                   }
                               )
                               .count()
    } catch (err) {
        logger.error('getTotalAttendee ', err);
    }

    return totalAttendee;
};

// 根据用户id查询该用户人民币和美元收入总计
exports.getTotalIncome = async function (userId) {

    const paymentMethodArr = [
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ONSITE,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_TRANSFER
    ];

    let returnObj = {
        RMBTotalIncome   : 0,
        DollarTotalIncome: 0
    };

    try {
        returnObj.RMBTotalIncome = await r.table("Order")
                                          .getAll(userId, {index: 'eventUserId'})
                                          .filter({"currencyType": fixParams.CURRENCY_NAME.YUAN})
                                          .filter(function (doc) { return r.expr(paymentMethodArr).contains(doc("paymentMethod")) })
                                          .concatMap(function (orderInfo) {return orderInfo("attendees")})
                                          .filter(
                                              function (doc) {
                                                  return doc("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                                                         .and(doc("attendeeStatus").eq(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL))
                                              }
                                          )
                                          .sum('actualTicketPrice');

        returnObj.DollarTotalIncome = await r.table("Order")
                                             .getAll(userId, {index: 'eventUserId'})
                                             .filter({"currencyType": fixParams.CURRENCY_NAME.DOLLAR})
                                             .filter(function (doc) { return r.expr(paymentMethodArr).contains(doc("paymentMethod")) })
                                             .concatMap(function (orderInfo) {return orderInfo("attendees")})
                                             .filter(
                                                 function (doc) {
                                                     return doc("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                                                            .and(doc("attendeeStatus").eq(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL))
                                                 }
                                             )
                                             .sum('actualTicketPrice');

    } catch (err) {
        logger.error('getTotalIncome ', err);
    }

    return returnObj;
};

// 根据用户id查询该用户活动的人民币总收入统计
exports.getRMBTotalIncomeStatistics = async function (userId) {

    const paymentMethodArr = [
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ONSITE,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_TRANSFER
    ];

    return r.table("Order")
            .getAll(userId, {index: 'eventUserId'})
            .filter({"currencyType": fixParams.CURRENCY_NAME.YUAN})
            .filter(function (doc) { return r.expr(paymentMethodArr).contains(doc("paymentMethod")) })
            .map(
                function (doc) {
                    return doc.merge(
                        {
                            attendees: doc('attendees').filter(
                                function (attendeeInfo) {
                                    return attendeeInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                                                    .and(attendeeInfo("attendeeStatus").eq(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL))
                                }
                            )
                        }
                    )
                }
            )
            .filter(function (doc) { return doc('attendees').ne([])})
            .map(
                function (doc) {
                    return {
                        attendees: doc('attendees').map(
                            function (aInfo) {
                                return aInfo.merge({cTime: doc('cTime'), orderNumber: doc('orderNumber')});
                            }
                        )
                    }
                }
            )
            .concatMap(function (orderInfo) {return orderInfo("attendees")})
            .group(
                [r.row('cTime').year(), r.row('cTime').month(), r.row('cTime').day()]
            )
            .ungroup()
            .map(
                function (doc) {
                    return {
                        time      : doc('group'),
                        totalPrice: doc('reduction')('actualTicketPrice').sum()
                    };
                }
            )
};

// 根据用户id查询该用户活动的dollar总收入统计
exports.getDollarTotalIncomeStatistics = async function (userId) {

    const paymentMethodArr = [
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_ONSITE,
        fixParams.PAYMENT_METHOD.PAYMENT_METHOD_TRANSFER
    ];

    return r.table("Order")
            .getAll(userId, {index: 'eventUserId'})
            .filter({"currencyType": fixParams.CURRENCY_NAME.DOLLAR})
            .filter(function (doc) { return r.expr(paymentMethodArr).contains(doc("paymentMethod")) })
            .map(
                function (doc) {
                    return doc.merge(
                        {
                            attendees: doc('attendees').filter(
                                function (attendeeInfo) {
                                    return attendeeInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                                                    .and(attendeeInfo("attendeeStatus").eq(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL))
                                }
                            )
                        }
                    )
                }
            )
            .filter(function (doc) { return doc('attendees').ne([])})
            .map(
                function (doc) {
                    return {
                        attendees: doc('attendees').map(
                            function (aInfo) {
                                return aInfo.merge({cTime: doc('cTime'), orderNumber: doc('orderNumber')});
                            }
                        )
                    }
                }
            )
            .concatMap(function (orderInfo) {return orderInfo("attendees")})
            .group(
                [r.row('cTime').year(), r.row('cTime').month(), r.row('cTime').day()]
            )
            .ungroup()
            .map(
                function (doc) {
                    return {
                        time      : doc('group'),
                        totalPrice: doc('reduction')('actualTicketPrice').sum()
                    };
                }
            )
};

// 根据用户id查询该用户报名人数统计
exports.getRegistrationStatisticsByUserId = function (userId) {

    return r.table("Order")
            .getAll(userId, {index: 'eventUserId'})
            .map(
                function (doc) {
                    return doc.merge(
                        {
                            attendees: doc('attendees').filter(
                                function (attendeeInfo) {
                                    return attendeeInfo("payStatus").eq(fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
                                                                    .and(attendeeInfo("attendeeStatus").eq(fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL))
                                }
                            )
                        }
                    )
                }
            )
            .filter(function (doc) { return doc('attendees').ne([])})
            .map(
                function (doc) {
                    return {
                        attendees: doc('attendees').map(
                            function (aInfo) {
                                return aInfo.merge({cTime: doc('cTime'), orderNumber: doc('orderNumber')});
                            }
                        )
                    }
                }
            )
            .concatMap(function (orderInfo) {return orderInfo("attendees")})
            .group(
                [r.row('cTime').year(), r.row('cTime').month(), r.row('cTime').day()]
            )
            .ungroup()
            .map(
                function (doc) {
                    return {
                        time : doc('group'),
                        total: doc('reduction').count(),
                    };
                }
            );
};

exports.getReceiverTypeInfo = function (params, attributeNames) {
    var pluckArr     = _.isEmpty(attributeNames) ? _.keys(OrderFields) : attributeNames;
    var receiverRsql = __joiningReceiverTypeRsql(params.eventId, params.recordType, params.findType);
    if (_.isEmpty(attributeNames)) {
        receiverRsql = receiverRsql.count();
    } else {
        receiverRsql = receiverRsql.pluck(pluckArr);
    }
    // logger.debug("receiverRsql: "+receiverRsql);

    return receiverRsql.run();
};

/**
 * eventId 活动Id
 * recordType 发记录类型  sms: 必须含手机号 email: 必须含邮箱
 * status 定单状态  "partPaid","paid","partRefund" : 支付成功
 * findType 查找类型
 * @type {(p1:Object, p2:Object, p3:Function)}
 */
function __joiningReceiverTypeRsql(eventId, recordType, findType) {
    var rsql = r.table('Order').getAll(eventId, {index: 'eventId'});

    // 所有报名成功的所有参会者信息
    if (findType === 'attendee') {
        // 1. 定单为支付成功(包括:已支付paid,部分支付partPaid,部分退款partRefund)
        // 2. 且参会者支付状态 payStatus 为已支付 paid 参会者退款状态为未退款normal
        // 3. recordType为sms 则手机不为空,email则邮箱不为空
        var type = recordType === 'sms' ? 'mobile' : 'email';
        rsql     = rsql.filter(function (doc) {
            return r.expr(["partPaid", "paid", "partRefund"]).contains(doc("status"));
        }).concatMap(function (doc) {
            return doc("attendees")
        }).filter(function (attendee) {
            return attendee("payStatus").eq("paid").and(attendee("attendeeStatus").eq("normal").and(attendee("collectInfo")(type).ne('')))
        })
    } else {
        // 查询购票者是否含手机号或邮箱
        var type = recordType === 'sms' ? 'mobile' : 'email';
        rsql     = rsql.filter(function (doc) {
            return doc('buyer')(type).ne('');
        })
        // 所有线下未支付定单的购票者信息
        if (findType === 'onsite') {
            // 1. 支付方式paymentMethod为: 现场缴费onsite 或 银行转帐transfer
            // 2. 定单状态status为: 未支付none,部分支付partPaid,已审核待收款audited
            rsql = rsql.filter(function (doc) {
                return r.expr(["onsite", "transfer"]).contains(doc("paymentMethod"));
            }).filter(function (doc) {
                return r.expr(["none", "partPaid", "audited"]).contains(doc("status"));
            })
        } else {
            rsql = rsql.filter(function (doc) {
                return doc('status').eq(findType);
            })
        }
    }

    return rsql;
}

exports.processOrder = async function (orderInfo) {
    logger.debug('正在处理 orderId = ', orderInfo.id, ' 的订单记录...');

    try {

        AddressBook.extractContactFromOrder(orderInfo);

        // todo 判断订单类型来决定时候生产订单超时消息
        // exports.produceOrderTimeOut(orderInfo.id, 1800000);

        await r.table("Order").get(orderInfo.id).update({audited: true}).run();

    } catch (err) {
        logger.error('处理 orderId = ', orderInfo.id, '时出错了,报错信息是:', err);
    }

};

// 获取会鸽前台活动短链接地址
exports.getEventShortUrl = async function (eventId, isNeedProtocol) {

    const eventUrl_tpl = _.template(settings.eventdoveUrl.eventUrl, settings.eventdoveUrl.templateSettings);
    let eventUrl       = eventUrl_tpl({'eventId': eventId});

    try {

        // logger.debug('正在转换活动短链接地址,活动原始地址是 ', eventUrl);

        const shortUrlArr = await myutil.getShortUrl([eventUrl], isNeedProtocol);

        if (_.isEmpty(shortUrlArr)) {
            return eventUrl;
        }

        const shortUrl = shortUrlArr[0].short;

        // logger.debug('转换后的活动短链接地址是 ', shortUrl);

        return shortUrl;


    } catch (err) {

        return eventUrl;

    }

};

// 获取会鸽前台门票短链接地址
exports.getTicketShortUrl = async function (orderNumber, attendeeId, isNeedProtocol) {

    const ticketUrl_tpl = _.template(settings.eventdoveUrl.ticketUrl, settings.eventdoveUrl.templateSettings);
    let ticketUrl       = ticketUrl_tpl({'orderNumber': orderNumber, 'attendeeId': attendeeId});

    try {

        // logger.debug('正在转换门票短链接地址,门票原始地址是 ', ticketUrl);

        const shortUrlArr = await myutil.getShortUrl([ticketUrl], isNeedProtocol);

        if (_.isEmpty(shortUrlArr)) {
            return ticketUrl;
        }

        const shortUrl = shortUrlArr[0].short;

        // logger.debug('转换后的门票短链接地址是 ', shortUrl);

        return shortUrl;

    } catch (err) {

        return ticketUrl;

    }

};

//获取订单支付短连接
exports.getOrderPayShortUrl = async function (orderId, eventId, isNeedProtocol) {
    const orderPayUrl_tpl = _.template(settings.eventdoveUrl.orderPayUrl, settings.eventdoveUrl.templateSettings);
    let orderPayUrl       = orderPayUrl_tpl({'orderId': orderId, 'eventId': eventId});
    try {
        logger.debug('正在转换订单支付链接地址,门票原始地址是 ', orderPayUrl);
        const shortUrlArr = await myutil.getShortUrl([orderPayUrl], isNeedProtocol);
        if (_.isEmpty(shortUrlArr)) {
            return orderPayUrl;
        }
        const shortUrl = shortUrlArr[0].short;
        logger.debug('转换后的订单支付短链接地址是 ', shortUrl);
        return shortUrl;
    } catch (err) {
        return orderPayUrl;
    }
};


// 活动是否有订单
exports.isEvHasOrder = async function (eventId) {
    let isEvHasOrder = false;
    try {
        const orderList = await exports.getOrderByEventId(eventId, ['orderNumber']);
        if (!_.isEmpty(orderList)) {
            isEvHasOrder = true;
        }
    } catch (err) {
        logger.error('isEvHasOrder ', err);
    }
    return isEvHasOrder;
};

// 根据参会者主键id数组查询参会者详情信息数组
exports.getAttendees = function (attendeeIds, attendees) {
    let result = [];
    _.each(attendeeIds, function (attendeeId) {
        let attendeeInfo = _.find(attendees, {attendeeId: attendeeId});
        if (!(_.isEmpty(attendeeInfo))) {
            result.push(attendeeInfo);
        }
    });
    return result;
};

// 计算门票退款是部分退款还是全额退款
exports.isTicketOrderFullRefund = async function (orderNumber, attendeeIds) {
    let isFullRefund = false;
    try {
        const attributeNames    = ['attendees'];
        const orderInfo         = await exports.getOrderByOrderNum(orderNumber, attributeNames);
        const attendees         = orderInfo.attendees;
        const userPostAttendees = exports.getAttendees(attendeeIds, attendees);
        isFullRefund            = _.isEqual(userPostAttendees, userPostAttendees);
    } catch (err) {
        logger.error('isEvHasOrder ', err);
    }
    return isFullRefund;
};

// 获取当前时间匹配到的退票规则
async function __getRefundSettings4CurrentTime(eventId, refundSettings) {

    let matchSetting = {};

    try {

        const eventInfo      = await Event.getEventById(eventId, ['startTime']);
        const dayBeforeStart = myutil.getDiffDays(eventInfo.startTime);// 距离活动开始天数,为负说明活动已经开始

        for (let setting of refundSettings) {

            if (dayBeforeStart >= setting.daysBeforeStart) {
                matchSetting = setting;
                break;
            }

        }

    } catch (err) {
        logger.error('__getRefundSettings4CurrentTime ', err);
    }

    return matchSetting;
}

// 计算退票手续费
async function __calcRefundFee(curTotalPrice, orderInfo) {

    let refundFee = 0;

    try {

        // 退票费计算规则 = 【（订单支付金额-支付通道费） * 0.2% 】


        const thirdPartyCharge = orderInfo.thirdPartyCharge;// 第三方通道费
        const eventId          = orderInfo.eventId;

        const refundSettings = await Event.getRefundSettings(eventId);// 退款设置

        // 如果用户未设置退票费率则退票费为0,如果设置了退票规则严格按照退票规则来执行

        if (!_.isEmpty(refundSettings)) {

            let matchSetting = await __getRefundSettings4CurrentTime(eventId, refundSettings);
            if (_.isEmpty(matchSetting)) {
                throw new Error('当前时间内,没有匹配到可用的退票规则,无法进行退票操作');
            }

            const curTime = moment().format('YYYY-MM-DD HH:mm');

            logger.debug('当前时间为 ', curTime, ' 匹配到的退票规则是 ', matchSetting);

            let refundRate = Big(matchSetting.refundRate);// 退票手续费费率

            let newCurTotalPrice    = Big(curTotalPrice);
            let newThirdPartyCharge = Big(thirdPartyCharge);
            let newRefundFee        = newCurTotalPrice.minus(newThirdPartyCharge).plus(refundRate);

            refundFee = newRefundFee.round(2);

            logger.debug('计算后的退票费为 ', refundFee);

        }

    } catch (err) {
        logger.error('__calcRefundFee ', err);
        throw err;
    }

    return refundFee;
}

// 为退款计算支付金额
async function __calcTicketOrderTotalPrice(orderInfo, attendeeIds) {
    try {
        // 单张票价*数量
        const attendees         = orderInfo.attendees;
        const userPostAttendees = exports.getAttendees(attendeeIds, attendees);
        const totalPrice        = _.reduce(userPostAttendees, function (sum, attendeeInfo) {
            return attendeeInfo.attendeeId ? (sum + attendeeInfo.actualTicketPrice) : sum;
        }, 0);
        return totalPrice;
    } catch (err) {
        logger.error('__calcTicketOrderTotalPrice ', err);
        throw err;
    }
}

// 计算门票退款金额
exports.calcTicketOrderRefundAmount = async function (orderNumber, attendeeIds) {
    try {

        // 退票总金额 = 订单支付金额【单张票价*数量】 -  退票费【（订单支付金额-支付通道费） * 0.2% 】-  支付通道费

        // 订单信息
        const attributeNames = ['eventId', 'totalPrice', 'thirdPartyCharge', 'attendees'];
        const orderInfo      = await exports.getOrderByOrderNum(orderNumber, attributeNames);

        const curTotalPrice = await __calcTicketOrderTotalPrice(orderInfo, attendeeIds);// 订单支付金额

        const refundFee = await __calcRefundFee(curTotalPrice, orderInfo);// 退票费

        const thirdPartyCharge = orderInfo.thirdPartyCharge;// 第三方通道费

        const newCurTotalPrice    = Big(curTotalPrice);
        const newRefundFee        = Big(refundFee);
        const newThirdPartyCharge = Big(thirdPartyCharge);

        let refundAmount = newCurTotalPrice.minus(newRefundFee).minus(newThirdPartyCharge);

        refundAmount = refundAmount.round(2);

        return refundAmount;

    } catch (err) {
        logger.error('calcTicketOrderRefundAmount ', err);
        throw err;
    }
};

// 活动是否能够进行退票
exports.isEventCanReturnTicket = async function (eventId) {

    let isEventCanReturnTicket = false;

    try {

        const eventAttributeNames = ['startTime'];
        const eventInfo           = await Event.getEventById(eventId, eventAttributeNames);

        // 当前时间距离活动开始天数
        // 正数,活动开始前
        // 0,活动当天
        // 负数,活动开始了
        const dayBeforeStart = myutil.getDiffDays(eventInfo.startTime);

        if (dayBeforeStart > 0) {
            isEventCanReturnTicket = true;
        }

    } catch (err) {
        logger.error('isEventCanReturnTicket ', err);
    }

    return isEventCanReturnTicket;
};

// 活动是否能够进行门票购买
exports.isEventCanBuyTicket = function (eventStatus) {

    let isEventCanBuyTicket = false;

    try {
        isEventCanBuyTicket = (eventStatus === 'published')
    } catch (err) {
        logger.error('isEventCanBuyTicket ', err);
    }

    return isEventCanBuyTicket;
};

// 从参会者信息中获取门票名称
exports.getTicketNameFromAttendeeInfo = function (attendeeInfo) {

    let ticketName = '';

    try {

        if (!_.isUndefined(attendeeInfo.codeObj) && !_.isUndefined(attendeeInfo.codeObj.ticketName)) {
            ticketName = attendeeInfo.codeObj.ticketName;
        }

        if (!_.isUndefined(attendeeInfo.currentTicketInfo) && !_.isUndefined(attendeeInfo.currentTicketInfo.name)) {
            ticketName = attendeeInfo.currentTicketInfo.name;
        }

    } catch (err) {
        logger.error('getTicketNameFromAttendeeInfo ', err);
    }

    return ticketName;
};

// 获取发票的收件人类型
exports.getInvoiceReceiveType = function (invoiceSetting) {
    let receiveType = '未知收件人类型';

    try {

        receiveType = !_.isUndefined(invoiceSetting.receiveType) ? invoiceSetting.receiveType : receiveType;

    } catch (err) {
        logger.error('getInvoiceReceiveType ', err);
    }

    return receiveType;
};


// 判断参会人员能否进行签到
exports.isAttendeeCanCheckedIn = function (attendeeInfo) {
    let isAttendeeCanCheckedIn = false;

    try {

        // payStatus = paid && attendeeStatus = normal 才能进行签到

        if (
            (attendeeInfo.payStatus === fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID)
            &&
            (attendeeInfo.attendeeStatus === fixParams.ATTENDEE_STATUS.ATTENDEE_STATUS_NORMAL)
        ) {
            isAttendeeCanCheckedIn = true;
        }

    } catch (err) {
        logger.error('isAttendeeCanCheckedIn ', err);
    }

    return isAttendeeCanCheckedIn;
};

// 设置参会者的支付状态为已支付
exports.setAttendeesPayStatus = function (attendees) {

    let newAttendees = _.cloneDeep(attendees);

    try {

        for (let attendeeInfo of newAttendees) {
            attendeeInfo.payStatus = fixParams.ATTENDEE_PAY_STATUS.ATTENDEE_PAY_STATUS_PAID;
        }

    } catch (err) {
        logger.error('setAttendeesPayStatus ', err);
    }

    return newAttendees;
}


exports.searchEventAttendeesByKey = async function(eventId,key,value){
    logger.info('order')
   let result = await r.table("Order")
  .getAll("6295544807909625856",{index:"eventId"}).getField("attendees")
  .filter(r.row("collectInfo")("name").contains("李辉"))
  .map(function (doc) {
    return doc('collectInfo') 
   })
  return result

}