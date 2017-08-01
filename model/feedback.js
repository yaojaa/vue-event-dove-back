"use strict";
const fixParams = require('../util/fixParams');
const thinky = require('../util/thinky.js');
const myutil = require('../util/util');
const nextId = myutil.nextId;
const r = thinky.r;
const type = thinky.type;
const qiniu = require("qiniu");
const moment = require('moment');
const config = require("../conf/settings");
const uuid = require("uuid");
const _    = require("lodash");
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;


const FEED_BACK_TABLE = 'Feedback';

const FeedBackFields = {
    id      : type.string(),
    content : type.string(),
    utime   : type.date().default(function () {
        return new Date();
    }),// 修改时间
    ctime: type.date().default(function () {
        return new Date();
    }),// 创建时间
    imageSrc: type.string(),//截图存放地址
    audited: type.boolean().default(false),
    fbType: type.string().enum(
        fixParams.FEEDBACK_TYPE.FEEDBACK_TYPE_PROBLEM,
        fixParams.FEEDBACK_TYPE.FEEDBACK_TYPE_DEMAND,
        fixParams.FEEDBACK_TYPE.FEEDBACK_TYPE_SUGGESTION,
        fixParams.FEEDBACK_TYPE.FEEDBACK_TYPE_OTHER
    )
};

const Feedback = thinky.createModel(FEED_BACK_TABLE, FeedBackFields);
Feedback.ensureIndex('ctime');
Feedback.ensureIndex('audited');
Feedback.ensureIndex('fbType');

//增加反馈
exports.addFeedback =async function (feedback) {
    let { upImg, src, content, title, type} = feedback;
    src = src.replace(/^data:image\/\w+;base64,/, "");
    let uploadImage = new Promise((resolve, reject) => {
        if(src==='null'){
            return resolve(null);
        }
        src = new Buffer.from(src, 'base64');
        let mac = new qiniu.auth.digest.Mac(config.qiniu.accessKey, config.qiniu.secretKey);
        let qiniuOptions = {
            scope: config.qiniu.bucket
        };
        let putPolicy = new qiniu.rs.PutPolicy(qiniuOptions);
        let uploadToken = putPolicy.uploadToken(mac);
        let formUploader = new qiniu.form_up.FormUploader(config);
        let putExtra = new qiniu.form_up.PutExtra();

        formUploader.put(uploadToken, 'fb-' + uuid.v1() + '.png', src, putExtra, function (respErr, respBody, respInfo) {
            if (respErr) {
                reject(respErr);
            }
            if (respInfo.statusCode === 200) {
                resolve(respBody.key);
            } else {
                reject(respBody);
            }
        });

    })
        .catch((err)=>{
         throw  err
        });
    uploadImage.then((imageName)=>{
        let fd={
            id       : nextId(),
            fbType   : type,
            content  : content,
            imageSrc : imageName
        };
        return Feedback.save(fd).catch((err)=>{
           throw  err
        })
      }).catch(err=>{
        throw  err.message
    })
};

//查询反馈
exports.getFeedbackList = async function(params){
    var feedbackFilter =__buildFeedbackFilter(params);
    var totalCount  = parseInt(params.total) || -1;// 总记录数
    var page        = parseInt(params.page) || 1;// 第几页
    var limit       = parseInt(params.limit) || 10;// 每页显示记录数
    var skip        = ( page - 1 ) * limit;
    var orderBy     = params.orderBy || "id";

    var items =  await feedbackFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit).run();

    if (totalCount === -1) {
        totalCount = await feedbackFilter.count().execute();
    }

    return {items: items, count: totalCount};

};
//更改审核状态
exports.updateFeedbackStatus = function (feedbackId,status) {
    const standard =['false','true'];
    let uTime      = new Date();
    let boolean = new Boolean(status).valueOf();
    if (standard.indexOf(status) === -1)
        throw Error('status undefined');
    return Feedback.filter({id: feedbackId}).update({uTime: uTime, 'audited':boolean }).run();
};
//拼装检索条件
function __buildFeedbackFilter(params) {
        let id = params.id;
        let startDate = params.startDate;
        let endDate = params.endDate;
        let audited = params.audited;
        let FeedbackFilter = Feedback;
        //过滤器
        if (startDate && endDate) {
            startDate = moment(startDate);
           endDate = moment(endDate);
            let startYear = Number(startDate.format('YYYY'));
            let startMonth = Number(startDate.format('MM'));
            let startDay = Number(startDate.format('DD'));
            let endYear = Number(endDate.format('YYYY'));
            let endMonth = Number(endDate.format('MM'));
            let endDay = Number(endDate.format('DD'));
            let startRTime = r.time(startYear, startMonth, startDay, 'Z');
            let endRTime = r.time(endYear, endMonth, endDay, 'Z');
            FeedbackFilter = FeedbackFilter.filter(
                function (post) {
                  return  post('cTime').during(startRTime, endRTime, {leftBound: "open", rightBound: "open"})
                }
            );
        }

    return FeedbackFilter;
}
