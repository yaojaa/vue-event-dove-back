var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ModuleFormField = thinky.createModel("ModuleFormField", {
    	formFieldId : type.string(),
	fieldId : type.string(),
	eventId : type.string(),
	moduleId : type.string(),
	moduleRegFormId : type.string(),
	required : type.number().integer(),
	status : type.string(),
	maxlength : type.number().integer(),
	fieldName : type.string(),
	genHtml : type.string(),
	showName : type.string(),
	enShowName : type.string(),
	showValue : type.string(),
	enShowValue : type.string(),
	errorInfo : type.string(),
	description : type.string(),
	sort : type.number().integer()    
});


exports.ModuleFormFieldModel = ModuleFormField;

exports.addModuleFormField = function (req, res) {
    var newModuleFormField = new ModuleFormField(req.body);
    newModuleFormField.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateModuleFormField = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ModuleFormField.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteModuleFormField = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ModuleFormField.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getModuleFormField = function (req, res) {
    var id = req.params.id;
    ModuleFormField.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
