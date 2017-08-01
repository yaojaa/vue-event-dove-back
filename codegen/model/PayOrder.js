var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var PayOrder = thinky.createModel("PayOrder", {
    	payOrderId : type.string(),
	paymentTypeId : type.string(),
	payUserAccount : type.string(),
	payFrom : type.number().integer(),
	receiveAccount : type.string(),
	subject : type.string(),
	payMethod : type.number().integer(),
	orderNumber : type.string(),
	returnOrderNum : type.string(),
	bankCode : type.string(),
	bankName : type.string(),
	bankSeqNum : type.string(),
	payStatus : type.number().integer(),
	returnUrl : type.string(),
	orderIpAddress : type.string(),
	totalBuyerNum : type.number().integer(),
	totalPrice : type.number(),
	feePrice : type.number(),
	paidPrice : type.number(),
	paidFee : type.number(),
	currencyName : type.string(),
	currencySign : type.string(),
	orderTime : type.date(),
	createTime : type.date(),
	expireTime : type.date(),
	payTime : type.date(),
	receipt : type.string()    
});


exports.PayOrderModel = PayOrder;

exports.addPayOrder = function (req, res) {
    var newPayOrder = new PayOrder(req.body);
    newPayOrder.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updatePayOrder = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    PayOrder.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deletePayOrder = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    PayOrder.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getPayOrder = function (req, res) {
    var id = req.params.id;
    PayOrder.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
