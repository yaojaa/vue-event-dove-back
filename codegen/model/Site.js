var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Site = thinky.createModel("Site", {
    	siteId : type.string(),
	siteInfoId : type.string(),
	pageId : type.string(),
	siteHeaderId : type.string(),
	siteBottomId : type.string(),
	siteLayoutId : type.string(),
	mobileSiteMenuId : type.string(),
	favicon : type.string(),
	styles : type.string()    
});


exports.SiteModel = Site;

exports.addSite = function (req, res) {
    var newSite = new Site(req.body);
    newSite.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSite = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Site.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSite = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Site.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSite = function (req, res) {
    var id = req.params.id;
    Site.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
