var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ModuleRegForm = thinky.createModel("ModuleRegForm", {
    	moduleRegFormId : type.string(),
	eventId : type.string(),
	moduleId : type.string(),
	remark : type.string(),
	submitTips : type.string(),
	loginStatus : type.number().integer()    
});


exports.ModuleRegFormModel = ModuleRegForm;

exports.addModuleRegForm = function (req, res) {
    var newModuleRegForm = new ModuleRegForm(req.body);
    newModuleRegForm.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateModuleRegForm = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ModuleRegForm.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteModuleRegForm = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ModuleRegForm.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getModuleRegForm = function (req, res) {
    var id = req.params.id;
    ModuleRegForm.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
