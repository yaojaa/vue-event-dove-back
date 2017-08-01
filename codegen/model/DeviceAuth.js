var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var DeviceAuth = thinky.createModel("DeviceAuth", {
    	daId : type.string(),
	ownerId : type.string(),
	eventId : type.string(),
	reqToken : type.string(),
	deviceNumber : type.string(),
	deviceName : type.string(),
	indexNo : type.number().integer(),
	expireTime : type.date(),
	daStatus : type.number().integer()    
});


exports.DeviceAuthModel = DeviceAuth;

exports.addDeviceAuth = function (req, res) {
    var newDeviceAuth = new DeviceAuth(req.body);
    newDeviceAuth.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateDeviceAuth = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    DeviceAuth.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteDeviceAuth = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    DeviceAuth.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getDeviceAuth = function (req, res) {
    var id = req.params.id;
    DeviceAuth.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
