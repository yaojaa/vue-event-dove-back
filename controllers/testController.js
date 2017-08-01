/**
test Controller
@author :laiwp
@date:  :2017-07-06
@version : 0.1.0 
@constructor : 0.1.0 
*/

const _          = require('lodash');
const myutil      = require('../util/util.js');
const errorCodes  = require('../util/errorCodes.js').ErrorCodes;
const db=require('../model/admin/pictureLib.js');
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;


module.exports = {
    mapping: {
        "test": {
            "url": "/test",
            "method": "get",
            "description": "描述",
            "auth": false
        },
  
        
	},
	
	test: async function (req,res){
		const params = req.query;
		try {
	    	let data = await db.Dao.list(params);
	     	res.send(data);
	    } catch (err) {
	        return next({errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message});
	    }
	},
	
}







