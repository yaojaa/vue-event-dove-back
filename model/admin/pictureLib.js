/**
图片库
@class picturelib
@author :lwp
@date:  :2017-07-05
@version : 0.1.0 
@constructor 
*/
const _       = require('lodash');
const thinky  = require('../../util/thinky.js');
const r       = thinky.r;
const type    = thinky.type;
const myutil  = require('../../util/util.js');
const nextId  = myutil.nextId;
const Promise        = require('bluebird');
const settings     = require("../../conf/settings");
const loggerSettings = require('../../logger');
const logger         = loggerSettings.winstonLogger;


//图片库模型
const picturelibSchema = {
    id          : type.string(),	
    type        : type.string(),	//类别
    name        : type.string(),	//图片名称 备注
    url			: type.string(),	//图片地址
    link		: type.string(),	//链接地址
    sort		: type.number().integer(),	//排序
   	cTime       : type.date().default(r.now()),// 创建时间
    uTime       : type.date().default(r.now()),// 修改时间
};

const picturelib =exports.picturelib= thinky.createModel("PictureLib", picturelibSchema);
exports.modelSchema=picturelibSchema;

//添加索引
picturelib.ensureIndex("type");

const Dao = exports.Dao={

	//根据id获取
	getById:function(id){
		return r.table("pictureLib").get(id);
	},

	list:function(params,attributeNames){
		attributeNames  = _.isEmpty(attributeNames) ? _.keys(picturelibSchema) : attributeNames;
		const modelFilter = __buildFilter(params);
		let totalCount  = parseInt(params.total) || -1;// 总记录数
	    const page        = parseInt(params.page) || 1;// 第几页
	    const limit       = parseInt(params.limit) || 10;// 每页显示记录数
	    const skip        = ( page - 1 ) * limit;
	    const orderBy     = params.orderBy || "sort";
		const items		= modelFilter.orderBy(r.row(orderBy)).slice(skip, skip + limit).pluck(attributeNames).run();

		if (totalCount === -1) {
	        totalCount = modelFilter.count().execute();
	    }
		return Promise.props({items: items,count: totalCount});

	},

	add:function(contact){
		let _contact = new picturelib(contact);
	    _contact.id  = nextId();
	    return _contact.save();
	},
	update:function(data){
		const id   = data.id;
   		data.uTime = new Date();
    	return picturelib.get(id).update(data).run();
	},
	del:function(id){
		return picturelib.get(id).delete().execute();
	}





};


// 拼装搜索条件
function __buildFilter(params) {
    const type       = params.type;
    let modelFilter = picturelib;

    if (!_.isUndefined(type) && !_.isEmpty(type)&&type!=='') {
    	modelFilter = modelFilter.filter({type:type});
    }
    
    return modelFilter;
}


























