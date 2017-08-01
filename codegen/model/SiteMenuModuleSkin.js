var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SiteMenuModuleSkin = thinky.createModel("SiteMenuModuleSkin", {
    	moduleSkinId : type.string(),
	eventId : type.string(),
	siteInfoId : type.string(),
	eventModuleId : type.string(),
	templateCssCode : type.string(),
	skinId : type.string(),
	bgColor : type.string(),
	bgUrl : type.string(),
	bgPosition : type.string(),
	bgRepeat : type.string(),
	bgFix : type.string(),
	bgSize : type.string(),
	color : type.string(),
	iconContent : type.string(),
	iconColor : type.string(),
	titleColor : type.string(),
	titleDisplay : type.number().integer(),
	moduleBgSet : type.number().integer(),
	moduleColorSet : type.number().integer(),
	iconDisplay : type.number().integer(),
	status : type.number().integer()    
});


exports.SiteMenuModuleSkinModel = SiteMenuModuleSkin;

exports.addSiteMenuModuleSkin = function (req, res) {
    var newSiteMenuModuleSkin = new SiteMenuModuleSkin(req.body);
    newSiteMenuModuleSkin.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSiteMenuModuleSkin = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SiteMenuModuleSkin.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSiteMenuModuleSkin = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SiteMenuModuleSkin.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSiteMenuModuleSkin = function (req, res) {
    var id = req.params.id;
    SiteMenuModuleSkin.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
