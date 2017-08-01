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
const User     = require('../model/user.js');
var mysqlConfig = config.mysqlConfig;
var moment     = require('moment');

// 转换 用户基础数据
function __eventUser(oldUser) {
    var newUser = {};
    var oauthType = 'evetdove';
    newUser.id = oldUser.loginId.toString();
    var username = _.isEmpty(oldUser.username) ? oldUser.username : oldUser.username.trim();
    newUser.username = _.isEmpty(username) ? oldUser.phone : username;
    newUser.nickname = oldUser.viewName;
    newUser.password = oldUser.password;
    newUser.salt = oldUser.salt;

    newUser.phone = oldUser.phone;
    newUser.lastLoginTime = _.isNull(oldUser.lastLoginTime)? null :moment(oldUser.lastLoginTime).add(8,'h').toDate();
    newUser.lastLoginIp = oldUser.lastLoginIp;
    newUser.email = username;
    newUser.accountStatus = __convertState(oldUser.state);

    // 原数据中无 创建及修改时间数据
    newUser.ctime = moment(new Date()).add(8,'h').toDate();
    newUser.utime = moment(new Date()).add(8,'h').toDate();

    newUser.memberFeePercent = 2.5;
    newUser.managepwd = oldUser.managepw;

    var avatar = _.isEmpty(oldUser.avatar) ? '' : 'http://www.eventdove.com'+oldUser.avatar;
    // 第三方登录
    var isOauth = __volidateIsRegUser(username);
    if(isOauth === false){
        var type = username.substring(0,4);
        if(type === 'sina'){
            oauthType = 'sina';
            avatar = oldUser.avatar;
            newUser.oauthId = username.substring(4);
            newUser.oauthAccesToken = '';
            newUser.oauthExpires = 0;
            newUser.salt          = myutil.generateVerificationCode(6, 'string');
            newUser.password      = User.generatePassword('123456', newUser.salt);
        }else if(type === 'linkedin'){
            oauthType = 'linkedin';
            avatar = oldUser.avatar;
            newUser.oauthId = username.substring(8);
            newUser.oauthAccesToken = '';
            newUser.oauthExpires = 0;
            newUser.salt          = myutil.generateVerificationCode(6, 'string');
            newUser.password      = User.generatePassword('123456', newUser.salt);
        }else{
            isOauth = true;
        }
    };
    newUser.isOauth = isOauth;
    newUser.oauthType = oauthType;
    // 邮件偏好设置
    newUser.emailSetting = {
        isNeedAttendeeNotice     : false,    // 是否需要参会者购票通知邮件
        isNeedRefundTicketNotice : false,    // 是否需要退票通知邮件
        isNeedAuditedTicketNotice: false     // 是否需要参会者购买付费审核门票的通知邮件
    };
    var gender = 'man';     // 男
    if(oldUser.gender === 'female'){
        gender = 'woman';   // 女
    }
    // 用户设置
    newUser.profile = {
        avatar  : avatar,             // 用户头像
        gender  : gender,             // 性别
        company : oldUser.company,    // 公司
        position: oldUser.position,   // 职位
    };
    // console.log("newEvent_base: "+JSON.stringify(newUser));
    return newUser;
};

function __convertState(state){
    // A 启用 M N未验证邮箱 M正常注册未激活  N通过绑定帐号未验证邮箱 U: 禁止登录用户
    var accountStatus = 'registered';
    if(state === 'A'){
        accountStatus = 'active';
    }else if(state === 'U'){
        accountStatus = 'disabled';
    }
    return accountStatus;
}

// 转换 注册用户服务费设置
var __convertFees = Promise.coroutine(function* (connection, loginId, newUser) {
    var feesQuery = 'SELECT * from EventFee where loginId=' + loginId;
    var fees = yield connection.query(feesQuery);
    var basePrice = 0;
    var percent = 0;
    var maxFee = 0;
    if( !_.isEmpty(fees) ) {
        basePrice = fees[0].basePrice;
        percent   = fees[0].ticketPercent;
        maxFee    = fees[0].maxFee;
    }
    newUser.basePrice = basePrice;
    newUser.percent   = percent;
    newUser.maxFee    = maxFee;

    // console.log("newUser_Fees: "+JSON.stringify(newUser));
    return newUser;
});


// 转换 获取用户年费版信息
var __convertUserPackge = Promise.coroutine(function* (connection, loginId) {
    var userPackge = {};
    var edLoginRoleQuery = 'SELECT * from EdLoginRole where eventId is null and loginId=' + loginId;
    var edLoginRoles = yield connection.query(edLoginRoleQuery);
    if(!_.isEmpty(edLoginRoles)){
        userPackge.packageId = myutil.nextId();
        userPackge.beginDate = edLoginRoles[0].effectiveTime;
        userPackge.endDate  = edLoginRoles[0].expireTime;
    }

    // console.log("userPackge: "+JSON.stringify(userPackge));

    return userPackge;
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
                yield r.db('eventdove').tableCreate('User').run(rConn);
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
                if(offset >= 40000){
                    break;
                }
                // var loginQuery = 'SELECT * from Login limit ' + batchSize + ' offset ' + offset;
                // 只导入非第三方注册登录的用户
                // var loginQuery = "SELECT * from Login where username like '%@%' or username = '' limit " + batchSize + " offset " + offset;
                var loginQuery = 'SELECT l.*, u.pdataUserCompany as company, u.position as position,' +
                    ' u.pdataUserIcon as avatar, u.gender as gender from Login l LEFT JOIN User u ' +
                    'on l.loginId = u.loginId where lastLoginTime <= "2017-07-12 05:00:06" limit ' + batchSize + ' offset '  + offset;
                console.log('query: ', loginQuery);

                var rows = yield connection.query(loginQuery);
                console.log('get users: ', rows.length+" - "+ new Date());

                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var oldUser = rows[i];
                    // 只导入非第三方注册登录的用户
                    // var isPass = __volidateIsRegUser(oldUser.username);
                    // if(isPass === true){
                    var newUser = __eventUser(oldUser);
                    try {
                        // add 注册用户服务费设置
                        newUser = yield __convertFees(connection, oldUser.loginId, newUser);

                        // add 获取用户年费版信息
                        newUser.userPackge = yield __convertUserPackge (connection, oldUser.loginId);

                        // console.log("newUser is: " + JSON.stringify(newUser));
                        yield r.table('User').insert(newUser).run(rConn);

                    } catch (err) {
                        console.log('convert User fail:' + newUser.id);
                        console.log('err:' + err);
                    }
                    // }

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

// 判断是否为普通注册用户
function __volidateIsRegUser(username) {
    var isPass = false;
    if(_.isEmpty(username)){      // 第三方注册用户名(邮箱)不为空
        isPass = true;
    }else{
        // var emailPattern = /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{1,14}/;// 邮箱
        var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i;
        if (emailPattern.test(username)) {   // 第三方注册用户名(邮箱)不为邮箱号
            isPass = true;
        }else{
            if(username.indexOf('@') >= 0){
                console.log("username: "+username);
            }
        }
    }
    return isPass;
}
