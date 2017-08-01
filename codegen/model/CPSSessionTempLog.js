var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var CPSSessionTempLog = thinky.createModel("CPSSessionTempLog", {
    	cpsTempSessionId : type.string(),
	myAffliateId : type.string(),
	sessionId : type.string(),
	createTime : type.date()    
});


exports.CPSSessionTempLogModel = CPSSessionTempLog;

exports.addCPSSessionTempLog = function (req, res) {
    var newCPSSessionTempLog = new CPSSessionTempLog(req.body);
    newCPSSessionTempLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateCPSSessionTempLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    CPSSessionTempLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteCPSSessionTempLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    CPSSessionTempLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getCPSSessionTempLog = function (req, res) {
    var id = req.params.id;
    CPSSessionTempLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
