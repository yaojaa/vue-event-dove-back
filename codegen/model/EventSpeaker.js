var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventSpeaker = thinky.createModel("EventSpeaker", {
    	eventSpeakerId : type.string(),
	speakerId : type.string(),
	eventId : type.string(),
	remark : type.string(),
	sort : type.number().integer(),
	status : type.number().integer(),
	migrateId : type.string(),
	questionCount : type.number().integer(),
	flowerCount : type.number().integer(),
	rewardCount : type.number().integer()    
});


exports.EventSpeakerModel = EventSpeaker;

exports.addEventSpeaker = function (req, res) {
    var newEventSpeaker = new EventSpeaker(req.body);
    newEventSpeaker.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventSpeaker = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventSpeaker.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventSpeaker = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventSpeaker.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventSpeaker = function (req, res) {
    var id = req.params.id;
    EventSpeaker.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
