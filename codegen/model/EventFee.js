var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventFee = thinky.createModel("EventFee", {
    	eventFeeId : type.string(),
	eventId : type.string(),
	loginId : type.string(),
	basePrice : type.number().integer(),
	ticketPercent : type.number().integer(),
	maxFee : type.number()    
});


exports.EventFeeModel = EventFee;

exports.addEventFee = function (req, res) {
    var newEventFee = new EventFee(req.body);
    newEventFee.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventFee = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventFee.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventFee = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventFee.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventFee = function (req, res) {
    var id = req.params.id;
    EventFee.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
