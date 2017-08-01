var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventActivityAction = thinky.createModel("EventActivityAction", {
    	activityActionId : type.string(),
	eventActivityItemId : type.string(),
	activityActionType : type.string(),
	activityActionCode : type.string(),
	activityActionName : type.string(),
	activityActionTitleTemplate : type.string(),
	activityActionContentTemplate : type.string(),
	locale : type.string()    
});


exports.EventActivityActionModel = EventActivityAction;

exports.addEventActivityAction = function (req, res) {
    var newEventActivityAction = new EventActivityAction(req.body);
    newEventActivityAction.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventActivityAction = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventActivityAction.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventActivityAction = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventActivityAction.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventActivityAction = function (req, res) {
    var id = req.params.id;
    EventActivityAction.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
