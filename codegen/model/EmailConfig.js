var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EmailConfig = thinky.createModel("EmailConfig", {
    	emailConfigId : type.string(),
	code : type.string(),
	eventMailTemplateId : type.string(),
	name : type.string(),
	level : type.number().integer(),
	sendWay : type.number().integer(),
	blacklist : type.string()    
});


exports.EmailConfigModel = EmailConfig;

exports.addEmailConfig = function (req, res) {
    var newEmailConfig = new EmailConfig(req.body);
    newEmailConfig.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEmailConfig = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EmailConfig.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEmailConfig = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EmailConfig.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEmailConfig = function (req, res) {
    var id = req.params.id;
    EmailConfig.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
