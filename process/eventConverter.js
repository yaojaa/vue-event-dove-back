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
var myutil     = require('../util/util.js');

// 转换 活动基础数据
function __eventConverter(oldEvent) {
    var newEvent = {};
    newEvent.id = oldEvent.eventId.toString();
    newEvent.title = oldEvent.eventTitle;
    newEvent.content = [{"content":oldEvent.content,"label": "活动详情"}];
    var logoUrl = '';
    if(!_.isEmpty(oldEvent.logoUrl) && !_.isUndefined(oldEvent.logoUrl)){
        logoUrl = 'http://www.eventdove.com' + oldEvent.logoUrl;
    }
    newEvent.logoUrl = logoUrl;
        // newEvent.logoUrl = _.isEmpty(oldEvent.logoUrl)oldEvent.logoUrl ? :'http://eventdove.com';

    // 随机获取一张类别为'其它'的图片
    newEvent.bannerUrl = __getEventCategorieImg();
    newEvent.thumbnail = newEvent.bannerUrl;     //活动缩略图
    newEvent.mobileBannerUrl = newEvent.bannerUrl;

    newEvent.startTime = _.isNull(oldEvent.startTimestamp)? null : moment(oldEvent.startTimestamp).add(8,'h').toDate();
    newEvent.endTime = _.isNull(oldEvent.endTimestamp)? null : moment(oldEvent.endTimestamp).add(8,'h').toDate();
    newEvent.pubTime = _.isNull(oldEvent.publishTimestamp)? null : moment(oldEvent.publishTimestamp).add(8,'h').toDate();
    newEvent.isPublic = (oldEvent.eventType === 0);  // 是否公开 0: 是 1/2: 否
    newEvent.smsNotice = oldEvent.smsTicket === 1;   //0 表示不用短信发送票 1 表示发送票
    newEvent.customSmsContent = '您参加'+newEvent.title+'的签到码是 #签到码#。详见 #电子票#';
    newEvent.userId = _.isNull(oldEvent.loginId) ? '' : oldEvent.loginId.toString();

    // 将原活动类型全都默认为'其它'(6277457483283959808) 原表为 EventCategory 根据eventCategoryId 查询
    newEvent.categories = ['6277457483283959808'];
    newEvent.keyWords = oldEvent.eventTags.split(' ');
    //组装分词
    newEvent = __eventFenCiConverter(newEvent);
    newEvent.status =__getEventStatus(oldEvent.pubStatus);
    newEvent.domainName = oldEvent.subdomainName;

    newEvent.zipCode = oldEvent.zipCode;
    newEvent.detailedAddress = oldEvent.eventAddress;
    newEvent.lat = f2n(oldEvent.lat);
    newEvent.lng = f2n(oldEvent.lng);
    // 0: 关联city 1：手动输入(自定义地址) 2：线上活动
    newEvent.onlineAddress = oldEvent.addressType === 2;
    newEvent.geohash = loc2hash(newEvent.lat, newEvent.lng);
    newEvent.isSelfRefundable = false;    // 是否开启用户自主退票

    newEvent.browseCount = 0;    // 活动浏览次数
    newEvent.userBrowseCount = 0; // 活动浏览用户数
    newEvent.audited = true;      // 该条记录是否已经审计过
    newEvent.auditNotes = '';     // 审核被拒绝时填写的被拒原因
    newEvent.ctime = _.isNull(oldEvent.createTimestamp)? null :moment(oldEvent.createTimestamp).add(8,'h').toDate();
    newEvent.utime = _.isNull(oldEvent.modifyTimestamp)? null :moment(oldEvent.modifyTimestamp).add(8,'h').toDate();

    // console.log("newEvent_base: "+JSON.stringify(newEvent));

    return newEvent;
};

// 转换 分词
function __eventFenCiConverter(newEvent) {
    var title = newEvent.title;

    // 对查询标题进行分词
    if (!_.isEmpty(title) && !_.isUndefined(title)) {
        newEvent.breakUpTitle2 = __getBreakUpAll(2, title);
        newEvent.breakUpTitle3 = __getBreakUpAll(3, title);
    };

    return newEvent;
};

// 将字符串进行分词
function __getBreakUpAll(num, title) {
    // 区分中文字符和英文字符 将每个汉字拆分成数组
    var chineseRegex = /[^\x00-\xff]/g;       // 校验是否是中文
    var strLength = title.replace(chineseRegex,"**").length;
    var title_cn_str = '';
    for(var i = 0;i < strLength;i++) {
        var singleChar = title.charAt(i).toString();
        if(singleChar.match(chineseRegex) != null) { // 为中文字符
            title_cn_str += ','+singleChar+',';
        }else {  // 非中文字符
            title_cn_str += singleChar;
        }
    }
    // 将中文字符截成数组并去除空值
    var title_cn_arr = _.compact(title_cn_str.split(","));
    var title_arr = [];  //每个汉字及英文单词拆分成的数组

    // 将每个英文单词拆分成数组
    for(var j = 0; j<title_cn_arr.length; j++ ){
        var title_en_str = title_cn_arr[j];
        var title_en_arr = _.compact(title_en_str.split(' '));
        if(title_en_arr.length > 1){
            for(var m =0; m<title_en_arr.length; m++){
                title_arr.push(title_en_arr[m]);
            }
        }else{
            title_arr.push(title_cn_arr[j]);
        }
    }
    // 按需求进行分词分词并去重
    var result = [];
    for(var m = 0, len = title_arr.length;  m < title_arr.length; m++){
        var end = m+num;
        var transition = title_arr.slice(m,end).join('');
        result.push(transition);
        if(end >= len){
            break;
        }
    }

    return _.uniq(result);
};
// 转换 票
var __convertTickets = Promise.coroutine(function* (connection, eventId) {
    var ticketQuery = 'SELECT * from Ticket where eventId=' + eventId;
    var oldTickets = yield connection.query(ticketQuery);

    var newTickets = [];
    for(var i=0; i<oldTickets.length; i++){
        var newTicket = {};
        newTicket.ticketId = oldTickets[i].ticketId.toString();
        newTicket.name = oldTickets[i].ticketName;
        newTicket.describe = oldTickets[i].ticketDescription;
        newTicket.needAudit = (oldTickets[i].needAudit === 1);
        //1: 票价不包含服务费:price+fee 2: 票价包含服务费:price+fee
        newTicket.defaultPrice = oldTickets[i].price + oldTickets[i].fee;
        newTicket.startSalesTime = _.isNull(oldTickets[i].startSalesTime)? null : moment(oldTickets[i].startSalesTime).add(8,'h').toDate();
        newTicket.endSalesTime = _.isNull(oldTickets[i].endSalesTime)? null : moment(oldTickets[i].endSalesTime).add(8,'h').toDate();
        newTicket.totalCount = oldTickets[i].ticketCount;
        // 0:未开始售票,1:售票中,2:暂停售票,3:己售完,4:售票结束,5:活动结束
        newTicket.status = (oldTickets[i].ticketStatus >= 2) ? 'deleted' : 'normal';
        newTicket.minCount = oldTickets[i].minCountPerOrder;
        newTicket.maxCount = oldTickets[i].maxCountPerOrder;
        newTicket.isServiceFeeInclude = true;
        newTicket.ticketServiceFee = oldTickets[i].fee;

        // 会员票设置
        var newTicket = yield __conversionMemberTicket(connection, oldTickets[i].ticketId, newTicket);

        newTicket.isAllowGroupPurchase = false;     // 是否允许团购
        newTicket.isRefundable         = false;     // 该门票是否能退票,默认不能,值为false

        newTickets.push(newTicket);
    };

    // console.log("newTickets: " + JSON.stringify(newTickets))
    return newTickets;
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

// 转换 活动采集项信息
var __convertCollectionItems = Promise.coroutine(function* (connection, eventId, newEvent) {
    var collectItems = [];
    var isCollectAttendees = false;    // 默认为 收集参会者信息
    var regFormQuery = 'SELECT * from EventRegForm where eventId=' + eventId;
    var regForms = yield connection.query(regFormQuery);

    if(!_.isEmpty(regForms)){
        isCollectAttendees = regForms[0].formType === 3;  //2收集购票人信息,  3收集参会者信息
    };
    var items = [
            {'itemName':'name','displayName':'姓名','rules': {'maxLength': 8,'minLength': 2,'required': true}},
            {'itemName':'mobile','displayName':'手机','rules': {'isMobile': true,'required': true}},
            {'itemName':'email','displayName':'邮箱','rules': {'isEmail': true,'required': true}}
        ];
    _.each(items, function (item) {
        var collectItem = {
                "attr": {},
                "description": "",
                "displayName": item.displayName,
                "fieldType": "text",
                "isDeleted": false,
                "isDisplayDescription": false,
                "isRequired": true,
                "itemId": myutil.nextId(),
                "itemName": item.itemName,
                "itemValues": [],
                "rules": item.rules,
                "value": ""
           };
        collectItems.push(collectItem);
    });
    newEvent.collectItems = collectItems;
    newEvent.isCollectAttendees = isCollectAttendees;
    // console.log("newEvent_CollectionItems: "+JSON.stringify(newEvent));
    return newEvent;
});

// var __convertCollectionItems = Promise.coroutine(function* (connection, eventId, newEvent) {
//     var collectItems = [];
//     var isCollectAttendees = false;    // 默认为 收集参会者信息
//     var regFormQuery = 'SELECT * from EventRegForm where eventId=' + eventId;
//     var regForms = yield connection.query(regFormQuery);
//
//     if(!_.isEmpty(regForms)){
//         isCollectAttendees = regForms[0].formType === 3;  //2收集购票人信息,  3收集参会者信息
//         var formFieldQuery = 'SELECT * from FormField where eventFormId=' + regForms[0].eventFormId;
//         var formFields = yield connection.query(formFieldQuery);
//         _.each(formFields, function (formField, i) {
//             var registerField= _.find(__registerFields,{fieldId : formField.fieldId});
//             var showValue = formField.showValue;
//             if(!_.isEmpty(showValue)){
//                 showValue = (showValue.substring(showValue.length-1)===',') ? showValue.substring(0,showValue.length-1) : showValue;
//             }
//             var item = {
//                itemId      : formField.formFieldId.toString(),
//                itemName    : formField.formFieldId.toString(),
//                displayName : formField.showName,
//                fieldType   : registerField.type,
//                //regexp      : formField.fieldRegexp,
//                regexp      : registerField.regexp,
//                maxFileSize : formField.maxlength,
//                isUnique    : (formField.allowDuplicate === 1),    // 是否唯一 0: 否 1: 是
//                displayOrder: formField.sort,
//                isDeleted   : false,                               // 是否已删除, 原数据是直接删除
//                isRequired  : formField.required === 1,    // 是否必填  0: 否 1: 是
//                itemValues  : __convertItemValues(formField.showName,showValue)
//            };
//            collectItems.push(item);
//         });
//         newEvent.collectItems = collectItems;
//     }
//     newEvent.isCollectAttendees = isCollectAttendees;
//
//     // console.log("newEvent_CollectionItems: "+JSON.stringify(newEvent));
//     return newEvent;
// });

// 转换 采集项为多选类型值
// function __convertItemValues(showName, showValues) {
//     var itemValues = [];
//     if(!_.isEmpty(showValues)){
//         var showValueArr = showValues.split(',');
//         _.each(showValueArr, function (showValue) {
//             var itemValue = {};
//             var isDefault = false;
//             if(showValue === showName){
//                 isDefault = true;
//             }
//             itemValue.isDefault = isDefault;
//             itemValue.option = showValue;
//             itemValue.value = showValue;
//
//             itemValues.push(itemValue);
//         });
//     }
//     return itemValues;
// }

// 转换发票设置
var __convertInvoiceSetting = Promise.coroutine(function* (connection, eventId, newEvent) {
    var isProvideInvoice = false;    // 是否提供发票
    var invoiceSetting = {};         // 发票设置

    var configSettingQuery = 'SELECT * from ConfigSetting where configCode="EVENT_ORDER_INVOICE" and eventId=' + eventId;
    var configSettings = yield connection.query(configSettingQuery);

    if(!_.isEmpty(configSettings)){
        // 判断是否支持发票 0:不支持 1:支持
        if(configSettings[0].configValue === '1'){
            isProvideInvoice = true;
            var invoiceTypes   = [];     // 发票类型
            var deliverMethods = [];     // 发票领取方式

            // 服务项目 "," 分隔
            var serviceItems = configSettings[0].configShowValue.split(',');
            // 转换发票类型: 是否支持快递 0：否 1：是
            configSettings[0].expressStatus === 1 ? deliverMethods.push('express') :'';

            // configDetail : {"senceFlag":"0","fapiaoType":"0,1"}
            if(_.isEmpty(configSettings[0].configDetail)){
                // 为空: senceFlag = 0 fapiaoType = 0
                invoiceTypes.push(fp.INVOICE_TYPE.INVOICE_TYPE_NORMAL);
            }else{
                var configDetailJson = JSON.parse(configSettings[0].configDetail);
                // 转换 发票类型 0：普通 1：专用发票 2：通用机打发票
                invoiceTypes = _.map(configDetailJson.fapiaoType.split(','),function (type) {
                    return type === 1 ? fp.INVOICE_TYPE.INVOICE_TYPE_SPECIAL : fp.INVOICE_TYPE.INVOICE_TYPE_NORMAL
                });
                // 转换发票类型: 是否支持现场领取 0：否 1：是
                configDetailJson.senceFlag === 1 ? deliverMethods.push('onsite') : '';
            }
            invoiceSetting.type          = _.uniq(invoiceTypes);
            invoiceSetting.serviceItems  = serviceItems;
            invoiceSetting.taxPoint      = 0;
            //领取方式为空 默认为 现场领取
            _.isEmpty(deliverMethods) ? deliverMethods.push('onsite') : '';
            invoiceSetting.deliverMethod = deliverMethods;
            invoiceSetting.deliverFee    = 0;
            invoiceSetting.isSplitable   = false;
        }
    }
    newEvent.isProvideInvoice = isProvideInvoice;
    newEvent.invoiceSetting   = invoiceSetting;

    // console.log("newEvent_InvoiceSetting: "+JSON.stringify(newEvent));
    return newEvent;
});

// 转换 活动服务费设置
var __convertFees = Promise.coroutine(function* (connection, eventId, newEvent) {
    var feesQuery = 'SELECT * from EventFee where eventId=' + eventId;
    var fees = yield connection.query(feesQuery);
    var basePrice = 0;
    var percent = 0;
    var maxFee = 0;
    if( !_.isEmpty(fees) ) {
        basePrice = fees[0].basePrice;
        percent   = fees[0].ticketPercent;
        maxFee    = fees[0].maxFee;
    }
    newEvent.basePrice = basePrice;
    newEvent.percent   = percent;
    newEvent.maxFee    = maxFee;

    // console.log("newEvent_Fees: "+JSON.stringify(newEvent));
    return newEvent;
});

// 转换 活动免费邮件额度
var __convertEmailBalance = Promise.coroutine(function* (connection, eventId,loginId) {
    // 根据活动Id查询 EventEmailNum 表获取活动免费邮件额度
    var emailBalance = 0;
    var eventEmailNumQuery = 'SELECT * from EventEmailNum where eventId=' + eventId;
    var eventEmailNums = yield connection.query(eventEmailNumQuery);
    if(!_.isEmpty(eventEmailNums) ) {
        emailBalance = eventEmailNums[0].usedCount + eventEmailNums[0].canUseCount;
    }else{
        // 根据用户Id查询 EdLoginRole 表 获取用户权限等级, 该表等级只存有 VIP(0),专业版(1)  0:200,1:200,2:100
        var edLoginRoleQuery = 'SELECT * from EdLoginRole where loginId=' + loginId;
        var edLoginRoles = yield connection.query(edLoginRoleQuery);

        emailBalance = _.isEmpty(edLoginRoles) ? 100 : 200;
    }
    // console.log("emailBalance: "+emailBalance);
    return emailBalance;
});

// 转换 活动币种、支付方式、收款帐户
var __convertPaymentMethodAndIds = Promise.coroutine(function* (connection, eventId, priceUnitId, paymentId, newEvent) {

    var paymentPriceUnit = fp.CURRENCY_NAME.YUAN;
    var paymentPriceUnitSign = fp.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_YUAN;
    var paymentMethod = [];
    var paymentAccountIds = [];

    if(priceUnitId === 3){    // 币种为美元
        paymentPriceUnit = fp.CURRENCY_NAME.DOLLAR;
        paymentPriceUnitSign = fp.PAYMENT_PRICE_UNIT_SIGN.PAYMENT_PRICE_UNIT_SIGN_DOLLAR;
        paymentMethod.push(fp.PAYMENT_METHOD.PAYMENT_METHOD_PAYPAL);
        // 查询 Payment 表 得到 paypal 的收款帐户Id
        _.isNull(paymentId) ? '' : paymentAccountIds.push(paymentId.toString());

    }else{
        // 人民币支付则支持支付宝,微信,银联支付
        paymentMethod.push(fp.PAYMENT_METHOD.PAYMENT_METHOD_ALIPAY);
        paymentMethod.push(fp.PAYMENT_METHOD.PAYMENT_METHOD_WECHAT);
        paymentMethod.push(fp.PAYMENT_METHOD.PAYMENT_METHOD_EBANK);
    }
    // 判断是否支持 现场缴费 0:不支持 1:支持
    var configSettingQuery = 'SELECT * from ConfigSetting where configCode="OFFLINE_PAY_SUPPORT_ON_SITE" and eventId=' + eventId;
    var configSettings = yield connection.query(configSettingQuery);
    if(!_.isEmpty(configSettings)){
        configSettings[0].configValue === 0 ? '' : paymentMethod.push(fp.PAYMENT_METHOD.PAYMENT_METHOD_ONSITE);
    }

    // 判断是否支持银行转帐(可能绑定多张)
    var eopQuery = 'SELECT * from EventOfflinePayment where eventId=' + eventId;
    var eolPayments = yield connection.query(eopQuery);

    if(!_.isEmpty(eolPayments)){
        // var opQuery = 'SELECT * from OfflinePayment where offlinePaymentId=' + eolPayment[0].offlinePaymentId;
        paymentMethod.push(fp.PAYMENT_METHOD.PAYMENT_METHOD_TRANSFER);
        _.each(eolPayments, function (eolPayment) {
            paymentAccountIds.push(eolPayment.offlinePaymentId.toString());
        });
    }
    newEvent.paymentPriceUnit     = paymentPriceUnit;
    newEvent.paymentPriceUnitSign = paymentPriceUnitSign;
    newEvent.paymentMethod        = paymentMethod;
    newEvent.paymentAccountIds    = paymentAccountIds;

    // console.log("newEvent_PaymentMethod: "+JSON.stringify(newEvent));
    return newEvent;
});

// 转换 国家、省、城市
var __convertCity = Promise.coroutine(function* (connection, cityId, newEvent) {
    if(!_.isNull(cityId)){
        var cityQuery = 'SELECT * from City where cityId=' + cityId;
        var cities = yield connection.query(cityQuery);
        if( !_.isEmpty(cities) ) {
            newEvent.country  = cities[0].countryName;
            newEvent.province = cities[0].provinceName;
            newEvent.city     = cities[0].cityName;
        }
    }
    // console.log("newEvent_City: "+JSON.stringify(newEvent));
    return newEvent;
});

// 转换 主办方
var __convertOrganizers = Promise.coroutine(function* (connection, organizerId) {
    var organizers = [];
    if(!_.isNull(organizerId)){
        var organizerQuery = 'SELECT * from Organizer where organizerId=' + organizerId;
        var organizersObj = yield connection.query(organizerQuery);
        if( !_.isEmpty(organizersObj) ) {
            var organizer = {
                name : organizersObj[0].organizerName,
                website:organizersObj[0].webSiteUrl,
                logo:_.isEmpty(organizersObj[0].logoUrl) ? '' : 'http://www.eventdove.com'+organizersObj[0].logoUrl
            };
            organizers.push(organizer);
        }
    }
    // console.log("organizers: "+JSON.stringify(organizers));
    return organizers;
});

// 转换 联系方式
var __convertContact = Promise.coroutine(function* (connection, eventContactInfoId) {
    var contact = {};
    if(!_.isNull(eventContactInfoId)){
        var contactQuery = 'SELECT * from EventContactInfo where eventContactInfoId=' + eventContactInfoId;
        var contacts = yield connection.query(contactQuery);
        if( !_.isEmpty(contacts) ) {
            contact.mobile = contacts[0].cellPhone;
            contact.email = contacts[0].contactEmail;
        }
    }
    // console.log("contact: "+JSON.stringify(contact));
    return contact;
});

// 获取并转换 活动是否为专业版
var __convertIsVIP = Promise.coroutine(function* (connection, eventId) {
    var isVIP = false;
    // 根据活动Id查询 EdLoginRole 表 获取用户权限等级, 该表等级只存有 VIP(0),专业版(1)  0:200,1:200,2:100
    var edLoginRoleQuery = 'SELECT * from EdLoginRole where eventId=' + eventId;
    var edLoginRoles = yield connection.query(edLoginRoleQuery);
    if(!_.isEmpty(edLoginRoles)){
        isVIP = true;
    }
    // console.log("isVIP: "+isVIP);
    return isVIP;
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
                yield r.db('eventdove').tableCreate('Event').run(rConn);
            } catch (err) {
                console.log('err:' + err);
            }

            console.log('trying to connnect mysql...');
            connection = yield mysql.createConnection(mysqlConfig);
            console.log('connected');

            var batchSize = 500; // TODO: change to 1000
            var offset = -batchSize;
            for( ; ; ) {
                offset += batchSize;   //  where eventId=488 51900621 4290419 4156622 622
                if(offset >= 5000){
                    break;
                }
                var query = 'SELECT * from Event where modifyTimestamp <= "2017-07-12 04:50:27" and pubStatus in (3,5)'+ ' limit ' + batchSize + ' offset ' + offset;
                console.log('query: ', query);

                var rows = yield connection.query(query);
                console.log('get events: ', rows.length+" - "+ new Date());

                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var oldEvent = rows[i];
                    var newEvent = __eventConverter(oldEvent);
                    try {
                        // add 活动主办方
                        newEvent.organizers = yield __convertOrganizers(connection, oldEvent.organizerId);

                        // add 添加此次活动的联系方式
                        newEvent.contact = yield __convertContact(connection, oldEvent.eventContactInfoId);

                        //add 活动地址
                        newEvent = yield __convertCity(connection, oldEvent.cityId, newEvent);

                        // add 活动币种、支付方式、收款帐户 priceUnit:货币表 payment: 线上收款帐户表
                        newEvent = yield __convertPaymentMethodAndIds(connection, oldEvent.eventId, oldEvent.priceUnitId, oldEvent.paymentId, newEvent);

                        // add 活动免费邮件数量
                        newEvent.emailBalance = yield __convertEmailBalance(connection, oldEvent.eventId, oldEvent.loginId);

                        // add 服务费设置
                        newEvent = yield __convertFees(connection, oldEvent.eventId, newEvent);

                        // add 发票设置;
                        newEvent = yield __convertInvoiceSetting(connection, oldEvent.eventId,newEvent);

                        // add 活动票信息
                        newEvent.tickets = yield __convertTickets(connection, oldEvent.eventId);

                        // add 活动采集项设置
                        newEvent = yield __convertCollectionItems (connection, oldEvent.eventId,newEvent);

                        // add 是否专业版
                        newEvent.isVIP = yield __convertIsVIP(connection,oldEvent.eventId);

                        // console.log("newEvent is: " + JSON.stringify(newEvent));
                        yield r.table('Event').insert(newEvent).run(rConn);

                    } catch (err) {
                        console.log('convert event fail:' + newEvent.id);
                        console.log('err:' + err);
                    }
                }
                // break; //TODO: remove this after testing
            }
            console.log('----done---'+ new Date());
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
 * 转换活动状态
 * @param pubStatus
 * @private
 */
function __getEventStatus(pubStatus) {
    // 0: 尚未发布 1: 即将开始 2: 正在进行 3: 已经结束 4: 取消发布 5: 活动挂起 6: 待审核 7: 审核拒绝
    var eventStatus = fp.EVENT_STATUS.EVENT_STATUS_UNPUBLISHED; // 未发布,用户保存的草稿状态的活动
    if(pubStatus === 1 || pubStatus === 2 || pubStatus === 6){  // 已发布
        eventStatus = fp.EVENT_STATUS.EVENT_STATUS_PUBLISHED;
    }else if(pubStatus === 3){                                  // 已结束
        eventStatus = fp.EVENT_STATUS.EVENT_STATUS_FINISHED;
    }else if(pubStatus === 4){                                  // 取消发布
        eventStatus = fp.EVENT_STATUS.EVENT_STATUS_CANCELED;
    }else if(pubStatus === 5){                                  // 挂起
        eventStatus = fp.EVENT_STATUS.EVENT_STATUS_HANG_UP;
    }else if(pubStatus === 7){                                  // 审核未通过
        eventStatus = fp.EVENT_STATUS.EVENT_STATUS_AUDIT_REJECTED;
    }

    return eventStatus;
}

/**
 * 随机获取图片
 * @returns {string}
 * @private
 */
function __getEventCategorieImg() {
    var num = Math.floor(Math.random() * 10);
    return eventCategoriesImgs[num];
}

var eventCategoriesImgs = [
    'http://pic.eventdove.com/FiWvHrBOQ-SPI86NdwznuxpTZBMR','http://pic.eventdove.com/FjN-LUiG7fjFrKpk05qH0K70sQNQ','http://pic.eventdove.com/FiPuxYo5clzym91hgBa0k9NZMvUs',
    'http://pic.eventdove.com/Fty2Wl2GIv3CSwyB2LmojtM8Lnx7','http://pic.eventdove.com/FsFU9tNTkXz8UBmgipzqYHUQ9yPM','http://pic.eventdove.com/FjNBZL4NLG0uHjzeNX2fZvLTGgs0',
    'http://pic.eventdove.com/FlJXNbbv9ACNttK5K0qQKzZW6E6Z','http://pic.eventdove.com/FrdHBTQp3K6u6jPrX7Dn3n4lYaYI','http://pic.eventdove.com/FucaQW0TvngxshaEIFLxlHzLyYWj',
    'http://pic.eventdove.com/FtDWyS00djexPTEYFEzXUZfsrbTw'
]

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

