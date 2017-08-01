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
var myutil     = require('../util/util.js');
var mysqlConfig = config.mysqlConfig;
var moment     = require('moment');

// 转换 用户绑定贝宝 帐号
function __converPaypalAccount(payments) {
    var paypalAccount = [];
    if(!_.isEmpty(payments)){
        _.each(payments,function (payment) {
            var newPayment = {
                accountId : payment.paymentId.toString(),
                account   : payment.paymentAccount,
                status    : 'normal'     // 原帐号删除直接物理删除
            };
            paypalAccount.push(newPayment);
        });
    }
    return paypalAccount;
}

// // 转换 用户绑定银行 帐号
// function __converOriginalAccount(offlinePayments) {
//     var originalAccount = [];
//     if(!_.isEmpty(offlinePayments)){
//         _.each(offlinePayments,function (offlinePayment) {
//             var newOfflinePayment = {
//                 accountId    : offlinePayment.offlinePaymentId.toString(),
//                 ownerName    : offlinePayment.remittee,
//                 bankName     : offlinePayment.bankName,
//                 bankAccount  : offlinePayment.account,
//                 status    : 'normal'     // 原帐号删除直接物理删除
//             };
//             originalAccount.push(newOfflinePayment);
//         });
//     }
//     return originalAccount;
// }

function readAndConvert() {
    Promise.coroutine(function*() {
        try {
            console.log('trying to connnect rethinkdb...');
            // rConn = yield r.connect( {host: 'localhost', port: 28015, db:'eventdove'});
            rConn = yield r.connect(config.rdbConfig);
            // run this the second time will get error
            try {
                yield r.dbCreate("eventdove").run(rConn);
                yield r.db('eventdove').tableCreate('Wallet').run(rConn);
            } catch (err) {
                console.log('err:' + err);
            }

            console.log('trying to connnect mysql...');
            connection = yield mysql.createConnection(mysqlConfig);
            console.log('connected');

            var batchSize = 1000; // TODO: change to 1000
            var offset = -batchSize;
            for( ; ; ) {
                offset += batchSize;   // where loginId = 114 483 435666 412149
                if(offset >= 50000){
                    break;
                }
                var loginQuery = 'SELECT * from Login where lastLoginTime <= "2017-07-12 05:00:06" limit ' + batchSize + ' offset ' + offset;
                // 1. 查询所有注册用户
                // 2. 根据所用户分别查询UserFlux(短信邮件余额表)、Payment(绑定线上收款帐户-只取贝宝帐户) 和OfflinePayment(绑定的银行卡表)
                // 3. 若2中存在一个或多个则将所查三表结果记录钱包中
                console.log('query: ', loginQuery);

                var rows = yield connection.query(loginQuery);
                console.log('get users: ', rows.length+" - "+ new Date());

                var len = rows.length;
                if ( len <= 0) {
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var oldUser = rows[i];

                    // 获取用户绑定银行卡信息
                    // var offlinePaymentQuery = 'SELECT * from OfflinePayment where loginId=' + oldUser.loginId;
                    // var offlinePayments = yield connection.query(offlinePaymentQuery);

                    // 获取用户绑定贝宝信息 paymentTypeId 1. alipay 2. paypal 3. wechat
                    var paymentQuery = 'SELECT * from Payment where paymentTypeId = 2 and loginId=' + oldUser.loginId;
                    var payments = yield connection.query(paymentQuery);

                    // 获取用户短信邮件帐户信息 先期导用户邮件短信帐户至为0, 二期导时在新项目对应字段再添加
                    /*var userFluxtQuery = 'SELECT * from UserFlux where loginId=' + oldUser.loginId;
                    var userFluxs = yield connection.query(userFluxtQuery);*/

                    var newWallet = {
                        id : oldUser.loginId.toString(),
                        cTime : moment(new Date()).add(8,'h').toDate(),
                        userId : oldUser.loginId.toString(),
                        balanceEmail : 0,
                        balanceSMS   : 0,
                        balanceRMB   : 0,
                        balanceDollar : 0
                        //personalAccount : [],
                        //businessAccount : []
                    };

                    // if(!_.isEmpty(payments) || !_.isEmpty(userFluxs)){
                    if(!_.isEmpty(payments)){
                        /*var balanceEmail = 0;
                        var balanceSMS   = 0;
                        if(!_.isEmpty(userFluxs)){
                            // 获取用户短信充值总额 type = 2 短信充值记录 1 邮件充值记录
                            // 原数据中'短信已使用额度'未记录只记录短信余额
                            // var rechargeSMSTotalQuery = 'SELECT sum(count) as total from RechargeHistory where type = 2 and userId=' + oldUser.loginId;
                            // var rechargeSMSTotals = yield connection.query(rechargeSMSTotalQuery);

                            // console.log("rechargeSMSTotals: "+JSON.stringify(rechargeSMSTotals));
                            // todo 短信充值总额查询有有误，该查询只统计后台添加部分，用户直接充值部分未统计

                            // balanceEmail = userFluxs[0].emailUsedCount + userFluxs[0].emailLeftCount;   //邮件充值总额
                            // balanceSMS = _.isEmpty(rechargeSMSTotals[0].total) ? 0 : rechargeSMSTotals[0].total;   //短信充值总额
                            // select count(*) from PayOrder where subject like '%Recharge SMS%'  or subject like '%【短信充值】%'

                            // 只导邮件短信余额
                            balanceEmail = userFluxs[0].emailLeftCount;   //邮件剩余额度
                            balanceSMS = userFluxs[0].leftCount;          //短信剩余额度
                        }*/
                        newWallet.paypalAccount = __converPaypalAccount(payments);
                        // console.log("newWallet is: " + JSON.stringify(newWallet));
                    }
                    yield r.table('Wallet').insert(newWallet).run(rConn);
                }
                // break; //TODO: remove this after testing
            }

            console.log('--done--'+new Date());
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
