var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventRelate = thinky.createModel("EventRelate", {
    	eventRelateId : type.string(),
	masterEventId : type.string(),
	slaveEventId : type.string(),
	state : type.string()    
});


exports.EventRelateModel = EventRelate;

exports.addEventRelate = function (req, res) {
    var newEventRelate = new EventRelate(req.body);
    newEventRelate.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventRelate = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventRelate.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventRelate = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventRelate.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventRelate = function (req, res) {
    var id = req.params.id;
    EventRelate.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
