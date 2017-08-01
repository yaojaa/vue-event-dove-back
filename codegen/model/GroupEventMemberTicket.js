var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var GroupEventMemberTicket = thinky.createModel("GroupEventMemberTicket", {
    	groupEventMemberTicket : type.number().integer(),
	matchGroupId : type.string(),
	ticketId : type.string()    
});


exports.GroupEventMemberTicketModel = GroupEventMemberTicket;

exports.addGroupEventMemberTicket = function (req, res) {
    var newGroupEventMemberTicket = new GroupEventMemberTicket(req.body);
    newGroupEventMemberTicket.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateGroupEventMemberTicket = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    GroupEventMemberTicket.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteGroupEventMemberTicket = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    GroupEventMemberTicket.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getGroupEventMemberTicket = function (req, res) {
    var id = req.params.id;
    GroupEventMemberTicket.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
