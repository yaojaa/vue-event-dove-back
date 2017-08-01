var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var FeeFunctionOrder = thinky.createModel("FeeFunctionOrder", {
    	feeFunctionOrderId : type.string(),
	feeDetailId : type.string(),
	loginId : type.string(),
	payOrderId : type.string(),
	fee : type.number().integer(),
	payStatus : type.number().integer(),
	paramValues : type.string(),
	orderNumber : type.string(),
	orderIp : type.string(),
	expireTime : type.date(),
	orderTime : type.date()    
});


exports.FeeFunctionOrderModel = FeeFunctionOrder;

exports.addFeeFunctionOrder = function (req, res) {
    var newFeeFunctionOrder = new FeeFunctionOrder(req.body);
    newFeeFunctionOrder.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateFeeFunctionOrder = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    FeeFunctionOrder.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteFeeFunctionOrder = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    FeeFunctionOrder.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getFeeFunctionOrder = function (req, res) {
    var id = req.params.id;
    FeeFunctionOrder.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
