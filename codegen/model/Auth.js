var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Auth = thinky.createModel("Auth", {
    	authId : type.string(),
	loginId : type.string()    
});


exports.AuthModel = Auth;

exports.addAuth = function (req, res) {
    var newAuth = new Auth(req.body);
    newAuth.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateAuth = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Auth.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteAuth = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Auth.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getAuth = function (req, res) {
    var id = req.params.id;
    Auth.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
