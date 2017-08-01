var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var InviteUseBooth = thinky.createModel("InviteUseBooth", {
    	inviteId : type.string(),
	eventId : type.string(),
	loginId : type.string(),
	useEmail : type.string(),
	token : type.string(),
	useStatus : type.number().integer(),
	emailTitle : type.string(),
	inviteContent : type.string(),
	createTime : type.date(),
	state : type.number().integer()    
});


exports.InviteUseBoothModel = InviteUseBooth;

exports.addInviteUseBooth = function (req, res) {
    var newInviteUseBooth = new InviteUseBooth(req.body);
    newInviteUseBooth.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateInviteUseBooth = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    InviteUseBooth.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteInviteUseBooth = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    InviteUseBooth.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getInviteUseBooth = function (req, res) {
    var id = req.params.id;
    InviteUseBooth.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
