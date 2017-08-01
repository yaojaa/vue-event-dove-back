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

// 转换 优惠码基础数据
function __discountConverter(oldDiscount) {
    var newDiscount = {};
    newDiscount.id = oldDiscount.discountId.toString();
    newDiscount.eventId = oldDiscount.eventId;
    newDiscount.generationMode = 'manualInput';  // 默认为手动录入
    newDiscount.discountCode = oldDiscount.discountCode;
    newDiscount = __conversionDiscountType(oldDiscount,newDiscount);
    newDiscount.applyToAllTickets = __conversionApplyToAllTickets(oldDiscount.discountType,oldDiscount.tickets);
    // oldDiscount.maxUseCount 为空: 无限次数
    newDiscount.maxUseCount = _.isNull(oldDiscount.maxUseCount) ? -1 : oldDiscount.maxUseCount;
    // defaultTimeType 0:任意时间
    newDiscount.discountExpiryDate = oldDiscount.defaultTimeType === 0 ? 'any' : 'custom';
    newDiscount.startTime = _.isNull(oldDiscount.startTime)? null :moment(oldDiscount.startTime).add(8,'h').toDate();
    newDiscount.endTime = _.isNull(oldDiscount.endTime)? null :moment(oldDiscount.endTime).add(8,'h').toDate();
    newDiscount.isDeleted = false;

    newDiscount.ctime = moment(new Date()).add(8,'h').toDate();// 记录创建时间
    newDiscount.utime = moment(new Date()).add(8,'h').toDate();// 记录更新时间

    // console.log("newDiscount_base: "+JSON.stringify(newDiscount));

    return newDiscount;
};

// 转换 是否适用所有门票判断
function __conversionApplyToAllTickets(discountType,tickets) {
    // 0 代表所有票都可折扣 1.选择票进行折扣 2:作为主活动添加折扣码
    var isAll = false;
    if(discountType < 2){
        // tickets 为空时表示适用全部门票
        isAll = _.isEmpty(tickets) ? true : false;
    }
    // console.log("isAll: "+isAll);
    return isAll;
}

// 转换 优惠范围
var __convertApplyToTickets = Promise.coroutine(function* (connection, eventId,discountType,tickets) {
    var ticketIds = [];
    if(discountType === 2){
        //备注: 如果原数据discountType=2 则获取原属性tickets中对应活动Id值
        //{"843":"1262","4129925":"2825,2561","4165925":"4135"}
        var ticketsJson = JSON.parse(tickets);
        if(!_.isEmpty(ticketsJson)){
            ticketIds = _.isEmpty(ticketsJson[eventId]) ? [] : ticketsJson[eventId].split(',');
        }
        // ticketIds = _.isEmpty(ticketsJson) ? [] : ticketsJson[eventId].split(',');
    }else{
        if(_.isEmpty(tickets)){
            var ticketQuery = 'SELECT ticketId from Ticket where eventId=' + eventId;
            var ticketsObj = yield connection.query(ticketQuery);
            // console.log("ticketsObj: "+JSON.stringify(ticketsObj));
            if(!_.isEmpty(ticketsObj) ) {
                ticketIds = _.map(ticketsObj, function (ticketObj) {
                    return ticketObj.ticketId;
                })
            }
        }else {
            ticketIds = tickets.split(',');
        }
    }
    // console.log("ticketIds: "+JSON.stringify(ticketIds));
    return ticketIds;
});

// 转换 优惠方式 备注: 原数据优惠方式 为3状态不导入
function __conversionDiscountType(oldDiscount, newDiscount){
    // 0 固定值,1百分比值,2免费 3. 折扣到某个价格，并不是减 (不考虑该情况)
    var discountType = 'free';
    var discountTypeValue = 0;
    if(oldDiscount.discountRewardType === 0){          // 固定值
        discountType = 'fixed';
        discountTypeValue = oldDiscount.discountPrice;
    }else if(oldDiscount.discountRewardType === 1){    // 百分比值
        discountType = 'rate';
        discountTypeValue = oldDiscount.discountPercentage;
    }

    newDiscount.discountType = discountType;
    newDiscount.discountTypeValue = discountTypeValue;

    return newDiscount;
}

function readAndConvert() {
    Promise.coroutine(function*() {
        try {
            console.log('trying to connnect rethinkdb...');
            // rConn = yield r.connect( {host: 'localhost', port: 28015, db:'eventdove'});
            rConn = yield r.connect(config.rdbConfig);

            // run this the second time will get error
            try {
                yield r.dbCreate("eventdove").run(rConn);
                yield r.db('eventdove').tableCreate('Discount').run(rConn);
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
                // 备注: 原数据优惠方式(discountRewardType) 为3状态的优惠码数据不导入 and discountId =  194286 141580 193249
                var query = 'SELECT d.* from Discount d LEFT JOIN Event e ON d.eventId = e.eventId where d.discountRewardType != 3 ' +
                    'and e.modifyTimestamp <= "2017-07-12 04:50:27" and e.pubStatus in (3,5) limit ' + batchSize + ' offset ' + offset;
                console.log('query: ', query);

                var rows = yield connection.query(query);
                console.log('get Discount: ', rows.length +' - '+ new Date());

                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var oldDiscount = rows[i];
                    var newDiscount = __discountConverter(oldDiscount);

                    try {
                        // add 活动主办方
                        newDiscount.applyToTickets = yield __convertApplyToTickets(connection, oldDiscount.eventId,oldDiscount.discountType,oldDiscount.tickets);

                        // console.log("newDiscount is: " + JSON.stringify(newDiscount));
                        yield r.table('Discount').insert(newDiscount).run(rConn);

                    } catch (err) {
                        console.log('convert Discount fail:' + oldDiscount.discountId);
                        console.log('err:' + err);
                    }
                }
                // break; //TODO: remove this after testing
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
