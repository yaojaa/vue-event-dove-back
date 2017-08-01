var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EdServiceFeeOrder = thinky.createModel("EdServiceFeeOrder", {
    	serviceFeeOrderId : type.string(),
	payOrderId : type.string(),
	proxyRefCodeId : type.string(),
	eventId : type.string(),
	loginId : type.string(),
	fee : type.number().integer(),
	feeType : type.number().integer(),
	payStatus : type.number().integer(),
	orderNumber : type.string(),
	orderIp : type.string(),
	orderTime : type.date(),
	payTime : type.date()    
});


exports.EdServiceFeeOrderModel = EdServiceFeeOrder;

exports.addEdServiceFeeOrder = function (req, res) {
    var newEdServiceFeeOrder = new EdServiceFeeOrder(req.body);
    newEdServiceFeeOrder.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEdServiceFeeOrder = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EdServiceFeeOrder.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEdServiceFeeOrder = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EdServiceFeeOrder.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEdServiceFeeOrder = function (req, res) {
    var id = req.params.id;
    EdServiceFeeOrder.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
