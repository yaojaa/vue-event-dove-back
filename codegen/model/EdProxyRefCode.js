var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EdProxyRefCode = thinky.createModel("EdProxyRefCode", {
    	proxyRefCodeId : type.string(),
	edProxyId : type.string(),
	code : type.string(),
	discount : type.number().integer(),
	priceType : type.number().integer(),
	createTime : type.date(),
	expireTime : type.date(),
	usedCount : type.number().integer(),
	limitCount : type.number().integer(),
	refType : type.number().integer()    
});


exports.EdProxyRefCodeModel = EdProxyRefCode;

exports.addEdProxyRefCode = function (req, res) {
    var newEdProxyRefCode = new EdProxyRefCode(req.body);
    newEdProxyRefCode.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEdProxyRefCode = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EdProxyRefCode.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEdProxyRefCode = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EdProxyRefCode.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEdProxyRefCode = function (req, res) {
    var id = req.params.id;
    EdProxyRefCode.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
