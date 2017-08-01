var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventSmsTemplate = thinky.createModel("EventSmsTemplate", {
    	eventSmsTemplateId : type.string(),
	templateCode : type.string(),
	loginId : type.string(),
	eventId : type.string(),
	smsTitle : type.string(),
	smsContent : type.string(),
	createTime : type.date(),
	checkTime : type.date(),
	templateState : type.number().integer(),
	smsStatus : type.number().integer(),
	locale : type.string()    
});


exports.EventSmsTemplateModel = EventSmsTemplate;

exports.addEventSmsTemplate = function (req, res) {
    var newEventSmsTemplate = new EventSmsTemplate(req.body);
    newEventSmsTemplate.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventSmsTemplate = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventSmsTemplate.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventSmsTemplate = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventSmsTemplate.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventSmsTemplate = function (req, res) {
    var id = req.params.id;
    EventSmsTemplate.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
