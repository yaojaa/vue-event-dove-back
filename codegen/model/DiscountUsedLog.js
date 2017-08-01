var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var DiscountUsedLog = thinky.createModel("DiscountUsedLog", {
    	discountUsedLogId : type.string(),
	orderId : type.string(),
	discountId : type.string(),
	createTime : type.date()    
});


exports.DiscountUsedLogModel = DiscountUsedLog;

exports.addDiscountUsedLog = function (req, res) {
    var newDiscountUsedLog = new DiscountUsedLog(req.body);
    newDiscountUsedLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateDiscountUsedLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    DiscountUsedLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteDiscountUsedLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    DiscountUsedLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getDiscountUsedLog = function (req, res) {
    var id = req.params.id;
    DiscountUsedLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
