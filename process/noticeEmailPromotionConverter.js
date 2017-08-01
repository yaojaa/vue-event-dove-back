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

/**
 * 转换 邮件短信基类数据
 * @param oldSendRecord
 * @private
 */
function __converSmsEmailSendRecord(oldSendRecord) {
    var sesr = {};
    sesr.id = myutil.nextId()+'_'+oldSendRecord.managerMailId;
    sesr.emailTitle = oldSendRecord.subject;
    sesr.from = oldSendRecord.fromAddress;
    sesr.fromName = oldSendRecord.fromName;
    sesr.replyTo = oldSendRecord.replyAddress;
    sesr.content = oldSendRecord.content;
    sesr.type = fp.SEND_RECORD_TYPE.RECORD_TYPE_EMAIL;
    sesr.scheduledSendTime = _.isNull(oldSendRecord.sendTimestamp)? null : moment(oldSendRecord.sendTimestamp).add(8,'h').toDate();
    sesr.functionType = fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_PROMOTION;
    sesr.isDelete = false;
    sesr.templateId = 0;
    sesr.userId = oldSendRecord.loginId;
    sesr.eventId = oldSendRecord.eventId;
    sesr.isHistory  = true;
    sesr.ctime = _.isNull(oldSendRecord.createTimestamp)? null : moment(oldSendRecord.createTimestamp).add(8,'h').toDate();
    sesr.utime = _.isNull(oldSendRecord.createTimestamp)? null : moment(oldSendRecord.createTimestamp).add(8,'h').toDate();

    return sesr;
}

/**
 * 转换邮件收件人信息
 * @param toAddress
 * @param status
 * @param sendStatus
 * @private
 */
function __converReceivers(toAddressArr, status, sendStatus, smsEmailSendRecord) {
    var emailSendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_TO_BE_SENT;
    var scheduledSendTimeType = fp.SEND_RECORD_TIME_TYPE.SEND_TIME_TYPE_IMMEDIATELY;
    // sendStatus 0: 草稿, 1: 定时发送 3: 立即发送
    if(sendStatus === 3){    // 立即发送邮件
        if(status === 0){
            emailSendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS;
        }else{
            emailSendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL;
        }
    }else if(sendStatus === 0){    // 草稿邮件
        scheduledSendTimeType = fp.SEND_RECORD_TIME_TYPE.SEND_TIME_TYPE_DRAFT;
    }else{                         // 定时发送邮件
        scheduledSendTimeType = fp.SEND_RECORD_TIME_TYPE.SEND_TIME_TYPE_TIMED;
    }

    smsEmailSendRecord.sendCloudStatus = emailSendStatus;
    smsEmailSendRecord.scheduledSendTimeType = scheduledSendTimeType

    var receivers = _.map(toAddressArr, function (toAddres) {
        return {
            receiverNumber : toAddres,
            receiverName   : '',
            sendStatus     : emailSendStatus
        }
    });
    smsEmailSendRecord.receivers = receivers;

    return smsEmailSendRecord;
}

// 转换收件人地址
var __converSelectedContact = Promise.coroutine(function* (connection, loginId, selectedContact,toAddress) {
    // console.log('loginId: '+loginId+' selectedContact: '+selectedContact+' toAddress: '+toAddress);
    var contactEmails = [];
    if(!_.isEmpty(selectedContact)){
        var contacts =  JSON.parse(selectedContact);
        var sysUserEmails = contacts.SYS_USER_EMAILS;
        var manualEmails = contacts.MANUAL_EMAILS;

        if(!_.isEmpty(sysUserEmails)){
            // email_1_102247,email_1_102637,email_1_102638,email_1_103901,email_1_105695,email_1_111967
            // email_2_4406418   _0_contactId:普通联系人_id、_1_contactGroupId:联系人组_id 、_2_eventId:历史活动_id
            var sysUserEmailArr = sysUserEmails.split(',');

            for(var i = 0; i < sysUserEmailArr.length; i++){
                var emailArr = sysUserEmailArr[i].split('_');
                var sourceType = emailArr[1];
                var accountId = emailArr[2];
                if(sourceType === '0'){    // 普通联系人
                    var contactQuery = 'SELECT pdataUserMail from Contact where ownerId = '+loginId+' and contactId = '+accountId;
                    var contacts = yield connection.query(contactQuery);

                    // console.log('contactQuery: '+contactQuery+' contacts.length: '+contacts.length);
                    if (!_.isEmpty(contacts)) {
                        contactEmails.push(contacts[0].pdataUserMail);
                    }

                }else if(sourceType === '1'){   // 联系人组
                    // var contactQuery = 'SELECT pdataUserMail from Contact where ownerId = '+loginId+' and contactGroupId = '+accountId;
                    var contactQuery = 'SELECT c.pdataUserMail from Contact c left join  ContactGroupList cgl on c.contactId = cgl.contactId where 1=1 AND cgl.contactGroupId = '+accountId;
                    var contacts = yield connection.query(contactQuery);

                    // console.log('contactQuery: '+contactQuery+' contacts.length: '+contacts.length);

                    _.each(contacts,function (contact) {
                        contactEmails.push(contact.pdataUserMail);
                    })

                }else {     // 历史活动
                    var attendeeQuery = 'SELECT emailAddress from Attendee where eventId = '+accountId;
                    var attendees = yield connection.query(attendeeQuery);

                    // console.log('attendeeQuery: '+attendeeQuery+' attendees.length: '+attendees.length);
                    _.each(attendees,function (attendee) {
                        contactEmails.push(attendee.emailAddress);
                    })
                }
            }

            if(!_.isEmpty(manualEmails)){
                _.extend(contactEmails,manualEmails.split(','));
            }
        }
    }

    if(!_.isEmpty(toAddress)){
        _.extend(contactEmails,toAddress.split(','));
    }

    // 去重
    contactEmails = _.uniq(contactEmails);
    // console.log('contactEmails: '+contactEmails+ ' contactEmails.length: '+contactEmails.length);
    return contactEmails;

});


function readAndConvert() {
    Promise.coroutine(function*() {
        try {
            console.log('trying to connnect rethinkdb...');
            // rConn = yield r.connect( {host: 'localhost', port: 28015, db:'eventdove'});
            rConn = yield r.connect(config.rdbConfig);
            // run this the second time will get error
            try {
                // yield r.dbCreate("eventdove").run(rConn);
                yield r.db('eventdove').tableCreate('SmsEmailSendRecord').run(rConn);
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
                // 活动推广邮件  3793  2580 2587
                var managerMailQuery = 'SELECT * from ManagerMail limit ' + batchSize + ' offset ' + offset;
                console.log('query: ', managerMailQuery);

                var rows = yield connection.query(managerMailQuery);
                console.log('get managerMails: ', rows.length+" - "+ new Date());

                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var managerMail = rows[i];
                    var smsEmailSendRecord = __converSmsEmailSendRecord(managerMail);

                    var contactEmails = yield __converSelectedContact(connection, managerMail.loginId, managerMail.selectedContact,managerMail.toAddress);

                    smsEmailSendRecord  = __converReceivers(contactEmails, managerMail.status, managerMail.sendStatus, smsEmailSendRecord);

                    // console.log("smsEmailSendRecord is: " + JSON.stringify(smsEmailSendRecord));
                    yield r.table('SmsEmailSendRecord').insert(smsEmailSendRecord).run(rConn);

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
