var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventMenu = thinky.createModel("EventMenu", {
    	menuId : type.string(),
	menuName : type.string(),
	enMenuName : type.string(),
	menuObjectId : type.string(),
	menuObjectStyle : type.string(),
	menuSort : type.number().integer(),
	menuState : type.string(),
	locale : type.string()    
});


exports.EventMenuModel = EventMenu;

exports.addEventMenu = function (req, res) {
    var newEventMenu = new EventMenu(req.body);
    newEventMenu.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventMenu = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventMenu.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventMenu = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventMenu.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventMenu = function (req, res) {
    var id = req.params.id;
    EventMenu.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
