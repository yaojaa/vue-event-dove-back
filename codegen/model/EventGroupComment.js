var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroupComment = thinky.createModel("EventGroupComment", {
    	groupCommentId : type.string(),
	eventId : type.string(),
	eventGroupId : type.string(),
	groupMemberId : type.string(),
	commemt : type.string(),
	nickname : type.string(),
	email : type.string(),
	icon : type.string(),
	commentTime : type.date(),
	lastUpdateTime : type.date()    
});


exports.EventGroupCommentModel = EventGroupComment;

exports.addEventGroupComment = function (req, res) {
    var newEventGroupComment = new EventGroupComment(req.body);
    newEventGroupComment.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroupComment = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroupComment.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroupComment = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroupComment.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroupComment = function (req, res) {
    var id = req.params.id;
    EventGroupComment.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
