var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventRole = thinky.createModel("EventRole", {
    	roleId : type.string(),
	roleName : type.string(),
	enRoleName : type.string(),
	roleDesc : type.string(),
	roleState : type.string(),
	locale : type.string(),
	pubStatus : type.number().integer()    
});


exports.EventRoleModel = EventRole;

exports.addEventRole = function (req, res) {
    var newEventRole = new EventRole(req.body);
    newEventRole.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventRole = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventRole.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventRole = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventRole.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventRole = function (req, res) {
    var id = req.params.id;
    EventRole.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
