var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var AutoLoginInfo = thinky.createModel("AutoLoginInfo", {
    	id : type.number().integer(),
	loginId : type.string(),
	token : type.string(),
	expirationTime : type.date(),
	ip : type.string(),
	loginSource : type.number().integer(),
	createTime : type.date()    
});


exports.AutoLoginInfoModel = AutoLoginInfo;

exports.addAutoLoginInfo = function (req, res) {
    var newAutoLoginInfo = new AutoLoginInfo(req.body);
    newAutoLoginInfo.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateAutoLoginInfo = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    AutoLoginInfo.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteAutoLoginInfo = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    AutoLoginInfo.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getAutoLoginInfo = function (req, res) {
    var id = req.params.id;
    AutoLoginInfo.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
