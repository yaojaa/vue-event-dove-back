var _       = require('lodash');
var myutil  = require('../util/util.js');
var nextId  = myutil.nextId;
var thinky  = require('../util/thinky.js');
var type    = thinky.type;
var r       = thinky.r;
var Promise = require('bluebird');
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

var DiscountFields = {
    id                : type.string(),
    eventId           : type.string().required(),
    generationMode    : type.string().enum("random", "manualInput").required(),// 折扣码生成方式
    discountCode      : type.string(),// 优惠码
    discountType      : type.string().enum("fixed", "rate", "free").required(),// 优惠方式 fixed(优惠金额),rate(优惠折扣率),free(免费)
    discountTypeValue : type.number().integer().required(),// 优惠方式的值
    applyToAllTickets : type.boolean().required(),// 优惠范围,是否所有门票都能使用优惠码
    applyToTickets    : [type.string()],// 优惠范围,即哪些票可以使用此优惠码
    maxUseCount       : type.number().integer().required(),// 最多使用次数,-1为无限制次数
    discountExpiryDate: type.string().enum("any", "custom").required(),// 优惠码有效期 any(任意时间都可以使用),custom(自定义有效期时间范围)
    startTime         : type.date(),// 优惠码有效期开始时间
    endTime           : type.date(),// 优惠码有效期结束时间
    isDeleted         : type.boolean().default(false),// 优惠码是否已删除
    ctime             : type.date().default(function () { return new Date();}),// 记录创建时间
    utime             : type.date().default(function () { return new Date();})// 记录更新时间
};

var Discount = thinky.createModel("Discount", DiscountFields);

const DISCOUNT_INDICES = ['eventId', 'isDeleted', 'discountCode', 'generationMode'];
_.each(DISCOUNT_INDICES, function (index) {
    Discount.ensureIndex(index);
});

exports.DiscountModel  = Discount;
exports.DiscountFields = DiscountFields;

exports.addDiscount = function (data) {
    var newDiscount = new Discount(data);
    newDiscount.id  = nextId();
    return newDiscount.save();
};

exports.updateDiscountById = function (id, update, options) {
    update.utime = new Date();
    return Discount.get(id).update(update).run();
};

exports.deleteDiscount = function (discountId, options) {
    return Discount.get(discountId).delete().execute();
};

exports.getDiscount = function (discountId, options) {
    return Discount.get(discountId).run();
};

exports.getDiscountByCode = function (code, options) {
    return Discount.getAll(code, {index: "discountCode"}).run();
};

exports.getDiscountWithIn = function (discountIds, options) {
    return Discount.filter(
        function (doc) {
            return r.expr(discountIds).contains(doc("id"));
        }
    ).run();
};

exports.getEventAllDiscounts = function (params) {
    var eventId    = params.eventId;
    var totalCount = parseInt(params.total) || -1;// 总记录数
    var page       = parseInt(params.page) || 1;
    var limit      = parseInt(params.limit) || 10;
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "id";

    var items = Discount.getAll(eventId, {index: "eventId"})
                        .filter({
                            isDeleted: false
                        }).orderBy(r.desc(orderBy))
                        .slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = r.table("Discount")
                      .getAll(eventId, {index: "eventId"})
                      .filter({
                          isDeleted: false
                      })
                      .count().run();
    }

    return Promise.props({items: items, count: totalCount});
};

/**
 * 计算折扣码的总使用数量
 * @param orderList 订单列表
 * @param discount 折扣码对象
 * @returns {*}
 * @private
 */
exports.getDiscountTotalUsedCount = function (orderList, discount) {
    var totalUsedCount = _.reduce(orderList, function (sum1, orderInfo) {
        return sum1 + _.reduce(orderInfo.orderDetails, function (sum2, orderDetail) {
                var isDiscountCodeEqual = (discount.discountCode === orderDetail.discountCode);
                return isDiscountCodeEqual ? (sum2 + orderDetail.ticketCount) : sum2;
            }, 0);
    }, 0);
    return totalUsedCount;
};
