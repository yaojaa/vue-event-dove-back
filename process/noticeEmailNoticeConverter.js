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
    sesr.scheduledSendTime = _.isNull(oldSendRecord.sendTimestamp) ? null : moment(oldSendRecord.sendTimestamp).add(8,'h').toDate();
    sesr.functionType = fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_NOTICEMENT;
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
function __converReceivers(toAddress, status, sendStatus, smsEmailSendRecord) {

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

    var toAddres_Arr = toAddress.split(',');
    var receivers = _.map(toAddres_Arr, function (toAddres) {
        return {
            receiverNumber : toAddres,
            receiverName   : '',
            sendStatus     : emailSendStatus
        }
    });
    smsEmailSendRecord.receivers = receivers;

    return smsEmailSendRecord;
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
                // 活动通知邮件
                var attendeeMailQuery = 'SELECT * from AttendeeMail limit ' + batchSize + ' offset ' + offset;
                console.log('query: ', attendeeMailQuery);

                var rows = yield connection.query(attendeeMailQuery);
                console.log('get attendeeMails: ', rows.length+" - "+ new Date());

                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var attendeeMail = rows[i];

                    var smsEmailSendRecord = __converSmsEmailSendRecord(attendeeMail);
                    smsEmailSendRecord  = __converReceivers(attendeeMail.toAddress, attendeeMail.status, attendeeMail.sendStatus, smsEmailSendRecord);

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
