var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EmailLoginToken = thinky.createModel("EmailLoginToken", {
    	emailLoginTokenId : type.string(),
	token : type.string(),
	emailAddress : type.string(),
	createTime : type.date(),
	updateTime : type.date(),
	state : type.number().integer()    
});


exports.EmailLoginTokenModel = EmailLoginToken;

exports.addEmailLoginToken = function (req, res) {
    var newEmailLoginToken = new EmailLoginToken(req.body);
    newEmailLoginToken.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEmailLoginToken = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EmailLoginToken.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEmailLoginToken = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EmailLoginToken.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEmailLoginToken = function (req, res) {
    var id = req.params.id;
    EmailLoginToken.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
