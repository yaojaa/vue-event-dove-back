var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ResubmitOrderLog = thinky.createModel("ResubmitOrderLog", {
    	logId : type.string(),
	ticketOrderId : type.string(),
	orderNumber : type.string(),
	newOrderNumber : type.string(),
	createTime : type.date()    
});


exports.ResubmitOrderLogModel = ResubmitOrderLog;

exports.addResubmitOrderLog = function (req, res) {
    var newResubmitOrderLog = new ResubmitOrderLog(req.body);
    newResubmitOrderLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateResubmitOrderLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ResubmitOrderLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteResubmitOrderLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ResubmitOrderLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getResubmitOrderLog = function (req, res) {
    var id = req.params.id;
    ResubmitOrderLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
