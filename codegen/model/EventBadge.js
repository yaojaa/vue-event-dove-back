var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventBadge = thinky.createModel("EventBadge", {
    	eventBadgeId : type.string(),
	badgePrintStyleId : type.string(),
	eventId : type.string(),
	loginId : type.string(),
	badgeName : type.string(),
	collectInfo : type.string(),
	activeBadge : type.number().integer(),
	htmlContent : type.string(),
	createTime : type.date()    
});


exports.EventBadgeModel = EventBadge;

exports.addEventBadge = function (req, res) {
    var newEventBadge = new EventBadge(req.body);
    newEventBadge.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventBadge = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventBadge.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventBadge = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventBadge.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventBadge = function (req, res) {
    var id = req.params.id;
    EventBadge.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
