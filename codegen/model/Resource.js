var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Resource = thinky.createModel("Resource", {
    	resourceId : type.string(),
	loginId : type.string(),
	resourceName : type.string(),
	accessUri : type.string(),
	resourceContextPath : type.string(),
	createTime : type.date(),
	lastAccessTime : type.date(),
	accessCount : type.number().integer(),
	state : type.string(),
	fileSize : type.number().integer(),
	fileType : type.string()    
});


exports.ResourceModel = Resource;

exports.addResource = function (req, res) {
    var newResource = new Resource(req.body);
    newResource.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateResource = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Resource.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteResource = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Resource.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getResource = function (req, res) {
    var id = req.params.id;
    Resource.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
