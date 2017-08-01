var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroupRoleAuth = thinky.createModel("EventGroupRoleAuth", {
    	groupRoleAuthId : type.string(),
	groupRoleId : type.string(),
	eventGroupId : type.string(),
	eventGroupAuthorityId : type.string(),
	authorityCode : type.string(),
	authStatus : type.number().integer(),
	updateTime : type.date()    
});


exports.EventGroupRoleAuthModel = EventGroupRoleAuth;

exports.addEventGroupRoleAuth = function (req, res) {
    var newEventGroupRoleAuth = new EventGroupRoleAuth(req.body);
    newEventGroupRoleAuth.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroupRoleAuth = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroupRoleAuth.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroupRoleAuth = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroupRoleAuth.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroupRoleAuth = function (req, res) {
    var id = req.params.id;
    EventGroupRoleAuth.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
