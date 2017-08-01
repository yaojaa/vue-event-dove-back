var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventActivityDetails = thinky.createModel("EventActivityDetails", {
    	id : type.number().integer(),
	eventId : type.string(),
	loginId : type.string(),
	collectionPointId : type.string(),
	runSign : type.string(),
	activityActionCode : type.string(),
	activityData : type.string(),
	createTime : type.date()    
});


exports.EventActivityDetailsModel = EventActivityDetails;

exports.addEventActivityDetails = function (req, res) {
    var newEventActivityDetails = new EventActivityDetails(req.body);
    newEventActivityDetails.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventActivityDetails = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventActivityDetails.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventActivityDetails = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventActivityDetails.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventActivityDetails = function (req, res) {
    var id = req.params.id;
    EventActivityDetails.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
