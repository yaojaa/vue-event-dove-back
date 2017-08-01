var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var CustomMailTemplate = thinky.createModel("CustomMailTemplate", {
    	customMailTemplateId : type.string(),
	emailTemplateId : type.string(),
	customMailTemplateDetailId : type.string(),
	templateCode : type.string(),
	loginId : type.string(),
	title : type.string(),
	used : type.number().integer(),
	type : type.number().integer(),
	status : type.number().integer(),
	customContent : type.string(),
	createTime : type.date()    
});


exports.CustomMailTemplateModel = CustomMailTemplate;

exports.addCustomMailTemplate = function (req, res) {
    var newCustomMailTemplate = new CustomMailTemplate(req.body);
    newCustomMailTemplate.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateCustomMailTemplate = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    CustomMailTemplate.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteCustomMailTemplate = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    CustomMailTemplate.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getCustomMailTemplate = function (req, res) {
    var id = req.params.id;
    CustomMailTemplate.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
