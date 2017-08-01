var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Question = thinky.createModel("Question", {
    	questionId : type.string(),
	eventId : type.string(),
	selectFieldId : type.string(),
	loginId : type.string(),
	questionTitle : type.string(),
	createTime : type.date(),
	source : type.number().integer(),
	questionStrObj : type.string(),
	state : type.string()    
});


exports.QuestionModel = Question;

exports.addQuestion = function (req, res) {
    var newQuestion = new Question(req.body);
    newQuestion.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateQuestion = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Question.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteQuestion = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Question.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getQuestion = function (req, res) {
    var id = req.params.id;
    Question.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
