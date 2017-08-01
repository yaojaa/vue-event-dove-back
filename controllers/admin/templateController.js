'use strict';

const _           = require('lodash');
const thinky      = require('../../util/thinky.js');
const r           = thinky.r;
const fs          = require('fs');
const fp          = require('../../util/fixParams.js');
const myutil      = require('../../util/util.js');
const settings    = require("../../conf/settings");
const loggerSettings = require('../../logger');
const logger         = loggerSettings.winstonLogger;
const assert      = require('assert');
const template = require('../../model/admin/template.js');
const Promise     = require('bluebird');
const errorCodes  = require('../../util/errorCodes.js').ErrorCodes;
const path       = require('path');
const moment     = require('moment');

exports.addTemplate     = addTemplate;
exports.updateTemplate  = updateTemplate;
exports.deleteTemplate  = deleteTemplate;
exports.updateStyle     = updateStyle;
exports.deleteStyle     = deleteStyle;
exports.uploadFiles     = uploadFiles;

exports.getList           = getList;
exports.add               = add;
exports.update            = update;
exports.del               = del;
exports.getByName         = getByName;



//获取列表
async function getList(req, res, next) {
    const params = req.query;
    try {
        let data = await template.Dao.list(params);
        data = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);    //分页
        return res.status(200).send(data);
        //res.send(data);
    } catch (err) {
        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
    }

}
//添加
async function add(req, res, next) {
    const body = req.body;
    const purenessReq = myutil.getPurenessRequsetFields(body, template.EmailSmsTemplateFields);    // 准备需要插入数据库的数据   
    try{
        const saveRet  = await template.Dao.add(purenessReq);
        return res.status(200).send(saveRet);
    }catch(err){
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}
//修改
async function update(req, res, next) {
    const body = req.body;
    const updateData = myutil.getPurenessRequsetFields(body, template.EmailSmsTemplateFields);    // 准备需要插入数据库的数据   
    try{
        const result  = await template.Dao.update(updateData);
        return res.status(200).send(result);
    }catch(err){
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}
//删除
async function del(req, res, next) {
    const body = req.body;
    const id   = body.id;
    if (_.isUndefined(id) || _.isEmpty(id)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
        });
    }
    try {
        const result = await template.Dao.del(id);
        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}

//根据模板名获取
async function getByName(req,res,next){
    const name = req.param('name')
    if (_.isUndefined(name) || _.isEmpty(name)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'name')
        });
    }
    try {
        const result = await template.Dao.getByName(name);
        return res.status(200).send(result[0]);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
    
}

// 添加模板
function addTemplate(req, res, next) {
    var body = req.body;
    if (!myutil.checkMandatory(["templateName", "templateUrl"], body)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("err_invalid_req_parameters")
        });
    };
    var templateName = body.templateName;
    const doSomething = Promise.coroutine(function*() {
        try {
            var count = yield template.getCountByTemplateName(templateName);
            if (count <= 0) {
                var purenessReq = myutil.getPurenessRequsetFields(body, template.TemplateFields);    // 准备需要插入数据库的数据
                // var styles = purenessReq.styles;
                // _.each(styles, function (style,index) {
                //     purenessReq.styles.items[index].styleId = nextId();
                // });
                var saveRet = yield template.addTemplate(purenessReq);

                res.status(200).send(saveRet);
            } else {
                return next({
                    errorCode   : errorCodes.ADDRESS_BOOK_EMAIL_EXISTS,
                    responseText: req.__("Exists", "templateName")
                });
            }
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__("err_internal_server")
            });
        }
    })();
};

// 修改模版
function updateTemplate(req, res, next) {
    var body = req.body;
    if (!myutil.checkMandatory(["templateName", "templateUrl"], body)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("err_invalid_req_parameters")
        });
    };
    const doSomething = Promise.coroutine(function*() {
        try {
            var templateInfo ={
                templateName : body.templateName,
                templateUrl  : body.templateUrl
            };
            var updateRet    = yield template.updateTemplate(id, templateInfo);

            res.status(200).send(updateRet);
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: req.__("err_internal_server")
            });
        }
    })();
};

// 删除模版
function deleteTemplate(req, res, next) {
    var body = req.body;
    const doSomething = Promise.coroutine(function*() {
        try {
            var deleteRet    = yield template.deleteTemplate(id);

            res.status(200).send(deleteRet);
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: req.__("err_internal_server")
            });
        }
    })();
};

// 修改样式
function updateStyle(req, res, next) {
    var body = req.body;
    if (!myutil.checkMandatory(["styleName", "styleUrl"], body)) {
        return next({
            errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
            responseText: req.__("err_invalid_req_parameters")
        });
    };
    const doSomething = Promise.coroutine(function*() {
        try {
            var styleInfo = {
                styleName : body.styleName,
                styleUrl  : body.styleUrl
            };
            var updateRet    = yield template.updateStyle(body.styleId, styleInfo);

            res.status(200).send(updateRet);
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: req.__("err_internal_server")
            });
        }
    })();
};

// 删除模版
function deleteStyle(req, res, next) {
    var body = req.body;
    const doSomething = Promise.coroutine(function*() {
        try {
            var styleInfo = {
                isDelete : true
            };
            var deleteRet = yield template.updateStyle(body.styleId,styleInfo);

            res.status(200).send(deleteRet);
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: req.__("err_internal_server")
            });
        }
    })();
};

// 分页获取模版信息
function getTemplates(req, res, next) {
    var params = req.query;
    const doSomething = Promise.coroutine(function*() {
        try {
            var data = yield template.getAllWithPageIndex(params,[]);
            var result = myutil.getPaginate(params.page, params.limit, data.count, data.items);

            res.status(200).send(result);
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: req.__("err_internal_server")
            });
        }
    })();
};

// 根据Id获取模版信息
function getTemplateById(req, res, next) {
    var params = req.query;
    const doSomething = Promise.coroutine(function*() {
        try {
            var templateInfo = yield template.findTemplateById(params.id);

            res.status(200).send(templateInfo);
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: req.__("err_internal_server")
            });
        }
    })();
};

// 根据Id获取版样式信息
function getStyleByStyleId(req, res, next) {
    var params = req.query;
    var id = params.id;
    var styleId = params.styleId;
    const doSomething = Promise.coroutine(function*() {
        try {
            var templateInfo = yield template.findTemplateById(params.id);
            res.status(200).send(templateInfo);
        } catch (err) {
            logger.debug("err: " + err);
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: req.__("err_internal_server")
            });
        }
    })();
};

// 上传文件
function uploadFiles(req, res, next) {
    try {
        var file = req.files.fileData;

        if (_.isEmpty(file)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "fileValue")
            });
        }
        logger.debug("size: "+file.size+" type: "+file.type);

        // 判断文件大小
        if (file.size > 2097152) {
            return next({
                errorCode   : errorCodes.ADDRESS_BOOK_FILE_SIZE_ERR,
                responseText: req.__("toMuch", 2097152 + " 字节")
            });
        }

        // 判断文件格式
        var fileType = ['text/css','text/javascript','application/javascript','application/x-javascript'];
        var isFormatPass = myutil.inArray(file.type, fileType);
        if (isFormatPass === false) {
            return next({
                errorCode   : errorCodes.ADDRESS_BOOK_FILE_FORMAT_ERR,
                responseText: req.__('not_support_format_file')
            });
        }
        // 重命名为真实文件名
        var fileName = file.type === 'text/css' ? 'css' : 'js';
        var appDir     = myutil.getAppDir();// 项目全路径
        var tempFolder = path.join("public/files/template/" + fileName + "/", moment().format('YYYYMMDD'));
        var dstPath    = path.join(tempFolder, moment().format('YYYYMMDDHHmmss') + "-" + file.originalFilename);// 文件相对路径
        var fullPath   = path.join(appDir, dstPath);// 文件全路径

        myutil.mkdirs.sync(path.join(appDir, tempFolder));
        fs.renameSync(file.path, fullPath);
        logger.debug("dstPath: "+dstPath);

        return res.status(200).send({path: dstPath});
    } catch (err) {
        logger.error(err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

