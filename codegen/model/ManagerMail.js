var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ManagerMail = thinky.createModel("ManagerMail", {
    	managerMailId : type.string(),
	emailTemplateId : type.string(),
	loginId : type.string(),
	eventId : type.string(),
	status : type.number().integer(),
	sendStatus : type.number().integer(),
	fromAddress : type.string(),
	fromName : type.string(),
	replyAddress : type.string(),
	toAddress : type.string(),
	toName : type.string(),
	mailCount : type.number().integer(),
	subject : type.string(),
	toStruct : type.string(),
	greetingMsg : type.string(),
	content : type.string(),
	attachmentPath : type.string(),
	sendSms : type.string(),
	smsContent : type.string(),
	sendTimestamp : type.date(),
	createTimestamp : type.date(),
	selectedContact : type.string()    
});


exports.ManagerMailModel = ManagerMail;

exports.addManagerMail = function (req, res) {
    var newManagerMail = new ManagerMail(req.body);
    newManagerMail.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateManagerMail = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ManagerMail.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteManagerMail = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ManagerMail.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getManagerMail = function (req, res) {
    var id = req.params.id;
    ManagerMail.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
