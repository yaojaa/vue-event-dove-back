var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Discount = thinky.createModel("Discount", {
    	discountId : type.string(),
	eventId : type.string(),
	discountCode : type.string(),
	discountPrice : type.number().integer(),
	currencyName : type.string(),
	discountPercentage : type.string(),
	limitUseCount : type.number().integer(),
	maxUseCount : type.number().integer(),
	totalUseCount : type.number().integer(),
	startTime : type.date(),
	endTime : type.date(),
	state : type.string(),
	defaultTimeType : type.date(),
	discountType : type.number().integer(),
	discountRewardType : type.number().integer(),
	tickets : type.string(),
	zkprice : type.string(),
	totalIncome : type.number().integer()    
});


exports.DiscountModel = Discount;

exports.addDiscount = function (req, res) {
    var newDiscount = new Discount(req.body);
    newDiscount.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateDiscount = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Discount.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteDiscount = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Discount.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getDiscount = function (req, res) {
    var id = req.params.id;
    Discount.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
