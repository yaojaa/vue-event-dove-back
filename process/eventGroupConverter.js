var _ = require('underscore'),
    datautils = require("./datautils"),
    f2n = datautils.f2n,
    loc2hash = datautils.loc2hash,
    locale2Country = datautils.locale2Country;

var fs = require("fs");
var Promise = require('bluebird');
var mysql = require('promise-mysql');
var r = require('rethinkdb');
var fp = require('../util/fixParams.js');
var config = require("./config");
var mysqlConfig = config.mysqlConfig;
var moment     = require('moment');

// 转换 活动基础数据
function __eventGroupConverter(oldMembership) {
    var newMembership = {};
    newMembership.id = oldMembership.eventGroupId.toString();
    newMembership.name = oldMembership.groupName;
    newMembership.logo = oldMembership.groupIcon;
    newMembership.descripiton = oldMembership.groupDesc;
    newMembership.userId = oldMembership.loginId.toString();

    newMembership.subDomain = oldMembership.subdomainName;
    // S 挂起 A 正常 U 过期 P 未缴费
    newMembership.status = oldMembership.state === 'S' ? 'inactive' : 'normal';
    newMembership.count = oldMembership.joinCount;
    newMembership.notify = {    // 原群组中未有该会员到期提醒设置
        needNotify: false,
        beforeDays: 0,
        notifyType: 'none'
    }

    newMembership.ctime = _.isNull(oldMembership.createTime)? null :moment(oldMembership.createTime).add(8,'h').toDate();
    // 原数据无更新时间
    newMembership.utime = _.isNull(oldMembership.createTime)? null :moment(oldMembership.createTime).add(8,'h').toDate();

    // console.log("newEvent_base: "+JSON.stringify(newEvent));

    return newMembership;
};

// 转换 会员组会费设置
var __convertDuesSetting = Promise.coroutine(function* (connection, eventGroupId, newMembership) {
    var duesQuery = 'SELECT * from EventGroupPayment where eventGroupId=' + eventGroupId;
    var duesSetting = yield connection.query(duesQuery);

    if(!_.isEmpty(duesSetting)){
        newMembership.duesType = __getDuesType(duesSetting[0].payType);
        newMembership.duesCurrency = __getDuesCurrency(duesSetting[0].unitType);
        newMembership.paymentAccountId = (duesSetting[0].unitType === '$') ? duesSetting[0].paymentId.toString() : '' ;
        newMembership.duesAmount = _.isNull(duesSetting[0].fee) ? 0 : duesSetting[0].fee;
        newMembership.duesNotice = _.isEmpty(duesSetting[0].payDesc) ? '' : duesSetting[0].payDesc;
    }

    // console.log("newTickets: " + JSON.stringify(newTickets))
    return newMembership;
});

// 转换 收费 币种
function __getDuesCurrency(unitType) {
    var duesCurrency = '';
    if(unitType === '$'){
        duesCurrency = fp.CURRENCY_NAME.DOLLAR;
    }else if(unitType === '¥'){
        duesCurrency = fp.CURRENCY_NAME.YUAN;
    }

    return duesCurrency;
}

// 转换 会费收费方式
function __getDuesType(payType) {
    var duesType = fp.MEMBER_CONST.DUES_TYPE_FREE;
    // 0 不收费 1 月 2 季 3 年  4 自然年
    if(payType === 1){
        duesType = fp.MEMBER_CONST.DUES_TYPE_MONTH;
    }else if(payType === 2){
        duesType = fp.MEMBER_CONST.DUES_TYPE_SEASON;
    }else if(payType === 3 || payType === 4){
        duesType = fp.MEMBER_CONST.DUES_TYPE_YEAR;
    }

    return duesType;
}

// 转换 活动采集项信息
var __convertCollectionItems = Promise.coroutine(function* (connection, eventGroupId) {
    var collectItems = [];
    var formFieldQuery = 'SELECT f.* from `GroupFormField` f left join `GroupRegForm` g on f.groupFormId = g.groupFormId where 1=1 AND g.eventGroupId='+ eventGroupId
    var formFields = yield connection.query(formFieldQuery);

    if(!_.isEmpty(formFields)){
        _.each(formFields, function (formField) {
            var registerField= _.find(__registerFields,{fieldId : formField.fieldId});
            var showValue = formField.showValue;
            // 去掉最后一个',' 逗号
            if(!_.isEmpty(showValue)){
                showValue = (showValue.substring(showValue.length-1)===',') ? showValue.substring(0,showValue.length-1) : showValue;
            }
            var item = {
               itemId      : formField.groupFormFieldId.toString(),
               itemName    : formField.groupFormFieldId.toString(),
               displayName : formField.showName,
               fieldType   : registerField.type,
               regexp      : registerField.regexp,
               maxFileSize : formField.maxlength,
               isUnique    : false,    // 原会员组采集项 未有唯一项设置
               displayOrder: formField.sort,
               isDeleted   : false,                               // 是否已删除, 原数据是直接删除
               isRequired  : formField.required,    // 是否必填  0: 否 1: 是
               itemValues  : _.isEmpty(showValue)?'':showValue.split(',')
           };
           collectItems.push(item);
        });
    }

    // console.log("newEvent_CollectionItems: "+JSON.stringify(newEvent));
    return collectItems;
});

function readAndConvert() {
    Promise.coroutine(function*() {
        try {
            console.log('trying to connnect rethinkdb...');
            // rConn = yield r.connect( {host: 'localhost', port: 28015, db:'eventdove'});
            rConn = yield r.connect(config.rdbConfig);

            try {
                yield r.dbCreate("eventdove").run(rConn);
                yield r.db('eventdove').tableCreate('Membership').run(rConn);
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
                var query = 'SELECT * from EventGroup limit ' + batchSize + ' offset ' + offset;
                console.log('query: ', query);

                var rows = yield connection.query(query);

                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var oldMembership = rows[i];
                    var newMembership = __eventGroupConverter(oldMembership);

                    try {
                        // add 添加会员注册采集信息
                        newMembership.memberInfoCollections = yield __convertCollectionItems(connection, oldMembership.eventGroupId);

                        // add 活动会费设置
                        newMembership = yield __convertDuesSetting(connection, oldMembership.eventGroupId, newMembership);

                        // console.log("newMembership is: " + JSON.stringify(newMembership));
                        yield r.table('Membership').insert(newMembership).run(rConn);

                    } catch (err) {
                        console.log('convert newMembership fail:' + newMembership);
                        console.log('err:' + err);
                    }
                }
                // break; //TODO: remove this after testing
            }

            console.log('done');
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


// 系统 活动采集项 数据 EventRegForm表数据
var __registerFields = [
        {"fieldId": 1,"fieldName": "firstName","showName": "名","type": "text","maxlength": "30","regexp": "^[a-zA-Z\\u4e00-\\u9fa5\\s\\-]+$"},
        {"fieldId": 2,"fieldName": "lastName","showName": "姓", "type": "text","maxlength": "30","regexp": "^[a-zA-Z\\u4e00-\\u9fa5\\s\\-]+$"},
        {"fieldId": 3,"fieldName": "emailAddress", "showName": "邮箱","type": "text","maxlength": "100","regexp": "(?:\\w[-._\\w]*\\w@\\w[-._\\w]*\\w\\.\\w{2,5}$)"},
        {"fieldId": 4,"fieldName": "companyOrorganization", "showName": "公司/机构", "type": "text", "maxlength": "80","regexp": ""},
        {"fieldId": 5,"fieldName": "department", "showName": "部门", "type": "text", "maxlength": "50","regexp": ""},
        {"fieldId": 6,"fieldName": "post", "showName": "职务", "type": "text", "maxlength": "80","regexp": ""},
        {"fieldId": 7,"fieldName": "jobTitle", "showName": "职称", "type": "text", "maxlength": "80", "sort": "7", "source": "0", "fieldType": "0", "regexp": ""},
        {"fieldId": 8,"fieldName": "address","showName": "地址", "type": "text", "maxlength": "120", "sort": "8", "source": "0", "fieldType": "0", "regexp": ""},
        {"fieldId": 9,"fieldName": "cellPhone", "showName": "手机", "type": "text", "maxlength": "20", "sort": "9", "source": "0", "fieldType": "0", "regexp": "^[0-9－-]+\\d*$"},
        {"fieldId": 10,"fieldName": "fax", "showName": "传真", "type": "text", "maxlength": "20", "regexp": "^[0-9－-]+\\d*$"},
        {"fieldId": 11,"fieldName": "zipCode", "showName": "邮编", "type": "text", "maxlength": "6","regexp": "^[0-9]+\\d*$"},
        {"fieldId": 12,"fieldName": "workPhone", "showName": "公司电话", "type": "text", "maxlength": "20","regexp": "^[0-9－-]+\\d*$"},
        {"fieldId": 13, "fieldName": "website", "showName": "公司网站", "type": "text", "maxlength": "80","regexp": "^[0-9a-zA-Z.:/]+$"},
        {"fieldId": 14,"fieldName": "blog", "showName": "个人博客", "type": "text", "maxlength": "80", "regexp": "^[0-9a-zA-Z.:/]+$"},
        {"fieldId": 15,"fieldName": "homePhone", "showName": "家庭电话", "type": "text", "maxlength": "20","regexp": "^[0-9－-]+\\d*$"},
        {"fieldId": 16,"fieldName": "homeAddress", "showName": "家庭住址", "type": "text", "maxlength": "80","regexp": ""},
        {"fieldId": 17,"fieldName": "gender", "showName": "性别", "type": "select", "maxlength": "10","regexp": ""},
        {"fieldId": 18, "fieldCategoryId": "1", "fieldName": "age", "showName": "年龄", "type": "text", "maxlength": "3","regexp": "^[0-9]+\\d*$"},
        {"fieldId": 20,"fieldName": "userName", "showName": "姓名", "type": "text", "maxlength": "100","regexp": ""},
        {"fieldId": 21, "fieldName": "text", "showName": "普通文本框", "type": "text", "maxlength": "100", "sort": "21", "source": "1", "fieldType": "0", "regexp": ""},
        {"fieldId": 22,"fieldName": "textarea", "showName": "多行文本框", "type": "textarea", "maxlength": "1000","regexp": ""},
        {"fieldId": 23,"fieldName": "date", "showName": "日期选择", "type": "date", "maxlength": "16", "sort": "23", "source": "1", "fieldType": "0", "regexp": ""},
        {"fieldId": 24,"fieldName": "emailAd", "showName": "邮件地址", "type": "email", "maxlength": "30", "sort": "24", "source": "1", "fieldType": "0", "regexp": ""},
        {"fieldId": 25,"fieldName": "contactInfo", "showName": "联系方式", "type": "contactInfo", "maxlength": "20","regexp": "^[0-9－-]+\\d*$"},
        {"fieldId": 26,"fieldName": "radio", "showName": "单选值", "type": "radio", "maxlength": "50", "sort": "26", "source": "1", "fieldType": "0", "regexp": ""},
        {"fieldId": 27,"fieldName": "checkbox", "showName": "多选值", "type": "checkbox", "maxlength": "50", "sort": "27", "source": "1", "fieldType": "0", "regexp": ""},
        {"fieldId": 28,"fieldName": "select", "showName": "下拉选择框", "type": "select", "maxlength": "50", "sort": "28", "source": "1", "fieldType": "0", "regexp": ""},
        {"fieldId": 29,"fieldName": "number", "showName": "数值", "type": "numerical", "maxlength": "20", "sort": "29", "source": "1", "fieldType": "0", "regexp": "^[0-9]+\\d*$"},
        {"fieldId": 30,"fieldName": "url", "showName": "网址", "type": "url", "maxlength": "100", "sort": "30", "source": "1", "fieldType": "0", "regexp": ""},
        {"fieldId": 31,"fieldCategoryId": "", "fieldName": "country", "showName": "国家", "type": "country", "maxlength": "100","regexp": "^[a-zA-Z\\u4e00-\\u9fa5\\s\\-]+$"},
        {"fieldId": 7895,"fieldName": "file", "showName": "文件", "type": "file", "maxlength": "300", "sort": "32", "source": "1", "fieldType": "1", "regexp": ""}
    ];

