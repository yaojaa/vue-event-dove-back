var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventSubmenu = thinky.createModel("EventSubmenu", {
    	submenuId : type.string(),
	submenuName : type.string(),
	enSubmenuName : type.string(),
	submenuTagId : type.string(),
	sysMenuId : type.string(),
	urlValue : type.string(),
	submenuSort : type.number().integer(),
	submenuState : type.string(),
	locale : type.string()    
});


exports.EventSubmenuModel = EventSubmenu;

exports.addEventSubmenu = function (req, res) {
    var newEventSubmenu = new EventSubmenu(req.body);
    newEventSubmenu.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventSubmenu = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventSubmenu.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventSubmenu = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventSubmenu.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventSubmenu = function (req, res) {
    var id = req.params.id;
    EventSubmenu.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
