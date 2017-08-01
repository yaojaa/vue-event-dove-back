var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var FeeFunction = thinky.createModel("FeeFunction", {
    	feeDetailId : type.string(),
	feeCategoryId : type.string(),
	feeType : type.number().integer(),
	functionType : type.number().integer(),
	priceUnitId : type.string(),
	feeDetailName : type.string(),
	fee : type.number(),
	minFee : type.number(),
	maxFee : type.number(),
	functionName : type.string(),
	functionDesc : type.string(),
	callbackName : type.string(),
	fixedFee : type.number(),
	checkParams : type.string(),
	noAuthUrl : type.string(),
	retUrl : type.string(),
	duplicate : type.number().integer(),
	durationTime : type.date(),
	durationTimeUnit : type.date(),
	locale : type.string()    
});


exports.FeeFunctionModel = FeeFunction;

exports.addFeeFunction = function (req, res) {
    var newFeeFunction = new FeeFunction(req.body);
    newFeeFunction.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateFeeFunction = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    FeeFunction.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteFeeFunction = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    FeeFunction.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getFeeFunction = function (req, res) {
    var id = req.params.id;
    FeeFunction.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
