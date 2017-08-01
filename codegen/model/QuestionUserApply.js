var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var QuestionUserApply = thinky.createModel("QuestionUserApply", {
    	quApplyId : type.string(),
	questionId : type.string(),
	surveyId : type.string(),
	quApplyType : type.number().integer(),
	sortColumn : type.number().integer()    
});


exports.QuestionUserApplyModel = QuestionUserApply;

exports.addQuestionUserApply = function (req, res) {
    var newQuestionUserApply = new QuestionUserApply(req.body);
    newQuestionUserApply.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateQuestionUserApply = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    QuestionUserApply.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteQuestionUserApply = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    QuestionUserApply.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getQuestionUserApply = function (req, res) {
    var id = req.params.id;
    QuestionUserApply.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
