var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ConfigDetails = thinky.createModel("ConfigDetails", {
    	configDetailsId : type.string(),
	configId : type.string(),
	configValue : type.string(),
	configShowValue : type.string(),
	defaultValue : type.number().integer()    
});


exports.ConfigDetailsModel = ConfigDetails;

exports.addConfigDetails = function (req, res) {
    var newConfigDetails = new ConfigDetails(req.body);
    newConfigDetails.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateConfigDetails = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ConfigDetails.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteConfigDetails = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ConfigDetails.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getConfigDetails = function (req, res) {
    var id = req.params.id;
    ConfigDetails.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
