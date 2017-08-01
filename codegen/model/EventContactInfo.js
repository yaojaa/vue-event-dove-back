var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventContactInfo = thinky.createModel("EventContactInfo", {
    	eventContactInfoId : type.string(),
	loginId : type.string(),
	userName : type.string(),
	cellPhone : type.string(),
	homePhone : type.string(),
	contactEmail : type.string(),
	contactAddress : type.string(),
	company : type.string(),
	jobTitle : type.string(),
	contactZipCode : type.string(),
	webSite : type.string()    
});


exports.EventContactInfoModel = EventContactInfo;

exports.addEventContactInfo = function (req, res) {
    var newEventContactInfo = new EventContactInfo(req.body);
    newEventContactInfo.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventContactInfo = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventContactInfo.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventContactInfo = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventContactInfo.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventContactInfo = function (req, res) {
    var id = req.params.id;
    EventContactInfo.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
