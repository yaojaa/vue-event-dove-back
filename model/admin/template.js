const _         = require('lodash');
const myutil    = require('../../util/util.js');
const thinky    = require('../../util/thinky.js');
const type      = thinky.type;
const r         = thinky.r;
const nextId    = myutil.nextId;
const settings  = require("../../conf/settings");
const loggerSettings = require('../../logger');
const logger         = loggerSettings.winstonLogger;
const fixParams = require('../../util/fixParams.js');
const Promise   = require('bluebird');

const TemplateFields = {
    id          : type.string(),
    templateName: type.string().required(),// 模板名称
    templateUrl : type.string().required(),// 模板地址
    styles      : [{
        styleId  : type.string(),
        styleName: type.string(),// 样式名称
        styleUrl : type.string(),// 样式地址
        isDelete : type.boolean().default(false)// 是否删除
    }],
    isDelete    : type.boolean().default(false),// 是否删除
    cTime       : type.date(),// 创建时间
    uTime       : type.date()// 修改时间
};

const Template         = thinky.createModel("Template", TemplateFields);
exports.TemplateModel  = Template;
exports.TemplateFields = TemplateFields;

// 短信邮件模板表
const EmailSmsTemplateFields = {
    id             : type.string(),
    templateCode   : type.string(),// 编码  标识
    templateName   : type.string().required(),// 模板名称
    templateDesc   : type.string().required(),// 模板简介
    templateContent: type.string().required(),// 模板内容
    templateType   : type.string().enum(
        fixParams.SMS_EMAIL_TEMPLATE_TEMPLATE_TYPE.TEMPLATE_TYPE_SMS,
        fixParams.SMS_EMAIL_TEMPLATE_TEMPLATE_TYPE.TEMPLATE_TYPE_EMAIL
    ).required(),// 模板类型
    cTime          : type.date().default(function () { return new Date();}),// 创建时间
    uTime          : type.date().default(function () { return new Date();}),// 修改时间
    userId         : type.string().default('system'),// 创建此模板的用户id,当用户id为system代表为系统模板表
};

const EmailSmsTemplate         = thinky.createModel("EmailSmsTemplate", EmailSmsTemplateFields);
exports.EmailSmsTemplateModel  = EmailSmsTemplate;
exports.EmailSmsTemplateFields = EmailSmsTemplateFields;

const _INDICES = ['templateName', 'templateType', 'userId'];
_.each(_INDICES, function (index) {
    EmailSmsTemplate.ensureIndex(index);
});

exports.addTemplate = function (data) {
    const template = new Template(data);
    template.id    = nextId();
    template.cTime = new Date();

    return template.save();
};

exports.updateTemplate = function (id, data) {
    data.uTime = new Date();
    return Template.get(id).update(data).run();
};

exports.deleteTemplate = function (id) {
    data.uTime = new Date();
    return Template.get(id).update({isDelete: true, uTime: new Date()}).run();
};

exports.updateStyle = function (id, styleInfo) {
    data.uTime = new Date();
    return Template.filter(
        function (doc) {
            return id.eq(doc("id"));
        }
    ).update({
        receivers: r.row("styles").map(
            function (style) {
                return r.branch(
                    style("styleId").eq(styleInfo.styleId),
                    style.merge(style),
                    style
                );
            })
    }).run();
};

exports.findTemplateById = function (id) {
    return Template.get(id).run();
};

exports.findStyleById = function (id) {
    return Template.get(id).run();
};

exports.findTemplateByTemplateName = function (templateName) {
    return Template.getAll(templateName, {index: 'templateName'}).run();
};

exports.getCountByTemplateName = function (templateName, options) {
    return Template.filter({templateName: templateName}).count().execute();
};

exports.getAllWithPageIndex = function (params, attributeNames) {
    const columns        = _.isEmpty(attributeNames) ? _.keys(TemplateFields) : attributeNames;
    const templateFilter = __buildTemplateFilter(params);
    let totalCount       = parseInt(params.total) || -1;     // 总记录数
    const page           = parseInt(params.page) || 1;      // 第几页
    const limit          = parseInt(params.limit) || 10;     // 每页显示记录数
    const skip           = ( page - 1 ) * limit;
    const orderBy        = params.orderBy || "id";

    const items = templateFilter.orderBy(r.desc(orderBy)).slice(skip, skip + limit).pluck(columns).run();

    if (totalCount === -1) {
        totalCount = templateFilter.count().execute();
    }
    return Promise.props({items: items, count: totalCount});
};

function __buildTemplateFilter(params) {
    const templateName = params.templateName;
    const sTime        = params.sTime;
    const eTime        = params.eTime;
    let templateFilter = Template.filter({isDelete: false});

    if (!_.isEmpty(templateName)) {
        templateFilter.filter({templateName: templateName});
    }

    if (!_.isEmpty(sTime) && !_.isEmpty(eTime)) {
        const sTime_Arr = sTime.split('-');
        const eTime_Arr = eTime.split('-');
        templateFilter  = templateFilter.filter(function (post) {
            return post("cTime").during(r.time(Number(sTime_Arr[0]), Number(sTime_Arr[1]), Number(sTime_Arr[2]), 'Z'), r.time(Number(eTime_Arr[0]), Number(eTime_Arr[1]), Number(eTime_Arr[2]), 'Z'));
        });
    }

    return templateFilter;
}



const Dao = exports.Dao={

    //根据id获取
    getById:function(id){
        return r.table("EmailSmsTemplate").get(id);
    },
    getByName:function(name){
        return r.table("EmailSmsTemplate").filter({'templateName':name}).run();
    },
    getEmailTemplateByCode : async function (code, options) {
        const templateInfo =  await r.table("EmailSmsTemplate").filter({'templateCode':code,'templateType':'email'}).run();
        return templateInfo[0];
    },
    getSmsTemplateByCode : async function (code, options) {
        const templateInfo =  await r.table("EmailSmsTemplate").filter({'templateCode':code,'templateType':'sms'}).run();
        return templateInfo[0];
    },

    list:function(params,attributeNames){
        attributeNames  = _.isEmpty(attributeNames) ? _.keys(EmailSmsTemplateFields) : attributeNames;
        const modelFilter = __buildFilter(params);
        let totalCount  = parseInt(params.total) || -1;// 总记录数
        const page        = parseInt(params.page) || 1;// 第几页
        const limit       = parseInt(params.limit) || 10;// 每页显示记录数
        const skip        = ( page - 1 ) * limit;
        const orderBy     = params.orderBy || "sort";
        const items     = modelFilter.orderBy(r.row(orderBy)).slice(skip, skip + limit).pluck(attributeNames).run();
        if (totalCount === -1) {
            totalCount = modelFilter.count().execute();
        }
        return Promise.props({items: items,count: totalCount});

    },

    add:function(contact){
        let _contact = new EmailSmsTemplate(contact);
        _contact.id  = nextId();
        return _contact.save();
    },
    update:function(data){
        const id   = data.id;
        data.uTime = new Date();
        return EmailSmsTemplate.get(id).update(data).run();
    },
    del:function(id){
        return EmailSmsTemplate.get(id).delete().execute();
    }


};


// 拼装搜索条件
function __buildFilter(params) {
    const name       = params.name;
    const type       = params.type;
    let modelFilter = EmailSmsTemplate;
    if (!_.isUndefined(name) && !_.isEmpty(name)&&name!=='') {
        modelFilter = modelFilter.filter(r.row('templateName').match(name));
    }
    if (!_.isUndefined(type) && !_.isEmpty(type)&&type!=='' ) {
        modelFilter = modelFilter.filter(r.row('templateType').match(type));
    }

    
    
    
    return modelFilter;
}

