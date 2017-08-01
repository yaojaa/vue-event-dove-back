var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventComment = thinky.createModel("EventComment", {
    	commentId : type.string(),
	loginId : type.string(),
	viewName : type.string(),
	eventId : type.string(),
	eventGroupId : type.string(),
	content : type.string(),
	refCount : type.string(),
	commentTime : type.date(),
	lastUpdateTime : type.date(),
	state : type.string()    
});


exports.EventCommentModel = EventComment;

exports.addEventComment = function (req, res) {
    var newEventComment = new EventComment(req.body);
    newEventComment.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventComment = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventComment.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventComment = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventComment.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventComment = function (req, res) {
    var id = req.params.id;
    EventComment.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
