/**
图片库类别
@class pictureType
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
const pictureTypeSchema = {
    id          : type.string(),	
    name        : type.string(),	//名称
   	cTime       : type.date().default(r.now()),// 创建时间
    uTime       : type.date().default(r.now()),// 修改时间
};

const pictureType =exports.pictureType= thinky.createModel("PictureType", pictureTypeSchema);
exports.modelSchema=pictureTypeSchema;

//添加索引
pictureType.ensureIndex("name");

const Dao = exports.Dao={

	//根据id获取
	getById:function(id){
		return r.table("pictureType").get(id);
	},

	list:function(params,attributeNames){
		attributeNames  = _.isEmpty(attributeNames) ? _.keys(pictureTypeSchema) : attributeNames;
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
		let _contact = new pictureType(contact);
	    _contact.id  = nextId();
	    return _contact.save();
	},
	update:function(data){
		const id   = data.id;
   		data.uTime = new Date();
    	return pictureType.get(id).update(data).run();
	},
	del:function(id){
		return pictureType.get(id).delete().execute();
	}





};


// 拼装搜索条件
function __buildFilter(params) {
   
    
    return pictureType;
}


























