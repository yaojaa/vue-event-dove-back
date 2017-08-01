var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventCategory = thinky.createModel("EventCategory", {
    	eventCategoryId : type.string(),
	parentEventCategoryId : type.string(),
	categoryName : type.string(),
	categoryDesc : type.string(),
	categoryEnName : type.string(),
	status : type.string(),
	sort : type.number().integer(),
	relationCategory : type.number().integer()    
});


exports.EventCategoryModel = EventCategory;

exports.addEventCategory = function (req, res) {
    var newEventCategory = new EventCategory(req.body);
    newEventCategory.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventCategory = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventCategory.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventCategory = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventCategory.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventCategory = function (req, res) {
    var id = req.params.id;
    EventCategory.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
