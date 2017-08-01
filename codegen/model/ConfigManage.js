var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ConfigManage = thinky.createModel("ConfigManage", {
    	configId : type.string(),
	configName : type.string(),
	configCode : type.string(),
	status : type.number().integer(),
	description : type.string(),
	createTime : type.date()    
});


exports.ConfigManageModel = ConfigManage;

exports.addConfigManage = function (req, res) {
    var newConfigManage = new ConfigManage(req.body);
    newConfigManage.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateConfigManage = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ConfigManage.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteConfigManage = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ConfigManage.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getConfigManage = function (req, res) {
    var id = req.params.id;
    ConfigManage.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
