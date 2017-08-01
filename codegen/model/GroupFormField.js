var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var GroupFormField = thinky.createModel("GroupFormField", {
    	groupFormFieldId : type.string(),
	groupFormId : type.string(),
	fieldId : type.string(),
	required : type.number().integer(),
	status : type.string(),
	maxlength : type.number().integer(),
	fieldName : type.string(),
	genHtml : type.string(),
	showName : type.string(),
	enShowName : type.string(),
	enShowValue : type.string(),
	showValue : type.string(),
	errorInfo : type.string(),
	description : type.string(),
	sort : type.number().integer()    
});


exports.GroupFormFieldModel = GroupFormField;

exports.addGroupFormField = function (req, res) {
    var newGroupFormField = new GroupFormField(req.body);
    newGroupFormField.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateGroupFormField = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    GroupFormField.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteGroupFormField = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    GroupFormField.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getGroupFormField = function (req, res) {
    var id = req.params.id;
    GroupFormField.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
