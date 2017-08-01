var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var State = thinky.createModel("State", {
    	stateId : type.string(),
	countryRegionId : type.string(),
	name : type.string(),
	enName : type.string(),
	countryRegionName : type.string(),
	countryRegionEnName : type.string()    
});


exports.StateModel = State;

exports.addState = function (req, res) {
    var newState = new State(req.body);
    newState.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateState = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    State.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteState = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    State.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getState = function (req, res) {
    var id = req.params.id;
    State.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
