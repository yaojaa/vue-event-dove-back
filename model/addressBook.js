'use strict';

var _       = require('lodash');
var thinky  = require('../util/thinky.js');
var r       = thinky.r;
var type    = thinky.type;
var myutil  = require('../util/util.js');
var nextId  = myutil.nextId;
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
var Promise = require('bluebird');

var AddressBookTagsFields = {
    id          : type.string(),
    name        : type.string(),
    contactCount: type.number().integer(),
    uTime       : type.date().default(function () {return new Date();}),// 修改时间
    userId      : type.string().required()
};

var AddressBookTags = thinky.createModel("AddressBookTags", AddressBookTagsFields);

exports.AddressBookTags       = AddressBookTags;
exports.AddressBookTagsFields = AddressBookTagsFields;
AddressBookTags.ensureIndex("name");
AddressBookTags.ensureIndex("userId");

exports.addTag = function (params, options) {
    var tag = new AddressBookTags(params);
    tag.id  = nextId();
    return tag.save();
}

exports.getTagByName = function (name, userId, options) {
    return AddressBookTags.filter({name: name, userId: userId}).run();
}

exports.getTagCountByName = function (name, userId, options) {
    return AddressBookTags.filter({name: name, userId: userId}).count().execute();
}

exports.getTagByUserId = function (params, options) {
    var totalCount = parseInt(params.total) || -1;  // 总记录数
    var page       = parseInt(params.page) || 1;   // 第几页
    var limit      = parseInt(params.limit) || 10;  // 每页显示记录数
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "id";

    var items = AddressBookTags.getAll(params.userId, {index: 'userId'}).orderBy(r.desc(orderBy)).slice(skip, skip + limit).run();
    if (totalCount === -1) {
        totalCount = AddressBookTags.getAll(params.userId, {index: 'userId'}).count().execute();
    }
    return Promise.props({items: items, count: totalCount});
}
exports.updateTagById  = function (id, params, options) {
    return AddressBookTags.get(id).update(params).run();
}

exports.deleteTagById = function (id) {
    return AddressBookTags.get(id).delete().execute();
}

var AddressBookFields = {
    id      : type.string(),
    userId  : type.string().required(),
    email   : type.string().required(),
    name    : type.string().required(),
    phone   : type.string(),
    company : type.string(),
    position: type.string(),        // 职位
    location: type.string(),        // 所在地
    // tags可以只含有tag id
    tags    : [type.string()],
    uTime   : type.date().default(function () {return new Date();}),// 修改时间
    cTime   : type.date().default(function () {return new Date();}),// 创建时间
};

var AddressBook = thinky.createModel("AddressBook", AddressBookFields);

exports.AddressBook       = AddressBook;
exports.AddressBookFields = AddressBookFields;

const AddressBook_INDICES = ['email', 'name', 'userId'];
_.each(AddressBook_INDICES, function (index) {
    AddressBook.ensureIndex(index);
});

exports.addContact = function (contact) {
    var _contact = new AddressBook(contact);
    _contact.id  = nextId();
    return _contact.save();
}

exports.getContactByUserIdAndEmail = function (userId, email, options) {
    return AddressBook.getAll(userId, {index: "userId"}).filter({email: email}).run();
}

exports.updateContactByEmail = function (email, fields, options) {
    AddressBook.getAll(email, {index: 'email'}).update(fields).run();
}

exports.updateContactById = function (id, fields, options) {
    AddressBook.get(id).update(fields).run();
}

exports.getContactById = function (id, options) {
    return r.table("AddressBook").get(id).run();
}

exports.getContactByUserId = function (userId, options) {
    return AddressBook.getAll(userId, {index: "userId"}).run();
}

exports.getContactCountByEmail = function (email, options) {
    return r.table("AddressBook").filter({email: email}).count().run();
}

exports.deleteContactByEmail = function (email, options) {
    return AddressBook.getAll(email, {index: "email"}).delete().execute();
}

exports.deleteContactById = function (id, options) {
    return AddressBook.get(id).delete().execute();
}

exports.getContactCountByTagName = function (tagId) {
    return AddressBook.filter(function (doc) {
        return r.expr(doc("tags")).contains(tagId);
    }).count().execute();
}

exports.getAllContactByParamsWithPageIndex = function (params, options) {
    var totalCount = parseInt(params.total) || -1;  // 总记录数
    var page       = parseInt(params.page) || 1;   // 第几页
    var limit      = parseInt(params.limit) || 10;  // 每页显示记录数
    var skip       = ( page - 1 ) * limit;
    var orderBy    = params.orderBy || "id";

    var addressBookFilter = __jointAddressBookFilter(params);
    var items             = addressBookFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = addressBookFilter.count().execute();
    }

    return Promise.props({items: items, count: totalCount});
}

// 拼装搜索条件
function __jointAddressBookFilter(params) {

    var userId            = params.userId;
    var search            = params.search;
    var searchType        = params.searchType;
    var addressBookFilter = AddressBook;

    addressBookFilter = addressBookFilter.filter({userId: userId});

    switch (searchType) {
        case 'name':// 联系人名称
            addressBookFilter = addressBookFilter.filter({name: search});
            break;
        case 'email':// 邮箱
            addressBookFilter = addressBookFilter.filter({email: search});
            break;
        case 'phone':// 手机号
            addressBookFilter = addressBookFilter.filter({phone: search});
            break;
        default:
    }

    if (!_.isEmpty(params.tags)) {
        addressBookFilter = addressBookFilter.filter(function (doc) {
            return r.expr(doc("tags")).contains(params.tags);
        });
    }

    return addressBookFilter;
}

// 处理订单表中的参会者信息提取到联系人表中
exports.extractContactFromOrder = async function (newOrderInfo) {
    try {

        // 从参会者信息中提取联系人
        const contrastParams = ["email", "name", "phone", "company"];

        for (let attendeeInfo of newOrderInfo.attendees) {

            const collectInfo = attendeeInfo.collectInfo;
            let contact       = await exports.getContactByUserIdAndEmail(newOrderInfo.userId, collectInfo.email);

            if (_.isEmpty(contact)) {
                // 从订单中提取联系人,新增
                let addingContact = _.pick(collectInfo, contrastParams);
                _.merge(addingContact, {userId: newOrderInfo.userId});
                exports.addContact(addingContact);
            }

            if (!_.isEmpty(contact)) {
                // 从订单中提取联系人,修改,已经存在，比较是否需要更新
                let updateContact = {};
                _.each(contrastParams, function (contrastParam) {
                    if (collectInfo[contrastParam] !== contact[0][contrastParam]) {
                        updateContact[contrastParam] = collectInfo[contrastParam];
                    }
                });

                if (!_.isEmpty(updateContact)) {
                    _.merge(updateContact, {uTime: new Date()});
                    exports.updateContactById(contact[0].id, updateContact);
                }
            }
        }

    } catch (err) {
        logger.error('extractContactFromOrder...处理 orderId = ' + newOrderInfo.id + '时出错了,报错信息是:' + err.message);
    }
};
