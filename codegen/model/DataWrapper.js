var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var DataWrapper = thinky.createModel("DataWrapper", {
    	dataWrapperId : type.string(),
	eventId : type.string(),
	dataName : type.string(),
	dataContent : type.string(),
	attachment : type.string(),
	createTime : type.date(),
	state : type.string()    
});


exports.DataWrapperModel = DataWrapper;

exports.addDataWrapper = function (req, res) {
    var newDataWrapper = new DataWrapper(req.body);
    newDataWrapper.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateDataWrapper = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    DataWrapper.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteDataWrapper = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    DataWrapper.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getDataWrapper = function (req, res) {
    var id = req.params.id;
    DataWrapper.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
