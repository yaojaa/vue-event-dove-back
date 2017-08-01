var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var RegisterField = thinky.createModel("RegisterField", {
    	fieldId : type.string(),
	fieldCategoryId : type.string(),
	fieldName : type.string(),
	showName : type.string(),
	type : type.string(),
	maxlength : type.number().integer(),
	sort : type.number().integer(),
	source : type.number().integer(),
	fieldType : type.number().integer(),
	regexp : type.string(),
	retain : type.number().integer(),
	locale : type.string()    
});


exports.RegisterFieldModel = RegisterField;

exports.addRegisterField = function (req, res) {
    var newRegisterField = new RegisterField(req.body);
    newRegisterField.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateRegisterField = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    RegisterField.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteRegisterField = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    RegisterField.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getRegisterField = function (req, res) {
    var id = req.params.id;
    RegisterField.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
