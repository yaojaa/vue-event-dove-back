var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var OrganizerActivity = thinky.createModel("OrganizerActivity", {
    	organizerActivityId : type.string(),
	organizerId : type.string(),
	loginId : type.string(),
	eventId : type.string(),
	autoFlag : type.number().integer(),
	eventTitle : type.string(),
	subdomainName : type.string(),
	attendeeCount : type.number().integer(),
	activityTime : type.date()    
});


exports.OrganizerActivityModel = OrganizerActivity;

exports.addOrganizerActivity = function (req, res) {
    var newOrganizerActivity = new OrganizerActivity(req.body);
    newOrganizerActivity.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateOrganizerActivity = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    OrganizerActivity.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteOrganizerActivity = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    OrganizerActivity.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getOrganizerActivity = function (req, res) {
    var id = req.params.id;
    OrganizerActivity.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
