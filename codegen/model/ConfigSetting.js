var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ConfigSetting = thinky.createModel("ConfigSetting", {
    	id : type.number().integer(),
	eventId : type.string(),
	loginId : type.string(),
	configCode : type.string(),
	defultStatus : type.number().integer(),
	configValue : type.string(),
	expressStatus : type.number().integer(),
	configShowValue : type.string(),
	configDetail : type.string()    
});


exports.ConfigSettingModel = ConfigSetting;

exports.addConfigSetting = function (req, res) {
    var newConfigSetting = new ConfigSetting(req.body);
    newConfigSetting.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateConfigSetting = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ConfigSetting.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteConfigSetting = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ConfigSetting.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getConfigSetting = function (req, res) {
    var id = req.params.id;
    ConfigSetting.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
