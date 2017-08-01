var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroup = thinky.createModel("EventGroup", {
    	eventGroupId : type.string(),
	loginId : type.string(),
	domainId : type.string(),
	siteInfoId : type.string(),
	cityId : type.string(),
	provinceId : type.string(),
	eventCategoryId : type.string(),
	skinTemplateCode : type.string(),
	subdomainName : type.string(),
	groupIncome : type.number().integer(),
	groupFee : type.number(),
	groupIcon : type.string(),
	groupName : type.string(),
	groupTag : type.string(),
	groupDesc : type.string(),
	joinRule : type.string(),
	privacy : type.number().integer(),
	bulletin : type.string(),
	createTime : type.date(),
	expirationTime : type.date(),
	joinCount : type.number().integer(),
	attentionCount : type.number().integer(),
	sendExpirationMail : type.string(),
	customMailTemplate : type.number().integer(),
	state : type.string()    
});


exports.EventGroupModel = EventGroup;

exports.addEventGroup = function (req, res) {
    var newEventGroup = new EventGroup(req.body);
    newEventGroup.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroup = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroup.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroup = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroup.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroup = function (req, res) {
    var id = req.params.id;
    EventGroup.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
