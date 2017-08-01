var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroupUserRegard = thinky.createModel("EventGroupUserRegard", {
    	regardId : type.string(),
	eventGroupId : type.string(),
	groupMemberId : type.string(),
	fromMemberId : type.string(),
	regardTime : type.date(),
	regardType : type.string(),
	content : type.string(),
	state : type.string()    
});


exports.EventGroupUserRegardModel = EventGroupUserRegard;

exports.addEventGroupUserRegard = function (req, res) {
    var newEventGroupUserRegard = new EventGroupUserRegard(req.body);
    newEventGroupUserRegard.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroupUserRegard = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroupUserRegard.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroupUserRegard = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroupUserRegard.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroupUserRegard = function (req, res) {
    var id = req.params.id;
    EventGroupUserRegard.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
