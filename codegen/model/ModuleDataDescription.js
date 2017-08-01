var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ModuleDataDescription = thinky.createModel("ModuleDataDescription", {
    	descriptionId : type.string(),
	moduleName : type.string(),
	moduleType : type.number().integer()    
});


exports.ModuleDataDescriptionModel = ModuleDataDescription;

exports.addModuleDataDescription = function (req, res) {
    var newModuleDataDescription = new ModuleDataDescription(req.body);
    newModuleDataDescription.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateModuleDataDescription = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ModuleDataDescription.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteModuleDataDescription = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ModuleDataDescription.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getModuleDataDescription = function (req, res) {
    var id = req.params.id;
    ModuleDataDescription.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
