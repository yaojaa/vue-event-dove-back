var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var IpAddress = thinky.createModel("IpAddress", {
    	ipAddressId : type.string(),
	startIp : type.number().integer(),
	endIp : type.number().integer(),
	ipAddress : type.string()    
});


exports.IpAddressModel = IpAddress;

exports.addIpAddress = function (req, res) {
    var newIpAddress = new IpAddress(req.body);
    newIpAddress.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateIpAddress = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    IpAddress.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteIpAddress = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    IpAddress.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getIpAddress = function (req, res) {
    var id = req.params.id;
    IpAddress.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
