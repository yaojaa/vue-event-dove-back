var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var RefundTicketDetail = thinky.createModel("RefundTicketDetail", {
    	id : type.number().integer(),
	eventId : type.string(),
	orderId : type.string(),
	orderDetailId : type.string(),
	userProfileId : type.string(),
	ticketId : type.string(),
	price : type.number().integer(),
	fee : type.number().integer(),
	totalFee : type.number(),
	refundTime : type.date()    
});


exports.RefundTicketDetailModel = RefundTicketDetail;

exports.addRefundTicketDetail = function (req, res) {
    var newRefundTicketDetail = new RefundTicketDetail(req.body);
    newRefundTicketDetail.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateRefundTicketDetail = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    RefundTicketDetail.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteRefundTicketDetail = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    RefundTicketDetail.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getRefundTicketDetail = function (req, res) {
    var id = req.params.id;
    RefundTicketDetail.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
