/**
系统通知 动态模板
@class sysNotie
@author :lwp
@date:  :2017-07-12
@version : 0.1.0 
@constructor 
*/


const _         = require('lodash');
const myutil    = require('../../util/util.js');
const thinky    = require('../../util/thinky.js');
const r         = thinky.r;
const fp        = require('../../util/fixParams.js');
const settings  = require("../../conf/settings");
const loggerSettings = require('../../logger');
const logger         = loggerSettings.winstonLogger;
const fixParams = require('../../util/fixParams.js');
const moment    = require('moment');
const noticeContro= require('../../controllers/noticeController.js');
const templateDB= require('./template.js');
const User      = require('../user.js');
const Order     = require('../order.js');
const Event     = require('../event.js');
const Notice    = require('../notice.js');
const Wallet    = require('../wallet.js');



/**
functionType : 通知类型
code: 模板编码
type: 发送类型  sms  ，email
toData: 模板值对象
userInfo: 用户信息 
**/ 
exports.sendNotice=async function(req,functionType,code,type,toData,userInfo){
    
    if(type=="email"){
        // 发邮件
        if (userInfo.email=='' ||_.isEmpty(userInfo.email) || _.isUndefined(userInfo.email)) {
            return;
        }
        logger.debug('发送给...', userInfo.email);
        const attachment = toData.attachment||'';  //附件
        logger.debug('附件...', attachment);
        const tempInfo   = await templateDB.Dao.getEmailTemplateByCode(code);
        const tempHtml =myutil.escape2Html(tempInfo.templateContent);
        //const tempHtml2='<a style="word-break: break-all;" href="<%= url %>"">aaaaa</a>';
        let template   = _.template(tempHtml); //模板内容
        const emailContent=  template(toData);  //变量放入模板                                                                              
        let params       = __jointEmailRecord(req, functionType, userInfo.email, req.__(tempInfo.templateCode), emailContent, '', userInfo.id,attachment);
        noticeContro.systemSendRecord(params);
    }else if(type=='sms'){
        //发短信
        if (userInfo.phone=='' ||_.isEmpty(userInfo.phone) || _.isUndefined(userInfo.phone)) {
            return;
        }
        logger.debug('发送给...', userInfo.phone);
        const tempInfo   = await templateDB.Dao.getSmsTemplateByCode(code);
        const tempHtml =myutil.escape2Html(tempInfo.templateContent);
        let template   = _.template(tempHtml); //模板内容
        const smsContent=  template(toData);  //变量放入模板 
        const params = __jointSmsRecord(functionType, userInfo.phone, smsContent, '', '');
        noticeContro.systemSendRecord(params);

    }

 
}

// ****** 拼接邮件记录参数 ******
function __jointEmailRecord(req, functionType, receivers, title, content, eventId, userId,attachment) {
    const params = {
        receivers: receivers,// 收件人
        title    : _.isEmpty(title) ? '' : title,// 邮件标题
        from     : fp.RECORD_SEND_SET.DEFAULT_FROM,// 发件人邮箱
        fromName : req.__("eventdove_customer_service"),// 发件人名称
        replyTo  : fp.RECORD_SEND_SET.DEFAULT_FROM,// 回复邮件地址 与 from 一致
        category : fp.SEND_RECORD_TYPE.RECORD_TYPE_EMAIL,// 记录 类别: 邮件
        content  : content,// 邮件内容
        sendType : fp.SEND_TYPE.SEND_TYPE_IMMEDIATELY,// 立即使发送
        type     : functionType,// 邮件短信类型 属性 帐户激活
        eventId  : _.isEmpty(eventId) ? '' : eventId,// 活动Id
        userId   : _.isEmpty(userId) ? '' : userId,// 用户Id,
        attachment:_.isEmpty(attachment) ? '' : attachment,// 附件地址,
    };
    return params;
}

// ****** 拼接短信记录参数 ******
function __jointSmsRecord(functionType, receivers, content, eventId, userId) {
    const params = {
        receivers: receivers,// 收件人/手机号
        category : fp.SEND_RECORD_TYPE.RECORD_TYPE_SMS,// 记录 类别
        content  : content,// 短信内容
        sendType : fp.SEND_TYPE.SEND_TYPE_IMMEDIATELY,// 立即使发送
        type     : functionType,// 邮件短信类型 属性 帐户激活
        eventId  : _.isEmpty(eventId) ? '' : eventId,// 活动Id
        userId   : _.isEmpty(userId) ? '' : userId,// 用户Id
    };

    return params;
}


// 创建订单后发送通知
exports.sendNoticeAfterOrderCreate = async function (req,orderStatus,orderInfo,buyer,totalPrice){

    try{
        const eventId      = orderInfo.eventId;// 获取id
        const eventUrl     = await Order.getEventShortUrl(eventId);
        // 活动信息
        const eventAttributeNames = ['id', 'title', 'organizers', 'tickets', 'onlineAddress', 'detailedAddress', 'bannerUrl', 'contact','startTime', 'endTime'];
        const eventInfo           = await Event.getEventById(eventId, eventAttributeNames);

        const auditPending = fixParams.ORDER_STATUS.ORDER_STATUS_AUDIT_PENDING; // 待审核
        let templateCode   =""; // 模板编码
        const sponsor = await  eventInfo.contact; // 主办方信息  
        let toData={};
        
        if ((orderStatus !== auditPending) && (0 === Number(totalPrice))) { // 不需要审核 不需要支付
            logger.debug('orderId = ',orderInfo.id,' 不需要审核，不需要支付');
            exports.sendNoticeAfterOrderPay(req,orderInfo.id);

        }else if(orderStatus === auditPending){
            // 需要审核的订单 event_order_pending
            logger.debug('orderId = ',orderInfo.id,' 需要审核');
            templateCode="event_order_pending";
            const functionType = fixParams.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
            toData={
                'eventUrl':eventUrl,'eventName':eventInfo.title,
                'startTime':moment(eventInfo.startTime).format('YYYY-MM-DD HH:mm:ss'),
                'endTime':moment(eventInfo.endTime).format('YYYY-MM-DD HH:mm:ss'),
                'name':buyer.name,'email':buyer.email
            };
            // 通知购票者
            exports.sendNotice(req,functionType,templateCode,'email',toData,{'email':buyer.email});

            // 通知主办方
            const toData2 = {
                'eventUrl':eventUrl,'eventName':eventInfo.title,'buyName':buyer.name,
                'orderUrl':settings.serverUrl+'/activityManage/'+eventId+'/order'
            };
            exports.sendNotice(req,functionType,'sponsor_order_pending','email',toData2,{'email':sponsor.email});

        }else if((orderStatus !== auditPending) && (0 !== Number(totalPrice))){
            // 不需要审核  待支付  支付完再发通知
            logger.debug('orderId = ',orderInfo.id,' 不需要审核，待支付,支付完再发通知');
        }

    }catch (err){
        logger.error('__sendNoticeAfterOrderCreate ',err);
    }

};


//门票订单支付成功后发通知 orderId：订单id
exports.sendNoticeAfterOrderPay = async function (req, orderId) {
    logger.debug('订单支付成功发送通知 ，订单id：', orderId);
    try {
        const functionType = fixParams.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
        const orderInfo = await Order.getOrderById(orderId, ['userId','buyer', 'attendees', 'eventId', 'cTime', 'eventUserId']);
        // 查询活动的所有者的邮件偏好设置,是否需要发送电子票
        const emailSetting = await User.getUserEmailSetting(orderInfo.eventUserId);
        if (emailSetting.isNeedAttendeeNotice) {
            logger.debug('需要发邮件')
             __sendETicketEmailAfterPay(req, orderInfo);
        }
        // 查看活动的短信设置,是否需要发送短信通知
        const isNeedSmsNotice = await Event.isNeedSmsNotice(orderInfo.eventId);
        if (isNeedSmsNotice) {
            logger.debug('需要发送短信')
             __sendETicketSmsAfterPay(req,orderInfo.orderNumber);
        }
    } catch (err) {
        logger.error('sendNoticeAfterOrderPay ', err);
    }

};

//短信邮件订单支付成功后发通知
exports.sendSmsEmailNoticeAfterOrderPay = async function (req, orderId) {
    try {
        const functionType  = fixParams.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
        const smsEmailOrder = await Notice.getSmsEmailOrderById(orderId, ['userId','orderNumber']); //短信邮件订单
        const orderNumber   = smsEmailOrder.orderNumber;  // 订单号
        const userId        = smsEmailOrder.userId;       //用户id
        const userInfo      = await User.getUserById(userId,['id','phone','email']); //用户信息
        const walletInfo    = await Wallet.getWalletByUserId(userId,['balanceEmail','balanceSMS']); //钱包信息
        let templateCode='';
        let toData={};
        if(orderNumber.startsWith('S')){        //短信充值
            templateCode = 'user_sms_recharge_ok'; 
            toData       = {num:walletInfo.balanceSMS+1};
        }
        if(orderNumber.startsWith('E')){       //邮件充值
            templateCode = 'user_email_recharge_ok'; 
            toData       = {num:walletInfo.balanceEmail+1};
        }
        exports.sendNotice(req, functionType,templateCode, 'sms', toData,userInfo);
    } catch (err) {
        logger.error('sendSmsEmailNoticeAfterOrderPay ', err);
    }

};

//发送邮件
async function __sendETicketEmailAfterPay(req,orderInfo){
    logger.debug('发邮件...')
    const functionType = fixParams.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
    try{
        const buyer     = orderInfo.buyer;           // 购买人信息
        const attendees = orderInfo.attendees;       // 参会者信息
        const eventId   = orderInfo.eventId;      // 获取id
        const eventUrl    = await Order.getEventShortUrl(eventId);
        const orderNumber = orderInfo.orderNumber;  // 订单号
        // 活动信息
        const eventAttributeNames = ['id', 'title', 'organizers', 'tickets', 'onlineAddress', 'detailedAddress', 'thumbnail', 'contact', 'startTime', 'endTime'];
        const eventInfo           = await Event.getEventById(eventId, eventAttributeNames);
        let receivers = [];  // 接收者
        // 生成pdf
        const attendeesLength = attendees.length;
        logger.debug('参会者人数',attendees.length);
        for (let i = 0; i < attendeesLength; i++) {
            let obj   = {};
            obj.email = attendees[i].collectInfo.email;
            obj.name  = attendees[i].collectInfo.name;
            if (buyer.email == attendees[i].collectInfo.email) {
                // 一个pdf生成多张电子票  以订单号命名  发给购票者
                const toReplaceData = await Order.getTicketReplaceData(eventInfo, orderInfo, attendees, req);// 拼装要进行替换的变量
                const pdfPath       = await Order.createETicket(orderInfo, orderNumber, toReplaceData, req);
                obj.pdfPath         = pdfPath;
                obj.pdfName         = orderNumber + '.pdf';
            } else {
                // 一个pdf生成单张电子票  以参会者id(即签到码)命名
                let attendeeInfos   = [attendees[i]];
                const toReplaceData = await Order.getTicketReplaceData(eventInfo, orderInfo, attendeeInfos, req);// 拼装要进行替换的变量
                const pdfPath       = await Order.createETicket(orderInfo, attendees[i].attendeeId, toReplaceData, req);
                obj.pdfPath         = pdfPath;
                obj.pdfName         = attendees[i].attendeeId + '.pdf';
            }
            receivers.push(obj);

        }
        const buyTime    = moment(orderInfo.cTime).format('YYYY-MM-DD HH:mm:ss');
        const sponsor = await  eventInfo.contact; // 主办方信息  
        let toData1      = {};
        // 通知参会者
        logger.debug('通知参会者')
        const receiversLength = receivers.length;
        for (let j = 0; j < receiversLength; j++) {
            toData1 = {
                'eventUrl'  : eventUrl, 'eventName': eventInfo.title,
                'startTime' : moment(eventInfo.startTime).format('YYYY-MM-DD HH:mm:ss'),
                'endTime'   : moment(eventInfo.endTime).format('YYYY-MM-DD HH:mm:ss'),
                'name'      : receivers[j].name, 'email': receivers[j].email, 'pdfName': receivers[j].pdfName,
                'zbfPhone'  : eventInfo.contact.mobile || '', 'zbfEmail': eventInfo.contact.email || '',
                'attachment': receivers[j].pdfPath
            };
            exports.sendNotice(req, functionType, 'event_order_paid', 'email', toData1, {'email': receivers[j].email});
        }

        //  通知主办方
        let toData2      = {};
        logger.debug('通知主办方')
        const attendeesCount = await Event.getAttendeeCountByeventId(eventId);
        let attends=[];
        _.each(attendees, function (item) {
            let obj={};
            obj.name=item.collectInfo.name;
            obj.email=item.collectInfo.email;
            obj.ticketName=item.codeObj.ticketName;
            obj.price=item.actualTicketPrice;   //下单价格
            obj.needAudit=item.currentTicketInfo.needAudit?'需要':'不需要';
            attends.push(obj);
        });
        toData2={
            'eventUrl'  : eventUrl, 'eventName': eventInfo.title,'attendeesCount':attendeesCount,
            'attends':attends,'totalPrice':orderInfo.totalPrice
        }
        exports.sendNotice(req, functionType, 'sponsor_order_payed', 'email', toData2, {'email': sponsor.email});


    }catch(err){
        logger.error('__sendETicketEmailAfterPay ', err);
    }
    

};


//发送短信
async function __sendETicketSmsAfterPay(req,orderNumber){
    logger.debug('发短信...')
    try {
        // 根据活动短信通知模板转换成短信的内容
        const orderInfoArr = await Order.getOrderInfo4TicketOrderPayResult(orderNumber);
        const orderInfo    = orderInfoArr[0];
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("NotExists", "orderNumber")
            });
        }

        const customSmsContent = orderInfo.customSmsContent;
        if ((_.isUndefined(customSmsContent)) || (_.isEmpty(customSmsContent))) { return; }
        const attendees = orderInfo.attendees;
        const eventUrl  = await Order.getEventShortUrl(orderInfo.eventId);
        for (let attendeeInfo of attendees) {
            const ticketUrl = await Order.getTicketShortUrl(orderInfo.orderNumber, attendeeInfo.attendeeId);
            let newOrderInfo = {

                mobile    : attendeeInfo.collectInfo.mobile || attendeeInfo.collectInfo.phone,
                eventId   : orderInfo.eventId,
                userId    : orderInfo.userId,
                name      : attendeeInfo.collectInfo.name,
                attendeeId: attendeeInfo.attendeeId,
                ticketUrl : ticketUrl,
                eventUrl  : eventUrl,

            };
            newOrderInfo.content = await Event.getSmsNoticeContent(customSmsContent, newOrderInfo);
            Order.sendETicketSmsAfterPay(req, newOrderInfo);
        }

    } catch (err) {
        logger.error('__sendETicketSmsAfterPay ', err);
    }
}


//发送参会者订单审核通知
exports.sendAuditNotice = async function (req, orderId,orderStatus) {
    const functionType = fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
    try{
        const orderInfo    = await Order.getOrderById(orderId);
        const eventInfo    = await Event.getEventById(orderInfo.eventId, ['id', 'title']);
        const userInfo     = await User.getUserById(orderInfo.eventUserId, ['email']);
        const eventUrl     = await Order.getEventShortUrl(eventInfo.id);
        const eventName    = eventInfo.title;
        const payUrl       = await Order.getOrderPayShortUrl(orderInfo.id,eventInfo.id);   //支付链接
        const toData1      = {'eventUrl': eventUrl, 'eventName': eventName, 'payUrl': payUrl}; //通过数据
        const toData2      = {
            'buyTime': moment(orderInfo.cTime).format('YYYY-MM-DD HH:mm:ss'), 'eventUrl': eventUrl, 'eventName': eventName,
            'email'  : userInfo.email
        };  //未通过数据
        const templateCode = orderStatus == 'audited' ? 'event_order_audited' : 'event_order_reject';
        const toData       = orderStatus == 'audited' ? toData1 : toData2;
        exports.sendNotice(req, functionType, templateCode, 'email', toData, {'email': orderInfo.buyer.email});
        //发送短信通知
        if(orderStatus=='audited'){
            const data={'eventName':eventName,'payUrl':payUrl}
            exports.sendNotice(req, functionType, 'event_order_audited', 'sms', data, {'phone': orderInfo.buyer.mobile});
        }
    }catch(err){
        logger.error('sendAuditNotice',err);
    }
   
}


//发送活动审核结果通知
exports.sendEventAuditNotice = async function(req,eventInfo){
    const functionType = fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
    const status       = eventInfo.status; //状态
    const eventName    = eventInfo.title;
    const eventUrl     = await Order.getEventShortUrl(eventInfo.id);
    let templateCode='';
    try{
        if(status=='auditRejected'){        //拒绝
            templateCode = 'event_status_auditRejected'; 
        }
        if(status=='hangUp'){                   //挂起
            templateCode = 'event_status_hangUp'; 
        }
        if(status=='published'){        //通过
            templateCode = 'event_create_ok'; 
        }
        const userInfo = await User.getUserById(eventInfo.userId, ['id', 'email']);
        exports.sendNotice(req, functionType,templateCode, 'email', {'eventName':eventInfo.title,'eventUrl':eventUrl}, userInfo);
    }catch(err){
        logger.error('sendEventAuditNotice',err);
    }
}

//发送用户实名认证审核通知
exports.sendUserAuditNotcie = async function(req,userInfo){
    const functionType = fp.SENDRECORD_ATTRIBUTE.ATTRIBUTE_SYSTEM;// 系统通知
    const status       = userInfo.realNameAuthentication.status; //状态
    const name         = userInfo.realNameAuthentication.name; //认证姓名
    let templateCode='';
    try{
        if(status=="auditFailure"){        //拒绝
            templateCode = 'user_certification_fail'; 
        }
        if(status=="auditThrough"){                   //通过
            templateCode = 'user_certification_ok'; 
        }
        exports.sendNotice(req, functionType,templateCode, 'sms', {'name':name}, {'id':userInfo.id,'phone':userInfo.phone});
    }catch(err){
        logger.error('sendUserAuditNotcie',err);
    }

}







