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
    sesr.id = myutil.nextId()+'_'+oldSendRecord.shortMessageId;
    sesr.emailTitle = '';
    sesr.from = '';
    sesr.fromName = '';
    sesr.replyTo = '';
    sesr.content = oldSendRecord.messageCount;
    sesr.type = fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS;
    sesr.scheduledSendTime = _.isNull(oldSendRecord.scheduleTime) ? null : moment(oldSendRecord.scheduleTime).add(8,'h').toDate();
    sesr.functionType = fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_NOTICEMENT;
    sesr.isDelete = false;
    sesr.templateId = 0;
    sesr.userId = oldSendRecord.loginId;
    sesr.eventId = oldSendRecord.eventId;
    sesr.isHistory  = true;
    sesr.ctime = _.isNull(oldSendRecord.createTime)? null : moment(oldSendRecord.createTime).add(8,'h').toDate();
    sesr.utime = _.isNull(oldSendRecord.createTime)? null : moment(oldSendRecord.createTime).add(8,'h').toDate();

    return sesr;
}

/**
 * 转换短信收件人信息
 * @param receiver
 * @param messageStatus
 * @param smsEmailSendRecord
 * @private
 */
function __converReceivers(receiver, messageStatus, smsEmailSendRecord) {

    var smsSendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_TO_BE_SENT;
    var scheduledSendTimeType = fp.SEND_RECORD_TIME_TYPE.SEND_TIME_TYPE_IMMEDIATELY;
    // messageStatus 0 草稿 1 等待 2 已经发送 3 余额不足, 4发送失败（手机号为空或）

    if(messageStatus === 0){   // 草稿邮件
        scheduledSendTimeType = fp.SEND_RECORD_TIME_TYPE.SEND_TIME_TYPE_DRAFT;
    }else if(messageStatus === 1){ // 定时发送邮件
        scheduledSendTimeType = fp.SEND_RECORD_TIME_TYPE.SEND_TIME_TYPE_TIMED;
    }else if(messageStatus === 2){ // 立即发送邮件  发送成功
        smsSendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_SUCCESS;
    }else{    // 立即发送邮件  发送失败
        smsSendStatus = fp.RECORD_SEND_STATUS.SEND_STATUS_SEND_FAIL;
    }

    smsEmailSendRecord.sendCloudStatus = smsSendStatus;
    smsEmailSendRecord.scheduledSendTimeType = scheduledSendTimeType


    var toAddres_Arr = _.without(receiver.split(','), '');
    var receivers = _.map(toAddres_Arr, function (toAddres) {
        return {
            receiverNumber : toAddres,
            receiverName   : '',
            sendStatus     : smsSendStatus
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
                // 活动通知短信 查询所有主办方发送通知 及 勾选购票短信通知 及 状态为非余额不足 的短信发送记录
                var shortMessageQuery = 'SELECT * from ShortMessage where loginId is not null and eventId is not null and messageStatus != 3 limit ' + batchSize + ' offset ' + offset;
                console.log('query: ', shortMessageQuery);

                // 1. smsRecord 不为空 : noticement 2. sysLogin event 不为空 smsRecord 为空 : noticement
                var rows = yield connection.query(shortMessageQuery);
                console.log('get shortMessages: ', rows.length+" - "+ new Date());

                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var shortMessage = rows[i];

                    var smsEmailSendRecord = __converSmsEmailSendRecord(shortMessage);
                    smsEmailSendRecord  = __converReceivers(shortMessage.receiver, shortMessage.messageStatus, smsEmailSendRecord);

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
