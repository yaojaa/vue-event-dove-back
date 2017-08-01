var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var AccountFromReg = thinky.createModel("AccountFromReg", {
    	fromRegId : type.string(),
	loginId : type.string(),
	eventGroupId : type.string(),
	eventId : type.string(),
	fromModule : type.number().integer(),
	fromDetail : type.number().integer()    
});


exports.AccountFromRegModel = AccountFromReg;

exports.addAccountFromReg = function (req, res) {
    var newAccountFromReg = new AccountFromReg(req.body);
    newAccountFromReg.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateAccountFromReg = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    AccountFromReg.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteAccountFromReg = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    AccountFromReg.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getAccountFromReg = function (req, res) {
    var id = req.params.id;
    AccountFromReg.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
