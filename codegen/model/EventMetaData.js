var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventMetaData = thinky.createModel("EventMetaData", {
    	metaDataId : type.string(),
	eventId : type.string(),
	dataKey : type.string(),
	value : type.string(),
	createTime : type.date()    
});


exports.EventMetaDataModel = EventMetaData;

exports.addEventMetaData = function (req, res) {
    var newEventMetaData = new EventMetaData(req.body);
    newEventMetaData.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventMetaData = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventMetaData.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventMetaData = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventMetaData.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventMetaData = function (req, res) {
    var id = req.params.id;
    EventMetaData.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
