const fixParams  = require('../util/fixParams');
const thinky     = require('../util/thinky.js');
const myutil     = require('../util/util');
const r          = thinky.r;
const type       = thinky.type;
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

const InvitationTemplateFields = {
    id : type.string().required(),
    userId : type.string(), //用户自定义模板 预留
    name : type.string(),
    bgimg : type.string().required(),
    width : type.number().integer(),
    height : type.number().integer(),
    title : {
        fontSize : type.number(),
        fill : type.string(),
        align : type.string().enum(
            fixParams.TEXT_ALIGN.CENTER,
            fixParams.TEXT_ALIGN.END,
            fixParams.TEXT_ALIGN.LEFT,
            fixParams.TEXT_ALIGN.RIGHT,
            fixParams.TEXT_ALIGN.START
        ).default(fixParams.TEXT_ALIGN.CENTER),
        x : type.number().integer(),
        y : type.number().integer()
    },
    date : {
        fontSize : type.number(),
        fill : type.string(),
        align : type.string().enum(
            fixParams.TEXT_ALIGN.CENTER,
            fixParams.TEXT_ALIGN.END,
            fixParams.TEXT_ALIGN.LEFT,
            fixParams.TEXT_ALIGN.RIGHT,
            fixParams.TEXT_ALIGN.START
        ).default(fixParams.TEXT_ALIGN.CENTER),
        x : type.number().integer(),
        y : type.number().integer()
    },
    address : {
        fontSize : type.number(),
        fill : type.string(),
        align : type.string().enum(
            fixParams.TEXT_ALIGN.CENTER,
            fixParams.TEXT_ALIGN.END,
            fixParams.TEXT_ALIGN.LEFT,
            fixParams.TEXT_ALIGN.RIGHT,
            fixParams.TEXT_ALIGN.START
        ).default(fixParams.TEXT_ALIGN.CENTER),
        x : type.number().integer(),
        y : type.number().integer()
    },
    guest : {
        fontSize : type.number(),
        fill : type.string(),
        align : type.string().enum(
            fixParams.TEXT_ALIGN.CENTER,
            fixParams.TEXT_ALIGN.END,
            fixParams.TEXT_ALIGN.LEFT,
            fixParams.TEXT_ALIGN.RIGHT,
            fixParams.TEXT_ALIGN.START
        ).default(fixParams.TEXT_ALIGN.CENTER),
        x : type.number().integer(),
        y : type.number().integer()
    },
    qrCode : {
        // fill : {
        //     dark: type.string().default('#000000'),
        //     light: type.string().default('#FFFFFF')
        // },
        x : type.number().integer(),
        y : type.number().integer(),
        width : type.number().integer(),
        height : type.number().integer()
    },
    cTime : type.date(),
    uTime : type.date()
};

const INVITATION_TEMPLATE_TABLE = 'InvitationTemplate';
const allInvitationTemplateColumns = myutil.getKeyArrayFromObject(InvitationTemplateFields);
const InvitationTemplate = thinky.createModel(INVITATION_TEMPLATE_TABLE, InvitationTemplateFields);
InvitationTemplate.ensureIndex('userId');
exports.InvitationTemplateFields = InvitationTemplateFields;
exports.InvitationTemplateModel = InvitationTemplate;

exports.getInvitationTemplateById = function (id) {
    return r.table(INVITATION_TEMPLATE_TABLE).get(id);
}

exports.insertInvitationTemplate= function (json) {

    let tpl = new InvitationTemplate(json)
    tpl.id  = myutil.nextId();
    return tpl.save();
}
