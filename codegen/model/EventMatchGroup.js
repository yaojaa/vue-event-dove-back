var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventMatchGroup = thinky.createModel("EventMatchGroup", {
    	matchGroupId : type.string(),
	eventGroupId : type.string(),
	eventId : type.string(),
	status : type.number().integer(),
	checkStatus : type.number().integer(),
	deleteStatus : type.string()    
});


exports.EventMatchGroupModel = EventMatchGroup;

exports.addEventMatchGroup = function (req, res) {
    var newEventMatchGroup = new EventMatchGroup(req.body);
    newEventMatchGroup.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventMatchGroup = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventMatchGroup.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventMatchGroup = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventMatchGroup.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventMatchGroup = function (req, res) {
    var id = req.params.id;
    EventMatchGroup.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
