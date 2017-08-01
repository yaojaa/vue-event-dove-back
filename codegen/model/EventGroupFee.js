var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroupFee = thinky.createModel("EventGroupFee", {
    	groupFeeId : type.string(),
	eventGroupId : type.string(),
	priceUnitId : type.string(),
	basicFee : type.number(),
	minLimit : type.string(),
	maxLimit : type.string(),
	fee : type.number().integer(),
	discountType : type.string(),
	discountPercent : type.string(),
	unitType : type.string(),
	status : type.number().integer()    
});


exports.EventGroupFeeModel = EventGroupFee;

exports.addEventGroupFee = function (req, res) {
    var newEventGroupFee = new EventGroupFee(req.body);
    newEventGroupFee.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroupFee = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroupFee.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroupFee = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroupFee.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroupFee = function (req, res) {
    var id = req.params.id;
    EventGroupFee.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
