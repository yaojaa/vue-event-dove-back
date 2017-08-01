var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Login = thinky.createModel("Login", {
    	loginId : type.string(),
	username : type.string(),
	phone : type.string(),
	password : type.string(),
	salt : type.string(),
	viewName : type.string(),
	leaderName : type.string(),
	lastLoginTime : type.date(),
	lastLoginIp : type.string(),
	state : type.string(),
	vip : type.number().integer(),
	loginRole : type.string(),
	locale : type.string(),
	token : type.string(),
	registerStatus : type.number().integer(),
	guideStatus : type.string(),
	publistEvent : type.number().integer(),
	paymentMethod : type.number().integer(),
	authStatus : type.number().integer(),
	managepw : type.string()    
});


exports.LoginModel = Login;

exports.addLogin = function (req, res) {
    var newLogin = new Login(req.body);
    newLogin.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateLogin = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Login.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteLogin = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Login.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getLogin = function (req, res) {
    var id = req.params.id;
    Login.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
