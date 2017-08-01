var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EmailCheck = thinky.createModel("EmailCheck", {
    	id : type.number().integer(),
	token : type.string(),
	type : type.string(),
	param : type.string(),
	expireTime : type.date(),
	createTime : type.date()    
});


exports.EmailCheckModel = EmailCheck;

exports.addEmailCheck = function (req, res) {
    var newEmailCheck = new EmailCheck(req.body);
    newEmailCheck.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEmailCheck = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EmailCheck.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEmailCheck = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EmailCheck.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEmailCheck = function (req, res) {
    var id = req.params.id;
    EmailCheck.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
