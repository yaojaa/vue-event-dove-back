var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventResource = thinky.createModel("EventResource", {
    	eventResourcesId : type.string(),
	eventId : type.string(),
	resourceId : type.string()    
});


exports.EventResourceModel = EventResource;

exports.addEventResource = function (req, res) {
    var newEventResource = new EventResource(req.body);
    newEventResource.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventResource = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventResource.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventResource = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventResource.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventResource = function (req, res) {
    var id = req.params.id;
    EventResource.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
