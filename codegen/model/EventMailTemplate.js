var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventMailTemplate = thinky.createModel("EventMailTemplate", {
    	emailTemplateId : type.string(),
	status : type.number().integer(),
	templateCode : type.string(),
	tplTitle : type.string(),
	fromName : type.string(),
	fromAddress : type.string(),
	subject : type.string(),
	content : type.string(),
	createTimestamp : type.date(),
	modifyTimestamp : type.date(),
	public : type.string(),
	locale : type.string(),
	emailType : type.number().integer()    
});


exports.EventMailTemplateModel = EventMailTemplate;

exports.addEventMailTemplate = function (req, res) {
    var newEventMailTemplate = new EventMailTemplate(req.body);
    newEventMailTemplate.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventMailTemplate = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventMailTemplate.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventMailTemplate = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventMailTemplate.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventMailTemplate = function (req, res) {
    var id = req.params.id;
    EventMailTemplate.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
