var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EdProxyRefCodeUsedLog = thinky.createModel("EdProxyRefCodeUsedLog", {
    	refCodeUsedLogId : type.string(),
	proxyRefCodeId : type.string(),
	loginId : type.string(),
	eventId : type.string(),
	createTime : type.date(),
	paidTime : type.date(),
	expiredTime : type.date(),
	payStatus : type.number().integer()    
});


exports.EdProxyRefCodeUsedLogModel = EdProxyRefCodeUsedLog;

exports.addEdProxyRefCodeUsedLog = function (req, res) {
    var newEdProxyRefCodeUsedLog = new EdProxyRefCodeUsedLog(req.body);
    newEdProxyRefCodeUsedLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEdProxyRefCodeUsedLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EdProxyRefCodeUsedLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEdProxyRefCodeUsedLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EdProxyRefCodeUsedLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEdProxyRefCodeUsedLog = function (req, res) {
    var id = req.params.id;
    EdProxyRefCodeUsedLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
