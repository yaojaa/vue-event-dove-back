var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var MemberFeeOrder = thinky.createModel("MemberFeeOrder", {
    	memberFeeOrderId : type.string(),
	eventGroupId : type.string(),
	payOrderId : type.string(),
	groupMemberId : type.string(),
	eventGroupPaymentDetailId : type.string(),
	orderNumber : type.string(),
	buyNum : type.number().integer(),
	totalFee : type.number(),
	totalPrice : type.number().integer(),
	rawTotalPrice : type.number().integer(),
	currencyName : type.string(),
	currencySign : type.string(),
	orderTime : type.date(),
	payTime : type.date(),
	payStatus : type.number().integer(),
	payWay : type.number().integer(),
	orderIp : type.string()    
});


exports.MemberFeeOrderModel = MemberFeeOrder;

exports.addMemberFeeOrder = function (req, res) {
    var newMemberFeeOrder = new MemberFeeOrder(req.body);
    newMemberFeeOrder.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateMemberFeeOrder = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    MemberFeeOrder.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteMemberFeeOrder = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    MemberFeeOrder.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getMemberFeeOrder = function (req, res) {
    var id = req.params.id;
    MemberFeeOrder.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
