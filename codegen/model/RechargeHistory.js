var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var RechargeHistory = thinky.createModel("RechargeHistory", {
    	rechargeHistoryId : type.string(),
	userId : type.string(),
	type : type.number().integer(),
	count : type.number().integer(),
	chargeTime : type.date()    
});


exports.RechargeHistoryModel = RechargeHistory;

exports.addRechargeHistory = function (req, res) {
    var newRechargeHistory = new RechargeHistory(req.body);
    newRechargeHistory.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateRechargeHistory = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    RechargeHistory.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteRechargeHistory = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    RechargeHistory.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getRechargeHistory = function (req, res) {
    var id = req.params.id;
    RechargeHistory.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
