var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var CollectionDataLog = thinky.createModel("CollectionDataLog", {
    	dataLogId : type.string(),
	userProfileId : type.string(),
	loginId : type.string(),
	collectionDataId : type.string(),
	scanType : type.number().integer(),
	visitTime : type.date()    
});


exports.CollectionDataLogModel = CollectionDataLog;

exports.addCollectionDataLog = function (req, res) {
    var newCollectionDataLog = new CollectionDataLog(req.body);
    newCollectionDataLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateCollectionDataLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    CollectionDataLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteCollectionDataLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    CollectionDataLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getCollectionDataLog = function (req, res) {
    var id = req.params.id;
    CollectionDataLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
