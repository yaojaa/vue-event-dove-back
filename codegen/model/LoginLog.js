var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var LoginLog = thinky.createModel("LoginLog", {
    	loginLogId : type.string(),
	sysLoginId : type.string(),
	loginTime : type.date(),
	logoutTime : type.date(),
	loginIp : type.string(),
	loginCode : type.string(),
	loginName : type.string(),
	loginAddress : type.string(),
	loginSource : type.string(),
	loginType : type.string()    
});


exports.LoginLogModel = LoginLog;

exports.addLoginLog = function (req, res) {
    var newLoginLog = new LoginLog(req.body);
    newLoginLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateLoginLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    LoginLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteLoginLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    LoginLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getLoginLog = function (req, res) {
    var id = req.params.id;
    LoginLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
