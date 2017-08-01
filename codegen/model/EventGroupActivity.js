var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroupActivity = thinky.createModel("EventGroupActivity", {
    	id : type.number().integer(),
	eventGroupId : type.string(),
	loginId : type.string(),
	activityId : type.string(),
	activityTime : type.date(),
	status : type.number().integer()    
});


exports.EventGroupActivityModel = EventGroupActivity;

exports.addEventGroupActivity = function (req, res) {
    var newEventGroupActivity = new EventGroupActivity(req.body);
    newEventGroupActivity.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroupActivity = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroupActivity.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroupActivity = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroupActivity.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroupActivity = function (req, res) {
    var id = req.params.id;
    EventGroupActivity.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
