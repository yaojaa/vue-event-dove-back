var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ApiMethodParameter = thinky.createModel("ApiMethodParameter", {
    	methodParamId : type.string(),
	methodId : type.string(),
	paramName : type.string(),
	paramType : type.string(),
	description : type.string(),
	required : type.number().integer(),
	paramCategory : type.number().integer()    
});


exports.ApiMethodParameterModel = ApiMethodParameter;

exports.addApiMethodParameter = function (req, res) {
    var newApiMethodParameter = new ApiMethodParameter(req.body);
    newApiMethodParameter.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateApiMethodParameter = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ApiMethodParameter.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteApiMethodParameter = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ApiMethodParameter.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getApiMethodParameter = function (req, res) {
    var id = req.params.id;
    ApiMethodParameter.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
