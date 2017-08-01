var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EdLoginRole = thinky.createModel("EdLoginRole", {
    	loginRoleId : type.string(),
	loginId : type.string(),
	eventId : type.string(),
	roleId : type.string(),
	createTime : type.date(),
	checkExpire : type.number().integer(),
	effectiveTime : type.date(),
	expireTime : type.date(),
	loginRoleType : type.number().integer()    
});


exports.EdLoginRoleModel = EdLoginRole;

exports.addEdLoginRole = function (req, res) {
    var newEdLoginRole = new EdLoginRole(req.body);
    newEdLoginRole.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEdLoginRole = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EdLoginRole.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEdLoginRole = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EdLoginRole.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEdLoginRole = function (req, res) {
    var id = req.params.id;
    EdLoginRole.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
