var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var AttendeeMail = thinky.createModel("AttendeeMail", {
    	attendeeMailId : type.string(),
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
	sendTimestamp : type.date(),
	createTimestamp : type.date(),
	smsNotify : type.number().integer(),
	smsTemplateId : type.string()    
});


exports.AttendeeMailModel = AttendeeMail;

exports.addAttendeeMail = function (req, res) {
    var newAttendeeMail = new AttendeeMail(req.body);
    newAttendeeMail.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateAttendeeMail = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    AttendeeMail.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteAttendeeMail = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    AttendeeMail.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getAttendeeMail = function (req, res) {
    var id = req.params.id;
    AttendeeMail.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
