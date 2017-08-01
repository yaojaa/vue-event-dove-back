const _ = require('lodash');
const Invitation = require('../model/invitation');
const Event = require('../model/event');
const fixParams = require('../util/fixParams');
const errorCodes = require('../util/errorCodes.js').ErrorCodes;
const util = require('../util/util.js').ErrorCodes;
const QRCode = require('qrcode');
const readFile = require('fs-readfile-promise');
const fs = require('fs-extra');
const publicFilePathPrefix = 'public/files/invitations/';
const settings = require("../conf/settings");
const loggerSettings = require('../logger');
const logger = loggerSettings.winstonLogger;
const serverUrl = require("../conf/settings").serverUrl;
const Canvas = require('canvas');
const Image = Canvas.Image;
const moment = require('moment')
const gm = require('gm')


/**
 * 根据JSON插入邀请函模板
 */

exports.insertWxTemplate = async function(req, res, next) {
    req.checkBody('tplJson').notEmpty();
    console.log(req.body.tplJson)
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        return res.json({
            statusCode: 400,
            errorCode: errorCodes.ERR_INVALID_PARAMETERS,
            responseText: result.array()
        })
    }
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    let tplJson = req.body.tplJson
    try {
        let result = await Invitation.insertInvitationTemplate(tplJson)
        //catch不到 数据库重复插入的错误
        // 如：{"errorCode":2,"responseText":{"deleted":0,"errors":1,"first_error":"Duplicate primary key `id`:\n{\n\t\"addre0\n}","inserted":0,"replaced":0,"skipped":0,"unchanged":0}}
        if (result.errors) {
            return next({
                statusCode: 400,
                errorCode: errorCodes.ERR_INTERNAL_SERVER,
                responseText: result
            })
        } else {
            return next({
                statusCode: 200,
                errorCode: errorCodes.COMMON_SUCCESS,
                responseText: result
            })
        }

    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        })
    }

}


/**
 * 查找参会人员
 */
exports.searchAttendees = async function(req, res, next) {

}



/**
 * 自动发送邀请函开关
 */
exports.updateAutosend = async function(req, res, next) {
    req.checkBody('eventId').notEmpty();
    req.checkBody('autoSend').notEmpty();

    req.getValidationResult().then(function(result) {
        if (!result.isEmpty()) {
            res.status(400).send('There have been validation errors: ' + result.array());
            return;
        }
    })

    try {
        await Event.updateSendWXInvitation(req.body.eventId, req.body.autoSend);
        return next({
            statusCode: 200,
            errorCode: errorCodes.COMMON_SUCCESS,
            responseText: "OK"
        });
    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        });
    }
}

/**
 * 修改Event所使用的模板Id，并非更新
 */
exports.updateTemplate = async function(req, res, next) {
    req.check('eventId').notEmpty()
    req.check('templateId').notEmpty()

    req.getValidationResult().then(function(result) {
        if (!result.isEmpty()) {
            res.status(400).send('validation errors: ' + result.array());
            return;
        }
    })


    try {
        await Event.updateInvitationTemplate(req.body.eventId, req.body.templateId);
        return next({
            statusCode: 200,
            errorCode: errorCodes.COMMON_SUCCESS,
            responseText: "ok" + req.body.templateId
        })

    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message
        })
    }
}



/**
 * 生成微信邀请函 jia_yao@eventown.com
 * @param attendees 组装好的参会者信息{attendeeId: xxx, name: yyy}
 * @param templateId 模版ID
 * @param eventId 活动ID
 * to do  二维码地址为二级域名的情况
 */

exports.generateWXInvitations = generateWXInvitations = async function(req, res, next) {
    req.checkBody('templateId').notEmpty();
    req.checkBody('eventId').notEmpty();
    req.checkBody('attendees').notEmpty(); // {attendeeId: 927168, name: yyy}
    req.getValidationResult().then(function(result) {
        if (!result.isEmpty()) {
            res.status(400).send('validation errors: ' + JSON.stringify(result.array()));
            return;
        }
    })

    const eventId = req.body.eventId;
    const attendees = req.body.attendees

    // 获得模板和会议详情
    try {
        const template = await Invitation.getInvitationTemplateById(req.body.templateId);
        //有活动二级域名的情况二维码生成规则要对应！
        const eventInfo = await Event.getEventById(eventId, ['id', 'title', 'startTime', 'endTime', 'country', 'province', 'city', 'detailedAddress']);
        //创建图片存储目录  临时 临时 临时...
        let tmpfolder = fs.mkdtempSync(publicFilePathPrefix)
            //生成二维码 到临时目录
        await __QRCodeToFile(tmpfolder, eventInfo.id, serverUrl, template)

        //生成邀请函
        __genInvitationsByTpl(tmpfolder, attendees, template, eventInfo).then((res) => {
            return next({
                statusCode: 200,
                errorCode: errorCodes.COMMON_SUCCESS,
                responseText: res
            })
        })

    } catch (e) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER,
            responseText: e.message,
        });
    }
}

function __QRCodeToFile(publicFilePathPrefix, eventId, serverUrl, template) {
    return new Promise(function(resolve, reject) {
        QRCode.toFile(publicFilePathPrefix + '/qr.png', serverUrl + '/site/' + eventId, {
            color: {
                dark: template.qrCode.color.dark,
                light: template.qrCode.color.light
            }
        }, function(err) {
            if (err) reject(err);
            console.log(publicFilePathPrefix + '/qr.png', '生成成功！')
            resolve()
        })
    })
}

async function __genInvitationsByTpl(tmpfolder, attendees, template, event) {

    try {
        let gmObj = gm(publicFilePathPrefix + 'templates/' + template.path)
        gmObj.font('public/font/msyahei.ttf')
            //draw event address
        if (template.address) {
            gmObj.fill(template.address.color || '#ffffff')
            gmObj.fontSize(template.address.font || 30)
                .drawText(template.address.x, template.address.y, event.country + event.province + event.city + event.detailedAddress)
        }
        //draw event date
        if (template.date) {
            gmObj.fontSize(template.date.font)
                .fill(template.date.color || '#ffffff')
                .drawText(template.date.x, template.date.y, moment(event.startTime).format('YYYY-MM-DD HH:MM') + '~' + moment(event.endTime).format('MM-DD HH:MM'));
        }

        //draw event guest
        if (template.guest) {
            gmObj.fontSize(template.date.font)
                .fill(template.guest.color || '#ffffff')
                .drawText(template.guest.x, template.guest.y, attendees.name)
        }
        //write png
        return new Promise((resolve, reject) => {
            gmObj.write(tmpfolder + '/' + attendees.attendeeId + '.png', (err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(tmpfolder + '/' + attendees.attendeeId + '.png')
            })

        })

    } catch (e) {
        console.log(e)
    }
}

/**
 * 发送微信邀请函 jia_yao@eventown.com
 * @param attendees 组装好的参会者信息{attendeeId: xxx, name: yyy}
 * @param templateId 模版ID
 * @param eventId 活动ID
 */

const __FindAttendeesByParam = function(filed, value) {

}

exports.sendWXInvaitations = function(req, res, next) {
    req.checkBody('attendees').notEmpty();
    req.checkBody('templateId').notEmpty();
    req.checkBody('eventId').notEmpty();


    let attendees = attendees.split(',')

    for (var i = attendees.length - 1; i >= 0; i--) {
        let filed = util.getSearchType(attendees[i])
        __FindAttendeesByParam(filed, attendees[i])
    }

    __.sendImgToWX()

}