var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventActivity = thinky.createModel("EventActivity", {
    	activityId : type.string(),
	eventId : type.string(),
	loginId : type.string(),
	eventActivityItemId : type.string(),
	eventActivityActionId : type.string(),
	activityActionCode : type.string(),
	activityTitle : type.string(),
	activityContent : type.string(),
	createTimestamp : type.date(),
	status : type.number().integer()    
});


exports.EventActivityModel = EventActivity;

exports.addEventActivity = function (req, res) {
    var newEventActivity = new EventActivity(req.body);
    newEventActivity.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventActivity = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventActivity.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventActivity = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventActivity.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventActivity = function (req, res) {
    var id = req.params.id;
    EventActivity.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
