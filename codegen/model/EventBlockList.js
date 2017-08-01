var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventBlockList = thinky.createModel("EventBlockList", {
    	eventBlockId : type.string(),
	eventId : type.string(),
	showType : type.number().integer()    
});


exports.EventBlockListModel = EventBlockList;

exports.addEventBlockList = function (req, res) {
    var newEventBlockList = new EventBlockList(req.body);
    newEventBlockList.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventBlockList = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventBlockList.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventBlockList = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventBlockList.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventBlockList = function (req, res) {
    var id = req.params.id;
    EventBlockList.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
