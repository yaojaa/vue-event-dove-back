var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var MobilePageTemplate = thinky.createModel("MobilePageTemplate", {
    	mobilePageTemplateId : type.string(),
	name : type.string(),
	types : type.string(),
	content : type.string(),
	sort : type.number().integer()    
});


exports.MobilePageTemplateModel = MobilePageTemplate;

exports.addMobilePageTemplate = function (req, res) {
    var newMobilePageTemplate = new MobilePageTemplate(req.body);
    newMobilePageTemplate.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateMobilePageTemplate = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    MobilePageTemplate.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteMobilePageTemplate = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    MobilePageTemplate.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getMobilePageTemplate = function (req, res) {
    var id = req.params.id;
    MobilePageTemplate.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
