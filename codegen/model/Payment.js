var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Payment = thinky.createModel("Payment", {
    	paymentId : type.string(),
	paymentTypeId : type.string(),
	loginId : type.string(),
	paymentAccount : type.string(),
	additionalCode : type.string(),
	redirectUrl : type.string(),
	accountType : type.number().integer(),
	mainName : type.string(),
	appSecret : type.string(),
	showUrl : type.string(),
	partnerKey : type.string(),
	partnerId : type.string(),
	defaultAccount : type.number().integer(),
	acceptMoneyState : type.number().integer()    
});


exports.PaymentModel = Payment;

exports.addPayment = function (req, res) {
    var newPayment = new Payment(req.body);
    newPayment.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updatePayment = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Payment.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deletePayment = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Payment.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getPayment = function (req, res) {
    var id = req.params.id;
    Payment.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
