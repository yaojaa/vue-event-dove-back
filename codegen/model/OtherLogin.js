var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var OtherLogin = thinky.createModel("OtherLogin", {
    	otherLoginId : type.string(),
	loginEntrance : type.number().integer(),
	thirdPartyId : type.string(),
	loginId : type.string()    
});


exports.OtherLoginModel = OtherLogin;

exports.addOtherLogin = function (req, res) {
    var newOtherLogin = new OtherLogin(req.body);
    newOtherLogin.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateOtherLogin = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    OtherLogin.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteOtherLogin = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    OtherLogin.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getOtherLogin = function (req, res) {
    var id = req.params.id;
    OtherLogin.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
