var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SiteInfo = thinky.createModel("SiteInfo", {
    	siteInfoId : type.string(),
	skinId : type.string(),
	skinCustomId : type.string(),
	mobileSkinId : type.string(),
	mobileSkinCustomId : type.string(),
	bannerId : type.string(),
	defineSkinId : type.string(),
	templateId : type.string(),
	mobileTemplateId : type.string(),
	siteName : type.string(),
	metaContent : type.string(),
	backMetaContent : type.string(),
	subdomainName : type.string(),
	viewCount : type.number().integer(),
	mobileViewCount : type.number().integer(),
	siteFlow : type.number().integer(),
	logoUrl : type.string(),
	bannerAddress : type.string(),
	bannerLink : type.string(),
	bannerType : type.string(),
	backgroundPicType : type.string(),
	defaultSkin : type.string(),
	mobileDefaultSkin : type.string(),
	customModuleSkin : type.number().integer(),
	mobileCustomModuleSkin : type.number().integer(),
	createTime : type.date(),
	analyticsCode : type.string(),
	refererUrl : type.string(),
	refererBackUrl : type.string(),
	mainDivHeight : type.number().integer(),
	state : type.string(),
	showAttentionQrImg : type.number().integer(),
	showSiteUrlQrImg : type.number().integer(),
	layoutStatus : type.number().integer()    
});


exports.SiteInfoModel = SiteInfo;

exports.addSiteInfo = function (req, res) {
    var newSiteInfo = new SiteInfo(req.body);
    newSiteInfo.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSiteInfo = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SiteInfo.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSiteInfo = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SiteInfo.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSiteInfo = function (req, res) {
    var id = req.params.id;
    SiteInfo.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
