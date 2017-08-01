var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var PayLog = thinky.createModel("PayLog", {
    	payLogId : type.string(),
	loginId : type.string(),
	money : type.number().integer(),
	remark : type.string(),
	payTimestamp : type.date()    
});


exports.PayLogModel = PayLog;

exports.addPayLog = function (req, res) {
    var newPayLog = new PayLog(req.body);
    newPayLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updatePayLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    PayLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deletePayLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    PayLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getPayLog = function (req, res) {
    var id = req.params.id;
    PayLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
