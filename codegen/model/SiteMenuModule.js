var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SiteMenuModule = thinky.createModel("SiteMenuModule", {
    	eventModuleId : type.string(),
	moduleId : type.string(),
	menuId : type.string(),
	siteInfoId : type.string(),
	view : type.number().integer(),
	sort : type.number().integer(),
	moduleType : type.number().integer(),
	macroName : type.string(),
	macroId : type.string(),
	moduleName : type.string(),
	state : type.string()    
});


exports.SiteMenuModuleModel = SiteMenuModule;

exports.addSiteMenuModule = function (req, res) {
    var newSiteMenuModule = new SiteMenuModule(req.body);
    newSiteMenuModule.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSiteMenuModule = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SiteMenuModule.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSiteMenuModule = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SiteMenuModule.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSiteMenuModule = function (req, res) {
    var id = req.params.id;
    SiteMenuModule.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
