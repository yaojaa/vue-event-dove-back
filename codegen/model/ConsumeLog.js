var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ConsumeLog = thinky.createModel("ConsumeLog", {
    	consumeLogId : type.string(),
	loginId : type.string(),
	consumeType : type.number().integer(),
	remark : type.string(),
	fee : type.number().integer(),
	consumeDate : type.string()    
});


exports.ConsumeLogModel = ConsumeLog;

exports.addConsumeLog = function (req, res) {
    var newConsumeLog = new ConsumeLog(req.body);
    newConsumeLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateConsumeLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ConsumeLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteConsumeLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ConsumeLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getConsumeLog = function (req, res) {
    var id = req.params.id;
    ConsumeLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
