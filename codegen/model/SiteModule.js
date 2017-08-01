var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SiteModule = thinky.createModel("SiteModule", {
    	moduleId : type.string(),
	siteInfoId : type.string(),
	loginId : type.string(),
	descriptionId : type.string(),
	moduleName : type.string(),
	moduleIcon : type.string(),
	fmtModuleName : type.string(),
	sort : type.number().integer(),
	moduleType : type.number().integer(),
	functionType : type.number().integer(),
	cssClass : type.string(),
	mobileCssClass : type.string(),
	content : type.string(),
	mobileContent : type.string(),
	createTime : type.date(),
	templateId : type.string(),
	macroId : type.string(),
	macroName : type.string(),
	public : type.number().integer(),
	appType : type.number().integer(),
	state : type.string(),
	locale : type.string()    
});


exports.SiteModuleModel = SiteModule;

exports.addSiteModule = function (req, res) {
    var newSiteModule = new SiteModule(req.body);
    newSiteModule.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSiteModule = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SiteModule.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSiteModule = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SiteModule.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSiteModule = function (req, res) {
    var id = req.params.id;
    SiteModule.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
