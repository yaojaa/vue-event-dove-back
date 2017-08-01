var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var PointFunction = thinky.createModel("PointFunction", {
    	pointFunctionId : type.string(),
	collectionPointId : type.string(),
	collectionFunctionId : type.string(),
	dataWrapperId : type.string()    
});


exports.PointFunctionModel = PointFunction;

exports.addPointFunction = function (req, res) {
    var newPointFunction = new PointFunction(req.body);
    newPointFunction.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updatePointFunction = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    PointFunction.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deletePointFunction = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    PointFunction.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getPointFunction = function (req, res) {
    var id = req.params.id;
    PointFunction.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
