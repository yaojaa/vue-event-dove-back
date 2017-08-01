var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var MarketingEmailTarget = thinky.createModel("MarketingEmailTarget", {
    	targetId : type.string(),
	name : type.string(),
	sqlStr : type.string(),
	timeColumnName : type.string(),
	createTime : type.date()    
});


exports.MarketingEmailTargetModel = MarketingEmailTarget;

exports.addMarketingEmailTarget = function (req, res) {
    var newMarketingEmailTarget = new MarketingEmailTarget(req.body);
    newMarketingEmailTarget.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateMarketingEmailTarget = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    MarketingEmailTarget.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteMarketingEmailTarget = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    MarketingEmailTarget.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getMarketingEmailTarget = function (req, res) {
    var id = req.params.id;
    MarketingEmailTarget.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
