var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var QuestionAnswer = thinky.createModel("QuestionAnswer", {
    	answerId : type.string(),
	loginId : type.string(),
	surveyId : type.string(),
	answerStrObj : type.string(),
	ipAddress : type.string(),
	createTime : type.date()    
});


exports.QuestionAnswerModel = QuestionAnswer;

exports.addQuestionAnswer = function (req, res) {
    var newQuestionAnswer = new QuestionAnswer(req.body);
    newQuestionAnswer.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateQuestionAnswer = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    QuestionAnswer.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteQuestionAnswer = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    QuestionAnswer.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getQuestionAnswer = function (req, res) {
    var id = req.params.id;
    QuestionAnswer.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
