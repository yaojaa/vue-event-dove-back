var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventMessage = thinky.createModel("EventMessage", {
    	eventMessageId : type.string(),
	eventId : type.string(),
	sysLoginId : type.string(),
	subject : type.string(),
	fromUserName : type.string(),
	senderEmail : type.string(),
	phone : type.string(),
	createTime : type.date()    
});


exports.EventMessageModel = EventMessage;

exports.addEventMessage = function (req, res) {
    var newEventMessage = new EventMessage(req.body);
    newEventMessage.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventMessage = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventMessage.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventMessage = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventMessage.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventMessage = function (req, res) {
    var id = req.params.id;
    EventMessage.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
