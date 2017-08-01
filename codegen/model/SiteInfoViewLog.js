var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SiteInfoViewLog = thinky.createModel("SiteInfoViewLog", {
    	logId : type.string(),
	siteInfoId : type.string(),
	counts : type.number().integer(),
	mobileCounts : type.number().integer(),
	createTime : type.date()    
});


exports.SiteInfoViewLogModel = SiteInfoViewLog;

exports.addSiteInfoViewLog = function (req, res) {
    var newSiteInfoViewLog = new SiteInfoViewLog(req.body);
    newSiteInfoViewLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSiteInfoViewLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SiteInfoViewLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSiteInfoViewLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SiteInfoViewLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSiteInfoViewLog = function (req, res) {
    var id = req.params.id;
    SiteInfoViewLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
