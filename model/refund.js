/**
 * Created by zhaohongyu on 2017/7/7.
 */

const _         = require('lodash');
const myutil    = require('../util/util.js');
const thinky    = require('../util/thinky.js');
const validator = require('validator');
const type      = thinky.type;
const r         = thinky.r;
const nextId    = myutil.nextId;
const fixParams = require('../util/fixParams');
const settings  = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

const RefundOrderFields = {
    id                   : type.string(),
    refundNumber         : type.string().required(),// 退款流水号
    refOrderNumber       : type.string().required(),// 关联的系统订单号
    thirdPartyOrderNumber: type.string().required(),// 关联的第三方支付系统订单号
    totalPrice           : type.number().required(),// 订单总金额,单位元
    refundFee            : type.number().required(),// 退款金额,单位元
    refundDesc           : type.string(),// 推广原因
    currency             : type.string()
                               .enum(
                                   fixParams.CURRENCY_NAME.YUAN, fixParams.CURRENCY_NAME.DOLLAR
                               ),// 币种单位
    channel              : type.string().enum(
        fixParams.REFUND_CHANNEL.REFUND_CHANNEL_ALIPAY,
        fixParams.REFUND_CHANNEL.REFUND_CHANNEL_PAYPAL,
        fixParams.REFUND_CHANNEL.REFUND_CHANNEL_WECHAT,
        fixParams.REFUND_CHANNEL.REFUND_CHANNEL_TRANSFER
    ).required(),// 退款通道
    type                 : type.string().enum(
        fixParams.REFUND_TYPE.REFUND_TYPE_TICKET
    ).required(),// 退款类型
    status               : type.string().enum(
        fixParams.REFUND_STATUS.REFUND_STATUS_APPLY,
        fixParams.REFUND_STATUS.REFUND_STATUS_SUCCESS,
        fixParams.REFUND_STATUS.REFUND_STATUS_FAIL
    ).required(),// 退款订单状态
    options              : [],// 参会者的签到码id数组,或者其他进行多次退款的依据字段
    cTime                : type.date().default(function () { return new Date();}),   // 记录创建时间
    uTime                : type.date().default(function () { return new Date();})   // 记录更新时间
};

const RefundOrder = thinky.createModel("RefundOrder", RefundOrderFields);

const _INDICES = ['refundNumber', 'refOrderNumber', 'thirdPartyOrderNumber', 'channel', 'type'];
_.each(_INDICES, function (index) {
    RefundOrder.ensureIndex(index);
});

exports.RefundOrderModel  = RefundOrder;
exports.RefundOrderFields = RefundOrderFields;

exports.add = function (data) {
    const obj = new RefundOrder(data);
    obj.id    = nextId();
    return obj.save();
};
