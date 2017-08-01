var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var GroupRegForm = thinky.createModel("GroupRegForm", {
    	groupFormId : type.string(),
	eventGroupId : type.string(),
	formName : type.string(),
	timeLimit : type.number().integer(),
	groupEndMessage : type.string(),
	formType : type.number().integer()    
});


exports.GroupRegFormModel = GroupRegForm;

exports.addGroupRegForm = function (req, res) {
    var newGroupRegForm = new GroupRegForm(req.body);
    newGroupRegForm.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateGroupRegForm = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    GroupRegForm.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteGroupRegForm = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    GroupRegForm.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getGroupRegForm = function (req, res) {
    var id = req.params.id;
    GroupRegForm.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
