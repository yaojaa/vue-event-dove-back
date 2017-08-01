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

// 转换 会员组 会员 定单基础数据
function __eventGroupMemberOrderConverter(oldMemberOrder) {
    var newMemberOrder = {};
    newMemberOrder.id = 'M'+oldMemberOrder.orderNumber;      // 定单号
    newMemberOrder.membershipId = oldMemberOrder.eventGroupId.toString();
    newMemberOrder.memberId = oldMemberOrder.groupMemberId.toString();
    newMemberOrder.payMethod = oldMemberOrder.currencySign === '$' ? 'PAYPAL' :'ALIPAY';
    newMemberOrder.payStatus = oldMemberOrder.payStatus === 1 ? fp.ORDER_STATUS.ORDER_STATUS_PAID  : fp.ORDER_STATUS.ORDER_STATUS_PAID_NONE;   // todo
    newMemberOrder.paymentTime = _.isNull(oldMemberOrder.payTime)? null :moment(oldMemberOrder.payTime).add(8,'h').toDate();
    newMemberOrder.orderIpAddress = oldMemberOrder.orderIp;
    newMemberOrder.currency  = oldMemberOrder.currencySign === '$' ? fp.CURRENCY_NAME.DOLLAR : fp.CURRENCY_NAME.YUAN;
    newMemberOrder.totalPrice = oldMemberOrder.totalPrice;
    newMemberOrder.eventdoveFee = oldMemberOrder.totalFee;
    newMemberOrder.payPalPayKey = '';
    newMemberOrder.ctime = _.isNull(oldMemberOrder.orderTime)? null :moment(oldMemberOrder.orderTime).add(8,'h').toDate();
    newMemberOrder.utime = _.isNull(oldMemberOrder.orderTime)? null :moment(oldMemberOrder.orderTime).add(8,'h').toDate();

    // console.log("newMemberOrder_base: "+JSON.stringify(newMemberOrder));

    return newMemberOrder;
};

// 获取会员 邮箱
var __getMemberEmail = Promise.coroutine(function* (connection, groupMemberId) {
    var memberQuery = 'SELECT * from EventGroupMember where groupMemberId=' + groupMemberId;
    var groupMembers = yield connection.query(memberQuery);

    var email = '';
    if(!_.isEmpty(groupMembers)){
        email = groupMembers[0].memberEmail;
    }
    return email;
});

// 获取 会员定单 渠道费 支付机构的流水号
var __getPayOrderAboutInfo = Promise.coroutine(function* (connection, payOrderId, newMemberOrder) {
    var payOrderQuery = 'SELECT * from PayOrder where payOrderId=' + payOrderId;
    var payOrders = yield connection.query(payOrderQuery);

    if(!_.isEmpty(payOrders)){
        newMemberOrder.returnOrderNum = payOrders[0].returnOrderNum;
        newMemberOrder.channelFee = payOrders[0].paidFee;

        // console.log("returnOrderNum: "+payOrders[0].returnOrderNumber+"  paidFee: "+payOrders[0].paidFee);
    }
    return newMemberOrder;
});

// 获取 会员定单详情 收款帐号
var __getMemberOrderInfo = Promise.coroutine(function* (connection, buyNum, newMemberOrder) {
    var groupPaymentQuery = 'SELECT egp.*, p.paymentAccount from `EventGroupPayment` egp left join `Payment` p on egp.paymentId = p.paymentId where 1=1 AND egp.eventGroupId='+ newMemberOrder.membershipId;
    var groupPayments = yield connection.query(groupPaymentQuery);

    newMemberOrder.payPalAccount = newMemberOrder.payMethod === 'PAYPAL' ? groupPayments[0].paymentAccount : '';     //
    newMemberOrder.orderDetail = {
        duesType         : __getDuesType(groupPayments[0].payType),
        duesUnit         : buyNum,
        duesPricePerUnit : newMemberOrder.totalPrice / buyNum
    };

    return newMemberOrder;
});

// 转换 会费收费方式
function __getDuesType(payType) {
    //1 月 2 季 3 年  4 自然年
    var duesType = fp.MEMBER_CONST.DUES_TYPE_MONTH;
    if(payType === 2){
        duesType = fp.MEMBER_CONST.DUES_TYPE_SEASON;
    }else if(payType === 3 || payType === 4){
        duesType = fp.MEMBER_CONST.DUES_TYPE_YEAR;
    }

    return duesType;
}

function readAndConvert() {
    Promise.coroutine(function*() {
        try {
            console.log('trying to connnect rethinkdb...');
            // rConn = yield r.connect( {host: 'localhost', port: 28015, db:'eventdove'});
            rConn = yield r.connect(config.rdbConfig);
            // run this the second time will get error
            try {
                // yield r.dbCreate("eventdove").run(rConn);
                yield r.db('eventdove').tableCreate('MemberOrder').run(rConn);
            } catch (err) {
                console.log('err:' + err);
            }

            console.log('trying to connnect mysql...');
            connection = yield mysql.createConnection(mysqlConfig);
            console.log('connected');

            var batchSize = 6; // TODO: change to 1000
            var offset = -batchSize;
            for( ; ; ) {
                offset += batchSize;
                // 只导总金额大于0的会员定单,金额为0的只有3条 为错误数据
                var query = 'SELECT * from MemberFeeOrder where totalPrice > 0 limit ' + batchSize + ' offset ' + offset;
                console.log('query: ', query);

                var rows = yield connection.query(query);

                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var oldMemberOrder = rows[i];
                    var newMemberOrder = __eventGroupMemberOrderConverter(oldMemberOrder);
                    try {
                        // add 会员邮箱信息
                        newMemberOrder.email = yield __getMemberEmail(connection, oldMemberOrder.groupMemberId);

                        // add 渠道费 支付机构的流水号
                        newMemberOrder = yield __getPayOrderAboutInfo(connection, oldMemberOrder.payOrderId, newMemberOrder);

                        // add 会员定单详情 收款帐号
                        newMemberOrder = yield __getMemberOrderInfo(connection, oldMemberOrder.buyNum, newMemberOrder);

                        console.log("newMemberOrder: "+JSON.stringify( newMemberOrder));
                        yield r.table('MemberOrder').insert(newMemberOrder).run(rConn);

                    } catch (err) {
                        console.log('convert MemberOrder fail:' + newMemberOrder);
                        console.log('err:' + err);
                    }
                }
                break; //TODO: remove this after testing
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
