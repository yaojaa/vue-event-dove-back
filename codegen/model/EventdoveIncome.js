var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventdoveIncome = thinky.createModel("EventdoveIncome", {
    	eventdoveIncomeId : type.string(),
	loginId : type.string(),
	totalIncome : type.number().integer(),
	unreqIncome : type.number().integer(),
	reqIncome : type.number().integer(),
	unreqPromoteFee : type.number(),
	reqPromoteFee : type.number(),
	updateTime : type.date(),
	reqTime : type.date()    
});


exports.EventdoveIncomeModel = EventdoveIncome;

exports.addEventdoveIncome = function (req, res) {
    var newEventdoveIncome = new EventdoveIncome(req.body);
    newEventdoveIncome.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventdoveIncome = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventdoveIncome.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventdoveIncome = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventdoveIncome.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventdoveIncome = function (req, res) {
    var id = req.params.id;
    EventdoveIncome.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
