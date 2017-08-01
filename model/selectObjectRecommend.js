var _         = require('lodash');
var Promise   = require('bluebird');
var myutil    = require('../util/util.js');
var thinky    = require('../util/thinky.js');
var validator = require('validator');
var type      = thinky.type;
var r         = thinky.r;
var nextId    = myutil.nextId;
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

var SelectObjectRecommendFields = {
    id          : type.string(),
    objectId    : type.string().required(),// 被推荐条目的主键id
    banner      : type.string().required(),// 被推荐条目的展示用到的图片地址
    objectType  : type.string()
                      .enum(
                          'bannerEvent', 'hotEvent', 'group', 'city', 'eventCategory')
                      .required(),
    displayOrder: type.number().integer().default(0),// 排序值,升序排序
    ctime       : type.date().default(function () { return new Date();}),   // 记录创建时间
    utime       : type.date().default(function () { return new Date();})   // 记录更新时间
};

var SelectObjectRecommend = thinky.createModel("SelectObjectRecommend", SelectObjectRecommendFields);

SelectObjectRecommend.ensureIndex("objectType");

exports.SelectObjectRecommendModel  = SelectObjectRecommend;
exports.SelectObjectRecommendFields = SelectObjectRecommendFields;

exports.add = function (data) {
    var obj = new SelectObjectRecommend(data);
    obj.id  = nextId();
    return obj.save();
};

exports.delete = function (id) {
    return SelectObjectRecommend.get(id).delete().execute();
};

exports.update = function (data) {
    var id     = data.id;
    data.utime = new Date();
    return SelectObjectRecommend.get(id).update(data).run();
};

exports.get = function (id) {
    return SelectObjectRecommend.get(id).run();
};

exports.getAllRecommend = function () {
    return SelectObjectRecommend.orderBy(r.asc("displayOrder")).run();
};

exports.getRecommendByObjectTypeAndPageIndex = function (params) {
    var objectType = params.objectType;
    var totalCount = parseInt(params.total) || -1;// 总记录数
    var page       = parseInt(params.page) || 1;
    var limit      = parseInt(params.limit) || 10;
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "displayOrder";

    var items = SelectObjectRecommend.getAll(objectType, {index: "objectType"})
                                     .orderBy(r.asc(orderBy))
                                     .slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = r.table("SelectObjectRecommend").getAll(objectType, {index: "objectType"})
                      .count().run();
    }

    return Promise.props({items: items, count: totalCount});
};

exports.getRecommendByObjectType = function (objectType) {
    return SelectObjectRecommend.getAll(objectType, {index: "objectType"}).orderBy('displayOrder');
};
