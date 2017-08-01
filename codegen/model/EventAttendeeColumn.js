var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventAttendeeColumn = thinky.createModel("EventAttendeeColumn", {
    	columnId : type.string(),
	eventId : type.string(),
	profileData : type.string(),
	sysData : type.string(),
	columnSql : type.string()    
});


exports.EventAttendeeColumnModel = EventAttendeeColumn;

exports.addEventAttendeeColumn = function (req, res) {
    var newEventAttendeeColumn = new EventAttendeeColumn(req.body);
    newEventAttendeeColumn.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventAttendeeColumn = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventAttendeeColumn.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventAttendeeColumn = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventAttendeeColumn.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventAttendeeColumn = function (req, res) {
    var id = req.params.id;
    EventAttendeeColumn.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
