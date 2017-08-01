/**
图片库类别 Controller
@class pictureTypeController
@author :lwp
@date:  :2017-07-05
@version : 0.1.0 
*/
const _          = require('lodash');
const myutil      = require('../../util/util.js');
const errorCodes  = require('../../util/errorCodes.js').ErrorCodes;
const db=require('../../model/admin/pictureType.js');
const settings  = require("../../conf/settings");
const loggerSettings = require('../../logger');
const logger         = loggerSettings.winstonLogger;


//获取列表
async function getList(req, res, next) {
    const params = req.query;
    try {
    	let data = await db.Dao.list(params);
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
    const purenessReq = myutil.getPurenessRequsetFields(body, db.modelSchema);    // 准备需要插入数据库的数据   
    try{
    	const saveRet  = await db.Dao.add(purenessReq);
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
    const updateData = myutil.getPurenessRequsetFields(body, db.modelSchema);    // 准备需要插入数据库的数据   
    try{
    	const result  = await db.Dao.update(updateData);
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
        const result = await db.Dao.del(id);
        return res.status(200).send(result);
    } catch (err) {
        return next({
            errorCode   : errorCodes.ERR_INTERNAL_SERVER,
            responseText: err.message
        });
    }
}









exports.getList           = getList;
exports.add           	  = add;
exports.update            = update;
exports.del           	  = del;


