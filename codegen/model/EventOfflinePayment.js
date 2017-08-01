var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventOfflinePayment = thinky.createModel("EventOfflinePayment", {
    	id : type.number().integer(),
	eventId : type.string(),
	offlinePaymentId : type.string()    
});


exports.EventOfflinePaymentModel = EventOfflinePayment;

exports.addEventOfflinePayment = function (req, res) {
    var newEventOfflinePayment = new EventOfflinePayment(req.body);
    newEventOfflinePayment.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventOfflinePayment = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventOfflinePayment.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventOfflinePayment = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventOfflinePayment.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventOfflinePayment = function (req, res) {
    var id = req.params.id;
    EventOfflinePayment.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
