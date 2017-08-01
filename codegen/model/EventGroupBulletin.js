var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroupBulletin = thinky.createModel("EventGroupBulletin", {
    	groupBulletinId : type.string(),
	eventGroupId : type.string(),
	groupMemberId : type.string(),
	title : type.string(),
	content : type.string(),
	createTime : type.date(),
	updateTime : type.date()    
});


exports.EventGroupBulletinModel = EventGroupBulletin;

exports.addEventGroupBulletin = function (req, res) {
    var newEventGroupBulletin = new EventGroupBulletin(req.body);
    newEventGroupBulletin.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroupBulletin = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroupBulletin.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroupBulletin = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroupBulletin.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroupBulletin = function (req, res) {
    var id = req.params.id;
    EventGroupBulletin.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
