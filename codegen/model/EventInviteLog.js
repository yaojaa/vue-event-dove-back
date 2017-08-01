var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventInviteLog = thinky.createModel("EventInviteLog", {
    	eventInviteLogId : type.string(),
	eventId : type.string(),
	invite : type.string(),
	inviteCode : type.string(),
	inviteType : type.number().integer(),
	inviteTime : type.date()    
});


exports.EventInviteLogModel = EventInviteLog;

exports.addEventInviteLog = function (req, res) {
    var newEventInviteLog = new EventInviteLog(req.body);
    newEventInviteLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventInviteLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventInviteLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventInviteLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventInviteLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventInviteLog = function (req, res) {
    var id = req.params.id;
    EventInviteLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
