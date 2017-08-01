var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SkinCustom = thinky.createModel("SkinCustom", {
    	skinCustomId : type.string(),
	skinId : type.string(),
	bannerBgUrl : type.string(),
	bannerAlign : type.string(),
	bannerLayout : type.string(),
	bannerHeight : type.string(),
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
	customButtonStyle : type.number().integer(),
	buttonBgType : type.number().integer(),
	buttonBgColor : type.string(),
	showButtonBglight : type.number().integer(),
	buttonBgImg : type.string(),
	buttonOverColor : type.string(),
	buttonTitleColor : type.string(),
	buttonBorderColor : type.string(),
	showButtonBoder : type.number().integer(),
	buttonRadiusSize : type.number().integer()    
});


exports.SkinCustomModel = SkinCustom;

exports.addSkinCustom = function (req, res) {
    var newSkinCustom = new SkinCustom(req.body);
    newSkinCustom.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSkinCustom = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SkinCustom.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSkinCustom = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SkinCustom.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSkinCustom = function (req, res) {
    var id = req.params.id;
    SkinCustom.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
