var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SmsMessageLog = thinky.createModel("SmsMessageLog", {
    	smsMessageId : type.string(),
	loginId : type.string(),
	msgContent : type.string(),
	destination : type.string(),
	sendTime : type.date()    
});


exports.SmsMessageLogModel = SmsMessageLog;

exports.addSmsMessageLog = function (req, res) {
    var newSmsMessageLog = new SmsMessageLog(req.body);
    newSmsMessageLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSmsMessageLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SmsMessageLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSmsMessageLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SmsMessageLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSmsMessageLog = function (req, res) {
    var id = req.params.id;
    SmsMessageLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
