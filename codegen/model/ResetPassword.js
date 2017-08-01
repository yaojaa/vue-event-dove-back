var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ResetPassword = thinky.createModel("ResetPassword", {
    	resetPasswordId : type.string(),
	email : type.string(),
	resetKey : type.string(),
	applyTime : type.date(),
	expireTime : type.date()    
});


exports.ResetPasswordModel = ResetPassword;

exports.addResetPassword = function (req, res) {
    var newResetPassword = new ResetPassword(req.body);
    newResetPassword.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateResetPassword = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ResetPassword.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteResetPassword = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ResetPassword.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getResetPassword = function (req, res) {
    var id = req.params.id;
    ResetPassword.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
