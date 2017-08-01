var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SmsRecord = thinky.createModel("SmsRecord", {
    	smsRecordId : type.string(),
	loginId : type.string(),
	eventId : type.string(),
	smsContent : type.string(),
	smsCount : type.number().integer(),
	sourceType : type.number().integer(),
	createTime : type.date(),
	modifyTime : type.date(),
	sendTime : type.date()    
});


exports.SmsRecordModel = SmsRecord;

exports.addSmsRecord = function (req, res) {
    var newSmsRecord = new SmsRecord(req.body);
    newSmsRecord.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSmsRecord = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SmsRecord.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSmsRecord = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SmsRecord.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSmsRecord = function (req, res) {
    var id = req.params.id;
    SmsRecord.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
