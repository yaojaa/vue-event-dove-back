var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Skin = thinky.createModel("Skin", {
    	skinId : type.string(),
	templateId : type.string(),
	templateCssCode : type.string(),
	skinName : type.string(),
	skinDefaultCSS : type.string(),
	previewImg : type.string(),
	previewFileUrl : type.string(),
	bannerBgUrl : type.string(),
	bannerAlign : type.string(),
	bannerLayout : type.string(),
	bannerHeight : type.string(),
	bannerCovered : type.number().integer(),
	bannerCoveredSub : type.number().integer(),
	bannerSize : type.string(),
	eventTitleColor : type.string(),
	eventTitleDisplay : type.string(),
	menuOverBgColor : type.string(),
	menuOverBgImg : type.string(),
	menuOverColor : type.string(),
	menuOutBgColor : type.string(),
	menuOutColor : type.string(),
	menuOutHoverBgColor : type.string(),
	menuBgPic : type.string(),
	menuAlign : type.string(),
	menuLayout : type.string(),
	menuBgColor : type.string(),
	menuShadow : type.string(),
	moduleBgUrl : type.string(),
	moduleAlign : type.string(),
	moduleLayout : type.string(),
	moduleBgColor : type.string(),
	moduleTitleBgUrl : type.string(),
	moduleTitleAlign : type.string(),
	moduleTitleLayout : type.string(),
	moduleTitleBgColor : type.string(),
	showModuleBorder : type.string(),
	moduleSkinBorderColor : type.string(),
	moduleTitleColor : type.string(),
	mainLinkColor : type.string(),
	mainTextColor : type.string(),
	subsidiaryColor : type.string(),
	subsidiaryBgColor : type.string(),
	subsidiaryBorderColor : type.string(),
	bodyBgUrl : type.string(),
	bodyAlign : type.string(),
	bodyLayout : type.string(),
	bodyScoll : type.string(),
	bodyBgColor : type.string(),
	contentMainBgColor : type.string(),
	contentMainBgImg : type.string(),
	contentMainBorderColor : type.string(),
	radius : type.string(),
	pageBackGroundStyle : type.string(),
	bannerId : type.string(),
	buttonRadiusSize : type.number().integer(),
	buttonAlignSize : type.string(),
	buttonTitleColor : type.string(),
	buttonBgColor : type.string(),
	buttonBgImg : type.string(),
	buttonOverColor : type.string(),
	locale : type.string(),
	defaultStatus : type.number().integer(),
	paymentStatus : type.number().integer(),
	paymentFunctionCode : type.string()    
});


exports.SkinModel = Skin;

exports.addSkin = function (req, res) {
    var newSkin = new Skin(req.body);
    newSkin.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSkin = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Skin.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSkin = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Skin.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSkin = function (req, res) {
    var id = req.params.id;
    Skin.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
