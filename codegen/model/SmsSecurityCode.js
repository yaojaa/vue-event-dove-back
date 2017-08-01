var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SmsSecurityCode = thinky.createModel("SmsSecurityCode", {
    	id : type.number().integer(),
	type : type.string(),
	mobileNumber : type.string(),
	code : type.string(),
	createTime : type.date(),
	expireTime : type.date(),
	used : type.number().integer()    
});


exports.SmsSecurityCodeModel = SmsSecurityCode;

exports.addSmsSecurityCode = function (req, res) {
    var newSmsSecurityCode = new SmsSecurityCode(req.body);
    newSmsSecurityCode.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSmsSecurityCode = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SmsSecurityCode.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSmsSecurityCode = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SmsSecurityCode.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSmsSecurityCode = function (req, res) {
    var id = req.params.id;
    SmsSecurityCode.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
