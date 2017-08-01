var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventRegForm = thinky.createModel("EventRegForm", {
    	eventFormId : type.string(),
	eventId : type.string(),
	formName : type.string(),
	timeLimit : type.number().integer(),
	eventEndMessage : type.string(),
	formType : type.number().integer()    
});


exports.EventRegFormModel = EventRegForm;

exports.addEventRegForm = function (req, res) {
    var newEventRegForm = new EventRegForm(req.body);
    newEventRegForm.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventRegForm = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventRegForm.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventRegForm = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventRegForm.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventRegForm = function (req, res) {
    var id = req.params.id;
    EventRegForm.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
