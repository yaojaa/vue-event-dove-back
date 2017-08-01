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

// 转换 会员组 会员 基础数据
function __eventGroupMemberConverter(oldMember) {
    var newMember = {};
    newMember.id = oldMember.groupMemberId.toString();
    newMember.membershipId = oldMember.eventGroupId.toString();
    newMember.externalId = oldMember.externalId;
    newMember.userId = oldMember.loginId.toString();
    newMember.name = oldMember.viewName;
    newMember.email = oldMember.memberEmail;
    // 会员采集项
    newMember.memberInfo = __getMemberProfileData(oldMember);

    newMember.status = __getStatus(oldMember.expireTime, oldMember.memberStatus);
    newMember.lastNotifyTime = null;
    newMember.joinTime  = _.isNull(oldMember.joinTime)? null :moment(oldMember.joinTime).add(8,'h').toDate();
    newMember.expireTime = _.isNull(oldMember.expireTime)? null :moment(oldMember.expireTime).add(8,'h').toDate();
    newMember.validation = {};                  // 来验证邮箱的 原数据无该数据
    newMember.ctime = _.isNull(oldMember.joinTime)? null :moment(oldMember.joinTime).add(8,'h').toDate();       // 原数据无创建时间和更新时间
    newMember.utime = _.isNull(oldMember.joinTime)? null :moment(oldMember.joinTime).add(8,'h').toDate();

    // console.log("newEvent_base: "+JSON.stringify(newEvent));

    return newMember;
};

// 获取会员 状态
function __getStatus(expireTime, memberStatus) {
    //0 正式会员 1删除的 2等待审核 3已过期 4 审核拒绝 5未缴费  6.//未激活(非登录状态注册并加入)
    var status = 'active';
    if(memberStatus === 1){
        status = 'deleted';
    }else{
        // 当前时间与过期时间比较 如果未过期 则为: active 否则为: inactive
        if((!_.isNull(expireTime)) && expireTime <= new Date()){
            status = 'inactive';
        }
    }
    return status;
}
/**
 * 获取参会采集项
 * @param attendee  原数库参会者实体
 * @private
 */
function __getMemberProfileData(eventGroupMember) {
    var profileData = _.isEmpty(eventGroupMember.profileData) ? {} : JSON.parse(eventGroupMember.profileData);

    _.isEmpty(eventGroupMember.firstName) ? '' : profileData['firstName'] = eventGroupMember.firstName;
    _.isEmpty(eventGroupMember.lastName) ? '' : profileData['lastName'] = eventGroupMember.lastName;
    _.isEmpty(eventGroupMember.homePhone) ? '' : profileData['homePhone'] = eventGroupMember.homePhone;
    _.isEmpty(eventGroupMember.cellPhone) ? '' : profileData['cellPhone'] = eventGroupMember.cellPhone;
    _.isEmpty(eventGroupMember.emailAddress) ? '' : profileData['emailAddress'] = eventGroupMember.emailAddress;
    _.isEmpty(eventGroupMember.homeAddress) ? '' : profileData['homeAddress'] = eventGroupMember.homeAddress;
    _.isEmpty(eventGroupMember.jobTitle) ? '' : profileData['jobTitle'] = eventGroupMember.jobTitle;
    _.isEmpty(eventGroupMember.companyOrorganization) ? '' : profileData['companyOrorganization'] = eventGroupMember.companyOrorganization;
    _.isEmpty(eventGroupMember.workPhone) ? '' : profileData['workPhone'] = eventGroupMember.workPhone;
    _.isEmpty(eventGroupMember.website) ? '' : profileData['website'] = eventGroupMember.website;
    _.isEmpty(eventGroupMember.blog) ? '' : profileData['blog'] = eventGroupMember.blog;
    _.isEmpty(eventGroupMember.gender) ? '' : profileData['gender'] = eventGroupMember.gender;
    _.isEmpty(eventGroupMember.age) ? '' : profileData['age'] = eventGroupMember.age;
    _.isEmpty(eventGroupMember.fax) ? '' : profileData['fax'] = eventGroupMember.fax;
    _.isEmpty(eventGroupMember.zipCode) ? '' : profileData['zipCode'] = eventGroupMember.zipCode;
    _.isEmpty(eventGroupMember.department) ? '' : profileData['department'] = eventGroupMember.department;
    _.isEmpty(eventGroupMember.address) ? '' : profileData['address'] = eventGroupMember.address;
    _.isEmpty(eventGroupMember.post) ? '' : profileData['post'] = eventGroupMember.post;

    //console.log("profileData: "+JSON.stringify(profileData));

    return profileData;
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
                yield r.db('eventdove').tableCreate('Member').run(rConn);
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
                var query = 'SELECT * from EventGroupMember limit ' + batchSize + ' offset ' + offset;
                console.log('query: ', query);

                var rows = yield connection.query(query);

                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var oldMember = rows[i];
                    var newMember = __eventGroupMemberConverter(oldMember);

                    // console.log("newMember is: " + JSON.stringify(newMember));
                    yield r.table('Member').insert(newMember).run(rConn);
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
