var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SiteTemplate = thinky.createModel("SiteTemplate", {
    	templateId : type.string(),
	templateName : type.string(),
	templateFmt : type.string(),
	previewImg : type.string(),
	templateTypeId : type.string(),
	templateCode : type.string(),
	templateContent : type.string(),
	templateMobileContent : type.string(),
	status : type.number().integer(),
	customStatus : type.number().integer()    
});


exports.SiteTemplateModel = SiteTemplate;

exports.addSiteTemplate = function (req, res) {
    var newSiteTemplate = new SiteTemplate(req.body);
    newSiteTemplate.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSiteTemplate = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SiteTemplate.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSiteTemplate = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SiteTemplate.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSiteTemplate = function (req, res) {
    var id = req.params.id;
    SiteTemplate.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
