var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventRolePermissions = thinky.createModel("EventRolePermissions", {
    	eventRolePermissionsId : type.string(),
	mainLoginId : type.string(),
	secondLoginId : type.string(),
	eventId : type.string(),
	eventRoleId : type.string(),
	selectEventType : type.number().integer(),
	selectActionType : type.number().integer()    
});


exports.EventRolePermissionsModel = EventRolePermissions;

exports.addEventRolePermissions = function (req, res) {
    var newEventRolePermissions = new EventRolePermissions(req.body);
    newEventRolePermissions.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventRolePermissions = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventRolePermissions.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventRolePermissions = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventRolePermissions.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventRolePermissions = function (req, res) {
    var id = req.params.id;
    EventRolePermissions.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
