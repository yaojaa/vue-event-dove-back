var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ClientVersion = thinky.createModel("ClientVersion", {
    	versionId : type.string(),
	platformId : type.string(),
	platformName : type.string(),
	versionName : type.string(),
	versionNo : type.string(),
	versionCode : type.number().integer(),
	clientUrl : type.string(),
	mustUpdate : type.number().integer(),
	versionPublishTime : type.date(),
	versionContent : type.string()    
});


exports.ClientVersionModel = ClientVersion;

exports.addClientVersion = function (req, res) {
    var newClientVersion = new ClientVersion(req.body);
    newClientVersion.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateClientVersion = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ClientVersion.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteClientVersion = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ClientVersion.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getClientVersion = function (req, res) {
    var id = req.params.id;
    ClientVersion.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
