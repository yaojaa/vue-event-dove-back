var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventContact = thinky.createModel("EventContact", {
    	eventContactId : type.string(),
	eventId : type.string(),
	organizerId : type.string(),
	weiXin : type.string(),
	phone : type.string(),
	mobile : type.string(),
	qq : type.string(),
	emailAddress : type.string(),
	createTime : type.date()    
});


exports.EventContactModel = EventContact;

exports.addEventContact = function (req, res) {
    var newEventContact = new EventContact(req.body);
    newEventContact.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventContact = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventContact.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventContact = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventContact.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventContact = function (req, res) {
    var id = req.params.id;
    EventContact.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
