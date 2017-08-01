var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ApplyPoint = thinky.createModel("ApplyPoint", {
    	applyPointId : type.string(),
	eventId : type.string(),
	loginId : type.string(),
	applyName : type.string(),
	applyCompany : type.string(),
	applyEmail : type.string(),
	applyPhone : type.string(),
	applyTime : type.date(),
	stateTime : type.date(),
	applyState : type.number().integer(),
	refuseReason : type.string()    
});


exports.ApplyPointModel = ApplyPoint;

exports.addApplyPoint = function (req, res) {
    var newApplyPoint = new ApplyPoint(req.body);
    newApplyPoint.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateApplyPoint = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ApplyPoint.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteApplyPoint = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ApplyPoint.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getApplyPoint = function (req, res) {
    var id = req.params.id;
    ApplyPoint.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
