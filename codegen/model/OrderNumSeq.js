var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var OrderNumSeq = thinky.createModel("OrderNumSeq", {
    	currentNum : type.number().integer(),
	createTimeStamp : type.date()    
});


exports.OrderNumSeqModel = OrderNumSeq;

exports.addOrderNumSeq = function (req, res) {
    var newOrderNumSeq = new OrderNumSeq(req.body);
    newOrderNumSeq.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateOrderNumSeq = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    OrderNumSeq.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteOrderNumSeq = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    OrderNumSeq.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getOrderNumSeq = function (req, res) {
    var id = req.params.id;
    OrderNumSeq.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
