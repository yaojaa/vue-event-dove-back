var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SiteMenuItem = thinky.createModel("SiteMenuItem", {
    	menuId : type.string(),
	siteInfoId : type.string(),
	templateId : type.string(),
	menuType : type.number().integer(),
	menuName : type.string(),
	menuEnName : type.string(),
	changedMenuName : type.string(),
	mainPage : type.number().integer(),
	sort : type.number().integer(),
	state : type.string(),
	layoutStatus : type.number().integer(),
	link : type.string(),
	mobile : type.number().integer()    
});


exports.SiteMenuItemModel = SiteMenuItem;

exports.addSiteMenuItem = function (req, res) {
    var newSiteMenuItem = new SiteMenuItem(req.body);
    newSiteMenuItem.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSiteMenuItem = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SiteMenuItem.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSiteMenuItem = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SiteMenuItem.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSiteMenuItem = function (req, res) {
    var id = req.params.id;
    SiteMenuItem.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
