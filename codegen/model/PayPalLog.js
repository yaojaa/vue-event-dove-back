var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var PayPalLog = thinky.createModel("PayPalLog", {
    	logId : type.string(),
	orderNumber : type.string(),
	paymentStatus : type.string(),
	returnOrderNumber : type.string(),
	receiverEmail : type.string(),
	payerEmail : type.string(),
	content : type.string(),
	createDate : type.string()    
});


exports.PayPalLogModel = PayPalLog;

exports.addPayPalLog = function (req, res) {
    var newPayPalLog = new PayPalLog(req.body);
    newPayPalLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updatePayPalLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    PayPalLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deletePayPalLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    PayPalLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getPayPalLog = function (req, res) {
    var id = req.params.id;
    PayPalLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
