var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var PointDataResource = thinky.createModel("PointDataResource", {
    	dataResourceId : type.string(),
	pointFunctionId : type.string(),
	resourceId : type.string()    
});


exports.PointDataResourceModel = PointDataResource;

exports.addPointDataResource = function (req, res) {
    var newPointDataResource = new PointDataResource(req.body);
    newPointDataResource.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updatePointDataResource = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    PointDataResource.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deletePointDataResource = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    PointDataResource.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getPointDataResource = function (req, res) {
    var id = req.params.id;
    PointDataResource.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
