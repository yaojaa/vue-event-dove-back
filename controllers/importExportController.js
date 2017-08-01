/**
数据导入导出  Controller
@class importExportController
@author :lwp
@date:  :2017-07-06
@version : 0.1.0 
*/
const _          = require('lodash');
const myutil     = require('../util/util.js');
const thinky     = require('../util/thinky.js');
const settings   = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const Promise    = require('bluebird');
const errorCodes = require('../util/errorCodes.js').ErrorCodes;
const Order      = require('../model/order');
const Event      = require('../model/event');
const moment     = require('moment');
const fs         = require('fs');
const archiver   = require('archiver');
const path       = require('path');


/**
url ：/export/{name}
name{
    invoices: 发票
}
**/

//导出数据
async function exportData(req, res, next) {
    const name    =req.param('name'); //数据名  文件夹名
    const params  = req.query;
    const eventId = params.eventId;   //活动id

    if (_.isEmpty(eventId)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'eventId')
        });
    }
    try {
        let filePath = __getExportExcelPath(eventId,name); //获取路径

        if(name==='invoices'){  //发票
            __createInvoiceExcel(req, filePath);  //创建excel
            return res.status(200).send({filePath: filePath});
        }else{
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__('illegal_operation')
            });
        }
        
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
    
}


//导出发票excel
async function __createInvoiceExcel(req, filePath) {

    const params  = req.query;
    const eventId = params.eventId;

    logger.debug('eventId=' + eventId + '正在创建导出发票excel数据...');

    const eventAttributeNames = ['id', 'title', 'startTime', 'endTime', 'detailedAddress', 'onlineAddress', 'collectItems'];
    const eventInfo           = await Event.getEventById(eventId, eventAttributeNames);   //活动信息
    const eventTitle    = eventInfo.title;
    const eventTime     =await Event.getEventTimeStr(eventInfo);
    const eventLocation =await Event.getEventLocation(req, eventInfo);

    const attendeesData = await __getInvoicesData(req, eventInfo);    //excel数据

    const sheets        = [
        {
            name   : req.__('attendees_sheet_name'),
            info   : [
                req.__('attendees_event_name', eventTitle),
                req.__('attendees_event_time', eventTime),
                req.__('attendees_event_location', eventLocation),
            ],
            headers: attendeesData.headers,
            data   : attendeesData.data
        }
    ];

    logger.debug('eventId=' + eventId + '导出发票excel数据完成...');
    myutil.createExcel(sheets, filePath);
}

// 获取导出发票列表的excel数据
async function __getInvoicesData(req, eventInfo) {
    /**
    [ "订单号", "购票人", "手机","邮箱", "开票状态", "开票总额", "领取方式", "开票类型", "开票人姓名",
        "抬头", "纳税人识别号", "公司注册地址", "公司财务电话", "公司开户行", "银行账号", "联系方式",
        "邮寄地址", "快递信息", "快递单号", "发票号"
    ]
    **/

    //表头
    let  headers = [
        req.__('attendees_headers_orderNumber'),req.__('attendees_headers_invoiceMan'),req.__('attendees_headers_mobile'),
        req.__('attendees_headers_email'),req.__('attendees_headers_invoiceStatus'),req.__('attendees_headers_invoiceAmount'),req.__('attendees_headers_getWay'),
        req.__('attendees_headers_invoiceType'),'开票人姓名',req.__('orders_headers_invoiceTitle'),
        '纳税人识别号',req.__('orders_headers_companyAddress'),req.__('orders_headers_companyPhoneNumber'),
        req.__('orders_headers_companyBank'),req.__('orders_headers_companyBankAccount'),'联系方式',
        '邮寄地址','快递信息','快递单号','发票号'
        
    ];
    let exportDatas = [];   //要导出的数据
    let params  = req.query;
    let eventId = params.eventId;   //活动id

    // 根据活动id查询所有订单
    const orderAttributeNames = ['orderNumber','buyer','invoice','invoiceSetting'];
    let orderList           = await Order.getOrderByEventId(eventId, orderAttributeNames);
    const orderStatusList   = await Order.getOrderStatusList(req);// 查询开票zhua
    const invoiceTypeList   = await Event.getInvoiceTypeList(req);// 所有开票类型
    const invoiceStatusList   = await Event.getInvoiceStatusList(req);// 所有开票状态
    const invoiceReceiveTypeList   = await Event.getDeliverMethodList(req);// 发票领取方式
    

    for (let orderInfo of orderList) {

        let rowData = [];  //每一行的数据
        let orderNumber = orderInfo.orderNumber || '';// 订单号
        const buyerName       = orderInfo.buyer.name || '';// 购票人
        const buyerEmail       = orderInfo.buyer.email || '';// 邮箱
        const buyermobile       = orderInfo.buyer.mobile || '';// 手机

        const i18nInvoiceType = _.find(invoiceTypeList, {name: orderInfo.invoiceSetting.type});
        const invoiceType     = _.isUndefined(i18nInvoiceType) ? '' : i18nInvoiceType.str;// 发票类型

        const i18nInvoiceReceiveType = _.find(invoiceReceiveTypeList, {name: orderInfo.invoiceSetting.deliverMethod});
        const invoiceReceiveType     = _.isUndefined(i18nInvoiceReceiveType) ? '' : i18nInvoiceReceiveType.str;// 领取类型


        rowData.push(orderNumber);     //订单号
        rowData.push(buyerName);     //购票人
        rowData.push(buyermobile);      //手机
        rowData.push(buyerEmail);      //邮箱
        
        let invoice          = orderInfo.invoice;       //每个订单的发票列表
        let resultOrdersData = [];
        _.each(invoice, function (invoiceInfo) {

            let newOneOrderInfo = _.cloneDeep(rowData);
            const invoiceId               =invoiceInfo.invoiceId||''; //发票号
            const invoiceTitle              = invoiceInfo.title || '';// 发票抬头
            const taxID                     = invoiceInfo.taxRegistrationCertificateNumber || '';// 税务登记证号码
            const companyRegisteredAddress  = invoiceInfo.companyRegisteredAddress || '';// 公司注册地址
            const companyFinancialTelephone = invoiceInfo.companyFinancialTelephone || '';// 公司财务电话
            const companyAccountName        = invoiceInfo.companyAccountName || '';// 公司开户行(详细到支行)
            const companyAccount            = invoiceInfo.companyAccount || '';// 银行账号
            const receiver                  = invoiceInfo.receiver || '';// 收件人
            const contact                   = invoiceInfo.contact || '';// 联系电话
            const address                   = invoiceInfo.address || '';// 收件人地址
            const status                   = invoiceInfo.invoiceStatus || '';// 开票状态
            const amount                   =invoiceInfo.invoiceAmount||''; //开票金额
            const deliverName           =invoiceInfo.deliverInformation?invoiceInfo.deliverInformation.deliverName:'';//快递信息
            const deliverNumber         =invoiceInfo.deliverInformation?invoiceInfo.deliverInformation.deliverNumber:'';//快递单号
            const i18nInvoiceStatus = _.find(invoiceStatusList, {name:status});
            const invoiceStatus     = _.isUndefined(i18nInvoiceStatus) ? '' : i18nInvoiceStatus.str;

            
            newOneOrderInfo.push(invoiceStatus);     //开票状态
            newOneOrderInfo.push(amount);     
            newOneOrderInfo.push(invoiceReceiveType);    //领取方式  
            newOneOrderInfo.push(invoiceType);     //开票类型
            newOneOrderInfo.push(receiver);     //开票人姓名
            newOneOrderInfo.push(invoiceTitle);     //抬头
            newOneOrderInfo.push(taxID);     //纳税人识别号
            newOneOrderInfo.push(companyRegisteredAddress); 
            newOneOrderInfo.push(companyFinancialTelephone);     
            newOneOrderInfo.push(companyAccountName); 
            newOneOrderInfo.push(companyAccount);  
            newOneOrderInfo.push(contact);  
            newOneOrderInfo.push(address);  
            newOneOrderInfo.push(deliverName);      //快递信息
            newOneOrderInfo.push(deliverNumber);      //快递单号
            newOneOrderInfo.push(invoiceId);  //发票号   

            resultOrdersData.push(newOneOrderInfo);
        });

        _.each(resultOrdersData, function (tmpOneOrderInfo) {
            exportDatas.push(tmpOneOrderInfo);
        });    
    }
    //console.log(exportDatas);
    return {data: exportDatas, headers: _.uniq(headers)};

}


// 获取excel文件的路径
function __getExportExcelPath(name,folderName) {
    const appDir     = myutil.getAppDir();
    const fileName   = name + '.xlsx';
    const filePath   = path.join("public/files/", folderName, fileName);
    return filePath;
}

// 文件是否存在
async function fileItexist(req, res, next) {
    const params   = req.query;
    const filePath = params.filePath;
    if (_.isEmpty(filePath)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'filePath')
        });
    }
    const isAllow = _.startsWith(filePath, 'public');
    if (!isAllow) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('illegal_operation')
        });
    }
    try {
        const isWriteComplete = await myutil.waitForWirtenCompleted(filePath);
        return res.status(200).send({isWriteComplete: isWriteComplete});
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}


//下载文件
function downloadFile(req, res, next) {
    const params   = req.query;
    const filePath = params.filePath;
    if (_.isEmpty(filePath)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('Empty', 'filePath')
        });
    }
    const isAllow = _.startsWith(filePath, 'public');
    if (!isAllow) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('illegal_operation')
        });
    }
    const fileExists = myutil.fsExistsSync(filePath);
    if (!fileExists) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__('NotExists', 'filePath')
        });
    }
    return res.download(filePath);
}





exports.exportData           	  = exportData;
exports.fileItexist              = fileItexist;
exports.downloadFile                = downloadFile;


