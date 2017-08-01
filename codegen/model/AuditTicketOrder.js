var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var AuditTicketOrder = thinky.createModel("AuditTicketOrder", {
    	auditTicketOrderId : type.string(),
	orderId : type.string(),
	eventId : type.string(),
	auditStatus : type.number().integer(),
	auditTime : type.date(),
	payTime : type.date(),
	expireTime : type.date()    
});


exports.AuditTicketOrderModel = AuditTicketOrder;

exports.addAuditTicketOrder = function (req, res) {
    var newAuditTicketOrder = new AuditTicketOrder(req.body);
    newAuditTicketOrder.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateAuditTicketOrder = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    AuditTicketOrder.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteAuditTicketOrder = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    AuditTicketOrder.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getAuditTicketOrder = function (req, res) {
    var id = req.params.id;
    AuditTicketOrder.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
