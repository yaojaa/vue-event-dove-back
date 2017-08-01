var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EmailErrorReport = thinky.createModel("EmailErrorReport", {
    	reportId : type.string(),
	type : type.number().integer(),
	content : type.string(),
	createTime : type.date()    
});


exports.EmailErrorReportModel = EmailErrorReport;

exports.addEmailErrorReport = function (req, res) {
    var newEmailErrorReport = new EmailErrorReport(req.body);
    newEmailErrorReport.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEmailErrorReport = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EmailErrorReport.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEmailErrorReport = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EmailErrorReport.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEmailErrorReport = function (req, res) {
    var id = req.params.id;
    EmailErrorReport.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
