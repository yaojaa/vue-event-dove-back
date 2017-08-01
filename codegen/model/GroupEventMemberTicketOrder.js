var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var GroupEventMemberTicketOrder = thinky.createModel("GroupEventMemberTicketOrder", {
    	groupEventMemberTicketOrder : type.number().integer(),
	matchGroupId : type.string(),
	orderId : type.string(),
	groupMemberId : type.string()    
});


exports.GroupEventMemberTicketOrderModel = GroupEventMemberTicketOrder;

exports.addGroupEventMemberTicketOrder = function (req, res) {
    var newGroupEventMemberTicketOrder = new GroupEventMemberTicketOrder(req.body);
    newGroupEventMemberTicketOrder.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateGroupEventMemberTicketOrder = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    GroupEventMemberTicketOrder.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteGroupEventMemberTicketOrder = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    GroupEventMemberTicketOrder.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getGroupEventMemberTicketOrder = function (req, res) {
    var id = req.params.id;
    GroupEventMemberTicketOrder.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
