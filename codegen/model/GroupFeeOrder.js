var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var GroupFeeOrder = thinky.createModel("GroupFeeOrder", {
    	groupFeeOrderId : type.string(),
	eventGroupId : type.string(),
	groupMemberId : type.string(),
	payOrderId : type.string(),
	orderNumber : type.string(),
	buyNum : type.number().integer(),
	totalPrice : type.number().integer(),
	currencyName : type.string(),
	currencySign : type.string(),
	orderTime : type.date(),
	payTime : type.date(),
	payStatus : type.number().integer(),
	payWay : type.number().integer(),
	groupTime : type.date(),
	orderIp : type.string()    
});


exports.GroupFeeOrderModel = GroupFeeOrder;

exports.addGroupFeeOrder = function (req, res) {
    var newGroupFeeOrder = new GroupFeeOrder(req.body);
    newGroupFeeOrder.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateGroupFeeOrder = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    GroupFeeOrder.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteGroupFeeOrder = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    GroupFeeOrder.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getGroupFeeOrder = function (req, res) {
    var id = req.params.id;
    GroupFeeOrder.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
