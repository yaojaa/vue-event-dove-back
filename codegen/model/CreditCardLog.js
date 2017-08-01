var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var CreditCardLog = thinky.createModel("CreditCardLog", {
    	creditCardLogId : type.string(),
	eventId : type.string(),
	orderId : type.string(),
	payOrderId : type.string(),
	totalPrice : type.number().integer(),
	eventDoveFee : type.number(),
	paidFee : type.number(),
	orgFee : type.number(),
	type : type.number().integer(),
	status : type.number().integer(),
	openId : type.string(),
	createTime : type.date(),
	updateTime : type.date()    
});


exports.CreditCardLogModel = CreditCardLog;

exports.addCreditCardLog = function (req, res) {
    var newCreditCardLog = new CreditCardLog(req.body);
    newCreditCardLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateCreditCardLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    CreditCardLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteCreditCardLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    CreditCardLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getCreditCardLog = function (req, res) {
    var id = req.params.id;
    CreditCardLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
