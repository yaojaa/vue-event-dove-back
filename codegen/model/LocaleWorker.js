var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var LocaleWorker = thinky.createModel("LocaleWorker", {
    	localeWorkerId : type.string(),
	eventId : type.string(),
	localeWorkerDuty : type.string(),
	localeWorkerName : type.string(),
	localeWorkerEmail : type.string(),
	localeWorkerPhone : type.string(),
	state : type.string()    
});


exports.LocaleWorkerModel = LocaleWorker;

exports.addLocaleWorker = function (req, res) {
    var newLocaleWorker = new LocaleWorker(req.body);
    newLocaleWorker.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateLocaleWorker = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    LocaleWorker.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteLocaleWorker = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    LocaleWorker.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getLocaleWorker = function (req, res) {
    var id = req.params.id;
    LocaleWorker.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
