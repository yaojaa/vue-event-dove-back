var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var AttendeeTicket = thinky.createModel("AttendeeTicket", {
    	attendeeTicketId : type.string(),
	eventId : type.string(),
	orderId : type.string(),
	userProfileId : type.string(),
	ticketId : type.string(),
	checkinStatus : type.number().integer(),
	checkinTimestamp : type.date(),
	auditTimestamp : type.date(),
	hasAudit : type.number().integer(),
	payStatus : type.number().integer()    
});


exports.AttendeeTicketModel = AttendeeTicket;

exports.addAttendeeTicket = function (req, res) {
    var newAttendeeTicket = new AttendeeTicket(req.body);
    newAttendeeTicket.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateAttendeeTicket = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    AttendeeTicket.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteAttendeeTicket = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    AttendeeTicket.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getAttendeeTicket = function (req, res) {
    var id = req.params.id;
    AttendeeTicket.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
