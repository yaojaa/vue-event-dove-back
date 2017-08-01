var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var PartnerEvents = thinky.createModel("PartnerEvents", {
    	partnerEventsId : type.string(),
	loginId : type.string(),
	partnerId : type.string(),
	createTime : type.date(),
	retriveAttendee : type.number().integer()    
});


exports.PartnerEventsModel = PartnerEvents;

exports.addPartnerEvents = function (req, res) {
    var newPartnerEvents = new PartnerEvents(req.body);
    newPartnerEvents.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updatePartnerEvents = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    PartnerEvents.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deletePartnerEvents = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    PartnerEvents.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getPartnerEvents = function (req, res) {
    var id = req.params.id;
    PartnerEvents.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
