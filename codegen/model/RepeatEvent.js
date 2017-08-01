var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var RepeatEvent = thinky.createModel("RepeatEvent", {
    	repeatEventId : type.string(),
	loginId : type.string(),
	eventId : type.string(),
	repeatType : type.string(),
	everyWeeksOrMonths : type.string(),
	dayOfWeeksOrMonths : type.string(),
	nextStartTime : type.date(),
	nextEndTime : type.date(),
	lastStartTime : type.date(),
	repeatUntil : type.string(),
	state : type.string()    
});


exports.RepeatEventModel = RepeatEvent;

exports.addRepeatEvent = function (req, res) {
    var newRepeatEvent = new RepeatEvent(req.body);
    newRepeatEvent.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateRepeatEvent = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    RepeatEvent.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteRepeatEvent = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    RepeatEvent.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getRepeatEvent = function (req, res) {
    var id = req.params.id;
    RepeatEvent.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
