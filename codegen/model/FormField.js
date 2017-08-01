var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var FormField = thinky.createModel("FormField", {
    	formFieldId : type.string(),
	eventFormId : type.string(),
	fieldId : type.string(),
	conditionId : type.string(),
	ticketIds : type.string(),
	required : type.number().integer(),
	status : type.string(),
	maxlength : type.number().integer(),
	fieldName : type.string(),
	genHtml : type.string(),
	showName : type.string(),
	enShowName : type.string(),
	enShowValue : type.string(),
	showValue : type.string(),
	allowDuplicate : type.number().integer(),
	fieldRegexp : type.string(),
	hasSubStatus : type.number().integer(),
	errorInfo : type.string(),
	description : type.string(),
	sort : type.number().integer()    
});


exports.FormFieldModel = FormField;

exports.addFormField = function (req, res) {
    var newFormField = new FormField(req.body);
    newFormField.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateFormField = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    FormField.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteFormField = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    FormField.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getFormField = function (req, res) {
    var id = req.params.id;
    FormField.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
