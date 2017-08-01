var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var MarketingEmail = thinky.createModel("MarketingEmail", {
    	marketingEmailId : type.string(),
	chFromName : type.string(),
	enFromName : type.string(),
	chineseContent : type.string(),
	englishContent : type.string(),
	chineseSubject : type.string(),
	englishSubject : type.string(),
	localStatus : type.number().integer(),
	startRecipientTime : type.date(),
	endRecipientTime : type.date(),
	sendType : type.number().integer(),
	sendTime : type.date(),
	sendStatus : type.number().integer(),
	sendTimeStamp : type.date(),
	sendDays : type.string(),
	recipientCount : type.number().integer(),
	createTime : type.date()    
});


exports.MarketingEmailModel = MarketingEmail;

exports.addMarketingEmail = function (req, res) {
    var newMarketingEmail = new MarketingEmail(req.body);
    newMarketingEmail.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateMarketingEmail = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    MarketingEmail.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteMarketingEmail = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    MarketingEmail.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getMarketingEmail = function (req, res) {
    var id = req.params.id;
    MarketingEmail.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
