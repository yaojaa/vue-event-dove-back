var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroupTicketFlag = thinky.createModel("EventGroupTicketFlag", {
    	eventGroupTicketFlag : type.number().integer(),
	matchGroupId : type.string(),
	flag : type.number().integer()    
});


exports.EventGroupTicketFlagModel = EventGroupTicketFlag;

exports.addEventGroupTicketFlag = function (req, res) {
    var newEventGroupTicketFlag = new EventGroupTicketFlag(req.body);
    newEventGroupTicketFlag.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroupTicketFlag = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroupTicketFlag.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroupTicketFlag = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroupTicketFlag.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroupTicketFlag = function (req, res) {
    var id = req.params.id;
    EventGroupTicketFlag.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
