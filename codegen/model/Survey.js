var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Survey = thinky.createModel("Survey", {
    	surveyId : type.string(),
	loginId : type.string(),
	eventId : type.string(),
	surveyTitle : type.string(),
	surveyContent : type.string(),
	surveyRemark : type.string(),
	surveyEndTime : type.date(),
	surveyEnding : type.string(),
	surveyCreteTime : type.date(),
	surveyStatus : type.number().integer(),
	surveyType : type.number().integer(),
	state : type.string()    
});


exports.SurveyModel = Survey;

exports.addSurvey = function (req, res) {
    var newSurvey = new Survey(req.body);
    newSurvey.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSurvey = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Survey.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSurvey = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Survey.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSurvey = function (req, res) {
    var id = req.params.id;
    Survey.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
