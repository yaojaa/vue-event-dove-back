var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ModuleFormData = thinky.createModel("ModuleFormData", {
    	moduleFormDataId : type.string(),
	eventId : type.string(),
	moduleId : type.string(),
	moduleRegFormId : type.string(),
	loginId : type.string(),
	firstName : type.string(),
	lastName : type.string(),
	userName : type.string(),
	homePhone : type.string(),
	cellPhone : type.string(),
	emailAddress : type.string(),
	homeAddress : type.string(),
	jobTitle : type.string(),
	companyOrorganization : type.string(),
	workPhone : type.string(),
	website : type.string(),
	blog : type.string(),
	gender : type.string(),
	age : type.string(),
	fax : type.string(),
	zipCode : type.string(),
	post : type.string(),
	department : type.string(),
	address : type.string(),
	profileData : type.string(),
	createTime : type.date()    
});


exports.ModuleFormDataModel = ModuleFormData;

exports.addModuleFormData = function (req, res) {
    var newModuleFormData = new ModuleFormData(req.body);
    newModuleFormData.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateModuleFormData = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ModuleFormData.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteModuleFormData = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ModuleFormData.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getModuleFormData = function (req, res) {
    var id = req.params.id;
    ModuleFormData.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
