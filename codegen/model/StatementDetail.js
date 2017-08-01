var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var StatementDetail = thinky.createModel("StatementDetail", {
    	statementDetailId : type.string(),
	statementId : type.string(),
	ticketId : type.string(),
	ticketIncome : type.number().integer(),
	totalQuantity : type.number().integer(),
	onlinePay : type.number().integer(),
	offlinePay : type.number().integer(),
	offlineFee : type.number(),
	priceSign : type.string(),
	priceUnit : type.string(),
	ticketFee : type.number(),
	onlineFee : type.number(),
	onlineQuantity : type.number().integer(),
	offlineQuantity : type.number().integer()    
});


exports.StatementDetailModel = StatementDetail;

exports.addStatementDetail = function (req, res) {
    var newStatementDetail = new StatementDetail(req.body);
    newStatementDetail.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateStatementDetail = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    StatementDetail.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteStatementDetail = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    StatementDetail.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getStatementDetail = function (req, res) {
    var id = req.params.id;
    StatementDetail.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
