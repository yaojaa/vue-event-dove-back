var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var IncomingLog = thinky.createModel("IncomingLog", {
    	incomingLogId : type.string(),
	loginId : type.string(),
	incomeId : type.string(),
	incomeType : type.number().integer(),
	inOrEx : type.number().integer(),
	money : type.number(),
	remark : type.string(),
	incomingTimestamp : type.date()    
});


exports.IncomingLogModel = IncomingLog;

exports.addIncomingLog = function (req, res) {
    var newIncomingLog = new IncomingLog(req.body);
    newIncomingLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateIncomingLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    IncomingLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteIncomingLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    IncomingLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getIncomingLog = function (req, res) {
    var id = req.params.id;
    IncomingLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
