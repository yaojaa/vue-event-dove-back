var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ShortMessage = thinky.createModel("ShortMessage", {
    	shortMessageId : type.string(),
	loginId : type.string(),
	eventId : type.string(),
	smsRecordId : type.string(),
	messageContent : type.string(),
	receiverType : type.number().integer(),
	receiver : type.string(),
	sendTime : type.date(),
	createTime : type.date(),
	messageStatus : type.number().integer(),
	auditStatus : type.number().integer(),
	messageCount : type.number().integer(),
	sendSource : type.number().integer(),
	scheduleTime : type.date()    
});


exports.ShortMessageModel = ShortMessage;

exports.addShortMessage = function (req, res) {
    var newShortMessage = new ShortMessage(req.body);
    newShortMessage.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateShortMessage = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ShortMessage.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteShortMessage = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ShortMessage.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getShortMessage = function (req, res) {
    var id = req.params.id;
    ShortMessage.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
