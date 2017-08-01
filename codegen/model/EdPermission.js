var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EdPermission = thinky.createModel("EdPermission", {
    	permissionId : type.string(),
	feeDetailId : type.string(),
	roleId : type.string(),
	checkExpire : type.number().integer(),
	createTime : type.date(),
	expireTime : type.date()    
});


exports.EdPermissionModel = EdPermission;

exports.addEdPermission = function (req, res) {
    var newEdPermission = new EdPermission(req.body);
    newEdPermission.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEdPermission = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EdPermission.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEdPermission = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EdPermission.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEdPermission = function (req, res) {
    var id = req.params.id;
    EdPermission.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
