var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var MarketingEmailMatchTarget = thinky.createModel("MarketingEmailMatchTarget", {
    	emailMatchTargetId : type.string(),
	targetId : type.string(),
	marketingEmailId : type.string()    
});


exports.MarketingEmailMatchTargetModel = MarketingEmailMatchTarget;

exports.addMarketingEmailMatchTarget = function (req, res) {
    var newMarketingEmailMatchTarget = new MarketingEmailMatchTarget(req.body);
    newMarketingEmailMatchTarget.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateMarketingEmailMatchTarget = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    MarketingEmailMatchTarget.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteMarketingEmailMatchTarget = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    MarketingEmailMatchTarget.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getMarketingEmailMatchTarget = function (req, res) {
    var id = req.params.id;
    MarketingEmailMatchTarget.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
