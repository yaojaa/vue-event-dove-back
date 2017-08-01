var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ApiAccessLog = thinky.createModel("ApiAccessLog", {
    	apiAccessLogId : type.string(),
	tokenId : type.string(),
	methodId : type.string(),
	accessTime : type.date(),
	accessIp : type.string()    
});


exports.ApiAccessLogModel = ApiAccessLog;

exports.addApiAccessLog = function (req, res) {
    var newApiAccessLog = new ApiAccessLog(req.body);
    newApiAccessLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateApiAccessLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ApiAccessLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteApiAccessLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ApiAccessLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getApiAccessLog = function (req, res) {
    var id = req.params.id;
    ApiAccessLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
