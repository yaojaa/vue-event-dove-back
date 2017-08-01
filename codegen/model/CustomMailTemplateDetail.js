var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var CustomMailTemplateDetail = thinky.createModel("CustomMailTemplateDetail", {
    	customMailTemplateDetailId : type.string(),
	customMailTemplateId : type.string(),
	eventGroupId : type.string(),
	eventId : type.string(),
	loginId : type.string()    
});


exports.CustomMailTemplateDetailModel = CustomMailTemplateDetail;

exports.addCustomMailTemplateDetail = function (req, res) {
    var newCustomMailTemplateDetail = new CustomMailTemplateDetail(req.body);
    newCustomMailTemplateDetail.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateCustomMailTemplateDetail = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    CustomMailTemplateDetail.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteCustomMailTemplateDetail = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    CustomMailTemplateDetail.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getCustomMailTemplateDetail = function (req, res) {
    var id = req.params.id;
    CustomMailTemplateDetail.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
