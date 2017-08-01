var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var MobileModuleConfig = thinky.createModel("MobileModuleConfig", {
    	configId : type.string(),
	siteInfoId : type.string(),
	moduleId : type.string(),
	sort : type.number().integer(),
	status : type.string()    
});


exports.MobileModuleConfigModel = MobileModuleConfig;

exports.addMobileModuleConfig = function (req, res) {
    var newMobileModuleConfig = new MobileModuleConfig(req.body);
    newMobileModuleConfig.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateMobileModuleConfig = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    MobileModuleConfig.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteMobileModuleConfig = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    MobileModuleConfig.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getMobileModuleConfig = function (req, res) {
    var id = req.params.id;
    MobileModuleConfig.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
