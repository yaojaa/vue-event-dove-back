var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var AuthRequest = thinky.createModel("AuthRequest", {
    	authReqId : type.string(),
	loginId : type.string(),
	realName : type.string(),
	idCard : type.string(),
	idCardResource : type.string(),
	idCardResource2 : type.string(),
	reqTime : type.date(),
	auditTime : type.date(),
	authStatus : type.number().integer(),
	resultCause : type.string()    
});


exports.AuthRequestModel = AuthRequest;

exports.addAuthRequest = function (req, res) {
    var newAuthRequest = new AuthRequest(req.body);
    newAuthRequest.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateAuthRequest = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    AuthRequest.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteAuthRequest = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    AuthRequest.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getAuthRequest = function (req, res) {
    var id = req.params.id;
    AuthRequest.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
