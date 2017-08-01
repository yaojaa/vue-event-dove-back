var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroupPayment = thinky.createModel("EventGroupPayment", {
    	eventGroupPaymentId : type.string(),
	paymentTypeId : type.string(),
	priceUnitId : type.string(),
	eventGroupId : type.string(),
	paymentId : type.string(),
	payType : type.number().integer(),
	payMode : type.string(),
	feeName : type.string(),
	fee : type.number().integer(),
	unitType : type.string(),
	payPlatform : type.number().integer(),
	payDesc : type.string()    
});


exports.EventGroupPaymentModel = EventGroupPayment;

exports.addEventGroupPayment = function (req, res) {
    var newEventGroupPayment = new EventGroupPayment(req.body);
    newEventGroupPayment.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroupPayment = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroupPayment.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroupPayment = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroupPayment.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroupPayment = function (req, res) {
    var id = req.params.id;
    EventGroupPayment.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
