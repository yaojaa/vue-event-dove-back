var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SurveySite = thinky.createModel("SurveySite", {
    	surveySiteId : type.string(),
	surveyId : type.string(),
	eventId : type.string(),
	moduleId : type.string(),
	surveySiteType : type.number().integer()    
});


exports.SurveySiteModel = SurveySite;

exports.addSurveySite = function (req, res) {
    var newSurveySite = new SurveySite(req.body);
    newSurveySite.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSurveySite = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SurveySite.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSurveySite = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SurveySite.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSurveySite = function (req, res) {
    var id = req.params.id;
    SurveySite.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
