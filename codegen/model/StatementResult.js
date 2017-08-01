var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var StatementResult = thinky.createModel("StatementResult", {
    	statementResultId : type.string(),
	statementId : type.string(),
	payAccount : type.string(),
	eventFee : type.number(),
	eventIncome : type.number().integer(),
	promotionFee : type.number(),
	eventdoveIncome : type.number().integer(),
	paymentStatus : type.number().integer(),
	paymentTime : type.date(),
	createTime : type.date()    
});


exports.StatementResultModel = StatementResult;

exports.addStatementResult = function (req, res) {
    var newStatementResult = new StatementResult(req.body);
    newStatementResult.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateStatementResult = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    StatementResult.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteStatementResult = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    StatementResult.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getStatementResult = function (req, res) {
    var id = req.params.id;
    StatementResult.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
