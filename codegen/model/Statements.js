var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Statements = thinky.createModel("Statements", {
    	statementId : type.string(),
	eventId : type.string(),
	totalIncome : type.number().integer(),
	onlinePay : type.number().integer(),
	offlinePay : type.number().integer(),
	totalFee : type.number(),
	onlineFee : type.number(),
	offlineFee : type.number(),
	priceSign : type.string(),
	priceUnit : type.string(),
	totalQuantity : type.number().integer(),
	onlineQuantity : type.number().integer(),
	offlineQuantity : type.number().integer(),
	createTime : type.date(),
	remark : type.string(),
	settlementStatus : type.number().integer()    
});


exports.StatementsModel = Statements;

exports.addStatements = function (req, res) {
    var newStatements = new Statements(req.body);
    newStatements.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateStatements = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Statements.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteStatements = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Statements.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getStatements = function (req, res) {
    var id = req.params.id;
    Statements.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
