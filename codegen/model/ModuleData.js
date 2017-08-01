var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ModuleData = thinky.createModel("ModuleData", {
    	moduleDataId : type.string(),
	descriptionId : type.string(),
	dataContent : type.string(),
	createTime : type.date(),
	sort : type.number().integer(),
	comment : type.number().integer(),
	startTime : type.date(),
	updateTime : type.date(),
	endTime : type.date()    
});


exports.ModuleDataModel = ModuleData;

exports.addModuleData = function (req, res) {
    var newModuleData = new ModuleData(req.body);
    newModuleData.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateModuleData = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ModuleData.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteModuleData = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ModuleData.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getModuleData = function (req, res) {
    var id = req.params.id;
    ModuleData.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
