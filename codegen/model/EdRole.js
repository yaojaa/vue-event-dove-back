var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EdRole = thinky.createModel("EdRole", {
    	roleId : type.string(),
	roleType : type.number().integer(),
	roleName : type.string(),
	roleDesc : type.string(),
	roleState : type.string()    
});


exports.EdRoleModel = EdRole;

exports.addEdRole = function (req, res) {
    var newEdRole = new EdRole(req.body);
    newEdRole.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEdRole = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EdRole.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEdRole = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EdRole.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEdRole = function (req, res) {
    var id = req.params.id;
    EdRole.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
