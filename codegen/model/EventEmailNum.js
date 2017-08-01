var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventEmailNum = thinky.createModel("EventEmailNum", {
    	emailNumId : type.string(),
	eventId : type.string(),
	usedCount : type.number().integer(),
	canUseCount : type.number().integer()    
});


exports.EventEmailNumModel = EventEmailNum;

exports.addEventEmailNum = function (req, res) {
    var newEventEmailNum = new EventEmailNum(req.body);
    newEventEmailNum.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventEmailNum = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventEmailNum.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventEmailNum = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventEmailNum.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventEmailNum = function (req, res) {
    var id = req.params.id;
    EventEmailNum.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
