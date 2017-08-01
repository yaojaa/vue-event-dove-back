const _         = require('lodash');
const myutil    = require('../util/util.js');
const thinky    = require('../util/thinky.js');
const validator = require('validator');
const type      = thinky.type;
const r         = thinky.r;
const nextId    = myutil.nextId;
const Promise   = require('bluebird');
const NoticeC   = require('../controllers/noticeController.js');
const fp        = require('../util/fixParams.js');
const settings  = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const RabbitMQConfig = require("../conf/settings").RabbitMQConfig;
const Queue          = require('../util/queue');
const exchangeName   = 'notice.delay.exchange';
const queueName      = 'notice.delay.queue';
exports.exchangeName = exchangeName;
exports.queueName    = queueName;

// 短信邮件订单表
const SmsEmailOrderFields = {
    id                  : type.string(),
    orderNumber         : type.string().required(),// 订单号
    userId              : type.string(),// 创建此订单的用户Id
    orderNote           : type.string(),// 订单备注
    totalPrice          : type.number().required(),// 支付总额,单位元
    rechargeNumber      : type.number(),// 充值条数
    type                : type.string().enum(
        fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS,
        fp.SEND_RECORD_TYPE.RECORD_TYPE_EMAIL
    ).required(),// 订单类型,短信类型"sms",邮件类型"email"
    currencyType        : type.string().enum(
        fp.CURRENCY_NAME.DOLLAR,
        fp.CURRENCY_NAME.YUAN
    ).default(fp.CURRENCY_NAME.YUAN).required(),// 货币类型
    paymentPriceUnitSign: type.string().enum(
        fp.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_YUAN,
        fp.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_DOLLAR
    ).default(fp.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_YUAN).required(),// 收款币种

    // 订单状态
    status: type.string().enum(
        fp.ORDER_STATUS.ORDER_STATUS_PAID_NONE,
        fp.ORDER_STATUS.ORDER_STATUS_PAID_TIMEOUT,
        fp.ORDER_STATUS.ORDER_STATUS_PAID,
        fp.ORDER_STATUS.ORDER_STATUS_ORDER_CANCEL
    ).default(fp.ORDER_STATUS.ORDER_STATUS_PAID_NONE).required(),

    // 支付方式
    paymentMethod: type.string().enum(
        fp.PAYMENT_METHOD.PAYMENT_METHOD_NONE,
        fp.PAYMENT_METHOD.PAYMENT_METHOD_FREE,
        fp.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY,
        fp.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL,
        fp.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT
    ).default(fp.PAYMENT_METHOD.PAYMENT_METHOD_NONE).required(),

    uTime: type.date().default(function () {return new Date();}),// 修改时间
    cTime: type.date().default(function () {return new Date();}),// 创建时间
};

const SmsEmailOrder = thinky.createModel("SmsEmailOrder", SmsEmailOrderFields);
SmsEmailOrder.ensureIndex("orderNumber");
SmsEmailOrder.ensureIndex("userId");

// 短信邮件发送记录表
const SmsEmailSendRecordFields = {
    id        : type.string(),
    receivers : [{
        receiver      : type.string().required(),     // 短信或邮件收件人手机号或邮箱
        receiverName  : type.string().default(""),                // 短信邮件收件人姓名
        sendStatus    : type.string().default(fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING)
            .enum(
                fp.RECORD_SEND_STATUS.SEND_STATUS_TO_BE_SENT,
                fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING,
                fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL,
                fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS
            ),// 发送状态,等待发送"toBeSent",发送中"sending"发送失败"sendFail",发送成功"sendSuccess",默认"toBeSent"
        describe      : type.string().default("")     // sendCloud 结果描述
    }],
    title     : type.string().default(""),      // 邮件发送标题
    from      : type.string().default(""),      // 发件人邮箱
    fromName  : type.string().default(""),      // 发件人名称
    replyTo   : type.string().default(""),      // 邮件回复地址
    content   : type.string().required(),       // 短信邮件发送的内容
    attachment: type.string().default(""),      // 附件 多个附件以';'隔开
    sendCount : type.number().integer().default(0),      // 发送记录条数
    type      : type.string().default(fp.SEND_RECORD_TYPE.RECORD_TYPE_EMAIL)
        .enum(
            fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS,
            fp.SEND_RECORD_TYPE.RECORD_TYPE_EMAIL),// 记录类型,短信类型"sms",邮件类型"email"
    userId               : type.string(),            // 用户id
    eventId              : type.string(),            // 活动id
    recordId             : type.string().required(), // 邮件短信记录id
    ctime                : type.date().default(function () { return new Date();}), // 记录创建时间
    utime                : type.date().default(function () { return new Date();})  // 记录更新时间
};

var SmsEmailSendRecord = thinky.createModel("SmsEmailSendRecord", SmsEmailSendRecordFields);
SmsEmailSendRecord.ensureIndex("eventId");
SmsEmailSendRecord.ensureIndex("userId");
SmsEmailSendRecord.ensureIndex("recordId");
exports.SmsEmailSendRecordFields = SmsEmailSendRecordFields;

// ********短信邮件记录表*******
const SmsEmailRecordFields = {
    id        : type.string(),
    receivers : type.string().required(),       // 收件邮件、手机号、或定单类别下的用户标识 备注：多个邮件/手机号以','隔开
    title     : type.string().default(""),      // 邮件或短信标题
    from      : type.string().default(""),      // 发件人邮箱
    fromName  : type.string().default(""),      // 发件人名称
    replyTo   : type.string().default(""),      // 邮件回复地址
    category  : type.string()       // 类别,短信"sms",邮件"email"
                .default(fp.SEND_RECORD_TYPE.RECORD_TYPE_EMAIL)
                .enum(
                    fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS,
                    fp.SEND_RECORD_TYPE.RECORD_TYPE_EMAIL
                ).required(),

    content   : type.string().required(),       // 邮件短信内容
    attachment: type.string().default(""),      // 附件 多个附件以';'隔开
    sendType  : type.string()                   // 邮件短信发送类型: 立即发送、定时发送
                .default(fp.SEND_TYPE.SEND_TYPE_IMMEDIATELY)
                .enum(
                    fp.SEND_TYPE.SEND_TYPE_IMMEDIATELY,
                    fp.SEND_TYPE.SEND_TYPE_TIMED
                ).required(),
    sendTime  : type.date(),                    // 发送时间 备注: 立即发送为当前时间
    type      : type.string()    // 邮件短信类型
                .enum(
                    fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_PROMOTION,
                    fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_NOTICEMENT,
                    fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_COUPONSHARE,
                    fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_MEMBERSHIP,
                    fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_INFORMS,
                    fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM
                ).required(),
    sendStatus: type.string()   // 第三方接收状态(即: 发送状态)
                .default(fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING)
                .enum(
                    fp.RECORD_SEND_STATUS.SEND_STATUS_TO_BE_SENT,
                    fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING,
                    fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL,
                    fp.RECORD_SEND_STATUS.SEND_STATUS_DEDUCT_FAIL,
                    fp.RECORD_SEND_STATUS.SEND_STATUS_PART_SUCCESS,
                    fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS
                ).required(),
    describe         : type.string().default(''),               // 接收结果描述
    receiverTotal    : type.number().integer().default(0),      // 收件人总数
    sendCount        : type.number().integer().default(0),      // 发送记录条数
    walletDeductSms  : type.number().integer().default(0),      // 钱包中须扣除短信条数
    walletDeductEmail: type.number().integer().default(0),      // 钱包中须扣除邮件条数
    eventDeductEmail : type.number().integer().default(0),      // 活动中须扣除邮件条数

    userId    : type.string(),                      // 用户id
    eventId   : type.string(),                      // 活动id
    isDraft   : type.boolean().default(false),      // 是否草稿  true: 草稿 false: 非草稿
    isDel     : type.boolean().default(false),      // 是否删除(定时发送下为取消发送)
    isAudit   : type.boolean().default(false),      // 该条记录是否已经审计(发送消息队列)
    ctime     : type.date(), // 记录创建时间
    updateUserId: type.string(),                      // 修改用户id
    utime     : type.date()  // 记录更新时间
}

var SmsEmailRecord = thinky.createModel("SmsEmailRecord", SmsEmailRecordFields);
exports.SmsEmailRecordModel = SmsEmailRecord
exports.SmsEmailRecordFields = SmsEmailRecordFields;

// secondary index
var SMS_EMAIL_RECORD_INDICES = ['receivers', 'title', 'from', 'category', 'sendType','type', 'sendStatus', 'userId', 'eventId', 'isDraft', 'isDel', 'ctime'];

_.each(SMS_EMAIL_RECORD_INDICES, function (index) {
    SmsEmailRecord.ensureIndex(index);
});

// ****** 保存短信邮件记录 ******
exports.saveRecord = function(data){
    var ser_new = new SmsEmailRecord(data);
    ser_new.id  = nextId();
    var now_time = new Date();
    if(ser_new.isDraft === true){
        ser_new.sendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_TO_BE_SENT;
    }else{
        if(ser_new.sendType === fp.SEND_TYPE.SEND_TYPE_IMMEDIATELY){
            ser_new.sendTime = now_time;
        }else{
            ser_new.sendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_TO_BE_SENT;
        }
    }
    ser_new.ctime = now_time;
    ser_new.utime = now_time;

    return ser_new.save();
}
// ****** 根据Id获取邮件短信记录 ******
exports.getRecord = function(record, attributeNames){
    attributeNames  = _.isEmpty(attributeNames) ? _.keys(SmsEmailRecordFields) : attributeNames;
    return r.table('SmsEmailRecord').get(record).pluck(attributeNames).run();
}
// ****** 修改短信邮件记录 ******
exports.updateRecord = function(id, update){
    var now_time = new Date();
    if(update.sendType === fp.SEND_TYPE.SEND_TYPE_IMMEDIATELY){
        update.sendTime = now_time;
    }
    update.utime = now_time;
    return SmsEmailRecord.get(id).update(update).run();
}

// ****** 根据Id删除邮件短信记录 ******
exports.delRecord = function (recordId, isDraft, userId) {
    var delRsql = r.table('SmsEmailRecord').get(recordId);
    if(isDraft === true){
        // 草稿物理删除
        delRsql = delRsql.delete();
    }else{
        // 其它将删除状态改为true
        var now_time = new Date();
        delRsql = delRsql.update({updateUserId: userId, isDel: true, utime: now_time});
    }
    return delRsql.run();
};

// ****** 根据条件分页获取短信邮件记录 ******
exports.getAllRecord = function(params, attributeNames){
    attributeNames  = _.isEmpty(attributeNames) ? _.keys(SmsEmailRecordFields) : attributeNames;
    var recordRsql  = __joiningRecordRsql(params);
    var totalCount  = parseInt(params.total) || -1;  // 总记录数
    var page        = parseInt(params.page)  || 1;   // 第几页
    var limit       = parseInt(params.limit) || 10;  // 每页显示记录数
    var skip        = ( page - 1 ) * limit;
    var orderBy     = params.orderBy || "ctime";

    logger.debug('recordRsql: '+recordRsql);
    var items = recordRsql.orderBy(r.desc(orderBy)).slice(skip, skip + limit).pluck(attributeNames).run();

    if (totalCount === -1) {
        totalCount = recordRsql.count().run();
    }
    return Promise.props({items: items, count: totalCount});
}

// ****** 拼装查询短信邮件记录查询条件 ******
function __joiningRecordRsql(params) {
    var userId       = params.userId;      // 用户Id
    var eventId      = params.eventId;     // 活动Id
    var sendStatus   = params.sendStatus;  // 发送状态
    var category     = params.category;    // 短信/邮件类型
    var isDraft      = params.isDraft;     // 是否草稿
    var type         = params.type;        // 邮件短信类型
    var rsql = r.table('SmsEmailRecord').getAll(category, {index: 'category'})
              .filter(function(doc){    // 未删除
                  return doc('isDel').eq(false);
              }).filter(function(doc){  // 是否草稿
                  return doc('isDraft').eq(isDraft);
              });
    if(!_.isEmpty(userId) && !_.isUndefined(userId)){
        rsql = rsql.filter(function (doc) {
            return doc('userId').eq(userId);
        })
    }
    if(!_.isEmpty(eventId) && !_.isUndefined(eventId)){
        rsql = rsql.filter(function (doc) {
            return doc('eventId').eq(eventId);
        })
    }
    if(!_.isEmpty(type) && !_.isUndefined(type)){
        rsql = rsql.filter(function (doc) {
            return r.expr(type).contains(doc("type"));
            // return doc('type').eq(type);
        })
    }
    if(!_.isEmpty(sendStatus) && !_.isUndefined(sendStatus)){
        rsql = rsql.filter(function (doc) {
            return doc('sendStatus').eq(sendStatus);
        })
    }

    return rsql;
}


exports.getSmsEmailSendRecordById = function (id) {
    return SmsEmailSendRecord.get(id).run();
};

// ****** 根据邮件短信记录Id查询发送记录信息 ******
exports.getSendRecordByRecordId = function (recordId) {
    return SmsEmailSendRecord.getAll(recordId, {index:'recordId'}).run();
};

// ****** 保存邮件短信发送记录 ******
exports.saveSmsEmailRecord = function (data) {
    var newSmsEmailSendRecord = new SmsEmailSendRecord(data);
    newSmsEmailSendRecord.id  = nextId();
    return newSmsEmailSendRecord.save();
};

exports.getCountWithSendRecordByRecordId = function(recordId){
    return r.table("SmsEmailSendRecord").getAll(recordId, {
        index: "recordId"
    }).concatMap(function(doc) {
        return doc("receivers")
    }).filter(function(doc) {
        return doc("sendStatus").eq("sendSuccess")
    }).count().run();
}

exports.updateSmsEmailSendRecordById = function (id, update, options) {
    return SmsEmailSendRecord.get(id).update(update).run();
};

exports.updateSmsEmailSendRecord = function (id, update, options) {
    return SmsEmailSendRecord.get(id).update(update).run();
};

exports.deleteSmsEmailSendRecord = function (id, options) {
    return SmsEmailSendRecord.filter(
        r.row("id").eq(id)
    ).update({isDelete: true}).run();
};

exports.deleteSmsEmailSendRecordWithDraft = function (id, options) {
    return SmsEmailSendRecord.get(id).delete().execute();
};

// 根据邮件短信Id 获取发送邮件短信 sendStatus:默认返回全部
exports.getSmsEmailSendRecordByRecordId = function (recordId, sendStatus) {
    var sendRecordFilter = r.table('SmsEmailSendRecord').getAll(recordId, {index:'recordId'}).concatMap(function(doc) {
            return doc("receivers")
        });
    if(!_.isEmpty(sendStatus) && !_.isUndefined(sendStatus)){
        sendRecordFilter = sendRecordFilter.filter(function(doc) {
            return doc("sendStatus").eq(sendStatus)
        });
    }
    // logger.debug('sendRecordFilter: '+sendRecordFilter);
    return sendRecordFilter.run();

}

// 根据sendCloud回调 批量更新发送失败的邮件状态
// exports.callBackatchUpdate = function (params, options) {
//     var ids            = params.ids;
//     var receiverNumber = params.recipient;
//     var sendStatus     = params.sendStatus;
//     var describe       = params.describe;
//     // 根据提交发送的邮件记录的所有Id,当前发件人邮箱查询出所有接收成功的邮件
//     // console.log("callBack_ids: "+ids+" receiverNumber: "+receiverNumber+" sendStatus: "+sendStatus+" describe: "+describe);
//     var recordIds = ids.split(",");
//     var sesr      = SmsEmailSendRecord.filter(
//         function (doc) {
//             return r.expr(recordIds).contains(doc("id"));
//         }
//     ).update({
//         receivers: r.row("receivers").map(    //将所有接收成功的邮件更新邮件状态
//             function (receiver) {
//                 return r.branch(
//                     receiver("receiverNumber").eq(receiverNumber),
//                     receiver.merge({sendStatus: sendStatus, describe: describe}),
//                     receiver
//                 );
//             })
//     }).run();
//     return Promise.props(sesr);
// };
exports.callBackatchUpdate = function (params, options) {
    var id            = params.id;
    var receiverNumber = params.recipient;
    var sendStatus     = params.sendStatus;
    var describe       = params.describe;
    // 根据提交发送的邮件记录的所有Id,当前发件人邮箱查询出所有接收成功的邮件
    // console.log("callBack_ids: "+ids+" receiverNumber: "+receiverNumber+" sendStatus: "+sendStatus+" describe: "+describe);
    // var recordIds = ids.split(",");
    var sesr      = SmsEmailSendRecord.get(id).update({
        receivers: r.row("receivers").map(    //将所有接收成功的邮件更新邮件状态
            function (receiver) {
                return r.branch(
                    receiver("receiver").eq(receiverNumber),
                    receiver.merge({sendStatus: sendStatus, describe: describe}),
                    receiver
                );
            })
    }).run();
    return Promise.props(sesr);
};

// 调取sendCloud 邮件发送 根据结果更新邮件记录
// exports.reqApiBatchUpdate = function (params) {
//     var ids        = params.ids;
//     var sendStatus = params.sendStatus;
//     var update     = {sendCloudStatus: sendStatus};
//     if (sendStatus === fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL) {
//         update.receivers = r.row("receivers").map(
//             function (receiver) {
//                 return receiver.merge({sendStatus: sendStatus, describe: params.describe});
//             })
//     }
//     var sesr = SmsEmailSendRecord.getAll(ids).update(update).run();
//
//     return Promise.props(sesr);
// };

// ****** 调取发送结果更新邮件短信发送记录 ******
exports.reqApiBatchUpdate = function (params,isUpdateSendRecord, isUpdateRecord) {
    // logger.debug('params: '+JSON.stringify(params));
    var id         = params.id;
    var recordId   = params.recordId;
    var sendStatus = params.sendStatus;
    var describe   = params.describe;
    var S_R_Update = {receivers : r.row("receivers").map(
        function (receiver) {
            return receiver.merge({sendStatus: sendStatus, describe: describe});
        })
    };
    var R_Update = {sendStatus: sendStatus,describe:describe}
    var retMsg = {};
    if(isUpdateSendRecord === true){
        var sesr = SmsEmailSendRecord.get(id).update(S_R_Update).run();
        retMsg.sendRecord = sesr;
    }
    if(isUpdateRecord === true){
        var ser  = SmsEmailRecord.get(recordId).update(R_Update).run();
        retMsg.record = ser;
    }
    return Promise.props(retMsg);
};

// // ****** 调取发送结果更新邮件短信发送记录 ******
// exports.reqApiBatchUpdate = function (params) {
//     var id         = params.id;
//     var sendStatus = params.sendStatus;
//     var S_R_Update = {receivers : r.row("receivers").map(
//         function (receiver) {
//             return receiver.merge({sendStatus: sendStatus, describe: params.describe});
//         })
//     };
//     return SmsEmailSendRecord.get(id).update(S_R_Update).run();
// };
//
// // ****** 调取邮件发送结果更新邮件短信记录 ******
// exports.reqApiRecordUpdate = function (params) {
//     var recordId   = params.recordId;
//     var R_Update     = {sendStatus: sendStatus};
//     var ser = SmsEmailRecord.get(recordId).update(R_Update).run();
//
//     return ser;
// };

// 根据条件获取短信邮件记录
exports.getEmailAndSmsSendRecordWithPageIndex = function (params) {
    var totalCount = parseInt(params.total) || -1;// 总记录数
    var page       = parseInt(params.page) || 1;
    var limit      = parseInt(params.limit) || 10;
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "id";

    var recordFilter = SmsEmailSendRecord.filter({userId: params.userId, isDelete: false});
    if (!_.isEmpty(params.eventId)) {
        recordFilter = recordFilter.filter({eventId: params.eventId})
    }
    if (!_.isEmpty(params.type)) {
        recordFilter = recordFilter.filter({type: params.type})
    }
    if (!_.isEmpty(params.status)) {
        recordFilter = recordFilter.filter({sendCloudStatus: params.status})
    }
    if (!_.isEmpty(params.isDraft)) {
        if (params.isDraft === 'true') {   // 查询草稿
            recordFilter = recordFilter.filter({scheduledSendTimeType: fp.SEND_RECORD_TIME_TYPE.SEND_TIME_TYPE_DRAFT})
        }
    }
    if (!_.isEmpty(params.functionType)) {
        recordFilter = recordFilter.filter({functionType: params.functionType})
    }
    var items = recordFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = recordFilter.count().execute();
    }

    return Promise.props({items: items, count: totalCount});
};

// 获取所有计费短信邮件记录
exports.getAllRecordByParams = function (params, attributeNames, options) {
    attributeNames = _.isEmpty(attributeNames) ? _.keys(SmsEmailSendRecordFields) : attributeNames;
    return SmsEmailSendRecord.filter({
        userId  : params.userId,
        type    : params.type,
        isDelete: false
    }).filter(function (doc) {
        return r.expr(["sendImmediately", "timedTransmission"]).contains(doc("scheduledSendTimeType"));
    }).filter(function (doc) {
        return r.expr(params.chargeType).contains(doc("functionType"));
    }).pluck(attributeNames).execute();
};

// 添加短信邮件订单
exports.addSmsEmailOrder = function (data) {
    let newSmsEmailOrder = new SmsEmailOrder(data);
    newSmsEmailOrder.id  = nextId();
    return newSmsEmailOrder.save();
};

/**
 * 根据订单号查询短信邮件订单
 * @param orderNum           订单号
 * @param attributeNames     需要返回的属性名数组
 * @param options
 */
exports.getSmsEmailOrderByOrderNum = async function (orderNum, attributeNames, options) {
    attributeNames   = _.isEmpty(attributeNames) ? _.keys(SmsEmailOrderFields) : attributeNames;
    let orderInfoArr = await r.table("SmsEmailOrder").getAll(orderNum, {index: "orderNumber"}).pluck(attributeNames).run();
    return orderInfoArr[0];
};

exports.getSmsEmailOrderById = async function (id, attributeNames, options) {
    attributeNames = _.isEmpty(attributeNames) ? _.keys(SmsEmailOrderFields) : attributeNames;
    let orderInfo  = await r.table("SmsEmailOrder").get(id).pluck(attributeNames).run();
    return orderInfo;
};

exports.updateSmsEmailOrderById = function (id, udpate, options) {
    udpate.uTime = new Date();
    return SmsEmailOrder.get(id).update(udpate).run();
};

// 短信邮件订单的微信请求参数
exports.getWxSmsEmailOrderReqParams = function (req, orderInfo, WxPayConfig) {
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
        product_id      : orderInfo.id
    };
    return reqParams;
};

// 消费变更活动状态的消息
exports.consumeFinishedNotice = async function (msg, _channel) {
    try {
        let payloadStr = msg.content.toString();
        if (_.isEmpty(payloadStr)) { return; }

        let payload = JSON.parse(payloadStr);
        let type    = payload.type;     // 消费的类型
        let id      = payload.id;       // 主键id
        let utime   = payload.uTime;    // 修改时间

        if ('sendNotice' !== type) { return; }
        let recordInfo = await exports.getRecord(id);
        // 记录修改时间不相同: 记录已修改过
        if ((new Date(utime).toString()) !== (new Date(recordInfo.utime).toString())) { return _channel.ack(msg); }
        // 记录状态不为'待发送状态'
        if(recordInfo.sendStatus !== fp.RECORD_SEND_STATUS.SEND_STATUS_TO_BE_SENT){ return _channel.ack(msg); }
        // 将 sendStatus 改为 正在发送
        let recordInfo_update = await exports.updateRecord(id,{sendStatus: fp.RECORD_SEND_STATUS.SEND_STATUS_SENDING});
        // 生成发送邮件短信记录
        await NoticeC.__sendRecord(recordInfo_update);

        return _channel.ack(msg);
    } catch (err) {
        await Promise.delay(10000);// 防止无节制报错重传,这里设定一下延时,10秒重试
        logger.error('消费consumeFinishedNotice...出错了,错误信息是', err);
        return _channel.reject(msg, true);// 重传该消息给下一个订阅者
    }
};

// 在指定时间(毫秒)后发送邮件或短信
exports.produceSendNotice = async function(recordInfo, diffMilliseconds) {
    //测试固定为半小时
    // diffMilliseconds = 1 * 60 * 60 * 1000;
    let options         = {deliveryMode: 2, durable: true, headers: {"x-delay": diffMilliseconds}};
    let payload         = {type: 'sendNotice', id: recordInfo.id, uTime: recordInfo.utime};
    let delayedExchange = await Queue.createDelayedExchange(exchangeName, RabbitMQConfig.connUrl);
    Queue.addPublisher(delayedExchange, queueName, exchangeName, payload, options);
};
