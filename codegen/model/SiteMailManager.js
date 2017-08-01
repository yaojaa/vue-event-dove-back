var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SiteMailManager = thinky.createModel("SiteMailManager", {
    	siteMailId : type.string(),
	emailTemplateId : type.string(),
	loginId : type.string(),
	eventId : type.string(),
	eventMessageId : type.string(),
	replyStatus : type.number().integer(),
	sendStatus : type.number().integer(),
	fromAddress : type.string(),
	fromName : type.string(),
	replyAddress : type.string(),
	toAddress : type.string(),
	toName : type.string(),
	mailCount : type.number().integer(),
	subject : type.string(),
	subSubject : type.string(),
	toStruct : type.string(),
	replyContent : type.string(),
	replySubEnContent : type.string(),
	replySubContent : type.string(),
	content : type.string(),
	subEnContent : type.string(),
	subContent : type.string(),
	attachmentPath : type.string(),
	sendTimestamp : type.date(),
	replyTimestamp : type.date()    
});


exports.SiteMailManagerModel = SiteMailManager;

exports.addSiteMailManager = function (req, res) {
    var newSiteMailManager = new SiteMailManager(req.body);
    newSiteMailManager.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSiteMailManager = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SiteMailManager.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSiteMailManager = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SiteMailManager.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSiteMailManager = function (req, res) {
    var id = req.params.id;
    SiteMailManager.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
