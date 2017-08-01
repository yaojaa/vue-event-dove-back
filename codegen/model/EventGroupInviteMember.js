var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroupInviteMember = thinky.createModel("EventGroupInviteMember", {
    	groupInviteMemberId : type.string(),
	eventGroupId : type.string(),
	loginId : type.string(),
	emailAddress : type.string(),
	sendTime : type.date(),
	inivitType : type.number().integer(),
	memberStatus : type.number().integer(),
	linkState : type.number().integer(),
	token : type.string(),
	state : type.number().integer()    
});


exports.EventGroupInviteMemberModel = EventGroupInviteMember;

exports.addEventGroupInviteMember = function (req, res) {
    var newEventGroupInviteMember = new EventGroupInviteMember(req.body);
    newEventGroupInviteMember.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroupInviteMember = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroupInviteMember.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroupInviteMember = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroupInviteMember.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroupInviteMember = function (req, res) {
    var id = req.params.id;
    EventGroupInviteMember.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
