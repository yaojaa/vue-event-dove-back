var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventRoleSubmenu = thinky.createModel("EventRoleSubmenu", {
    	roleSubmenuId : type.string(),
	sysRoleId : type.string(),
	sysSubmenuId : type.string(),
	roleSubmenuState : type.string()    
});


exports.EventRoleSubmenuModel = EventRoleSubmenu;

exports.addEventRoleSubmenu = function (req, res) {
    var newEventRoleSubmenu = new EventRoleSubmenu(req.body);
    newEventRoleSubmenu.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventRoleSubmenu = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventRoleSubmenu.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventRoleSubmenu = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventRoleSubmenu.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventRoleSubmenu = function (req, res) {
    var id = req.params.id;
    EventRoleSubmenu.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
