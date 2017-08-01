var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Affiliate = thinky.createModel("Affiliate", {
    	affiliateId : type.string(),
	eventId : type.string(),
	affiliateName : type.string(),
	referType : type.string(),
	referFee : type.number(),
	referFeePercent : type.string(),
	totalSharedFee : type.number(),
	totalIncome : type.number().integer(),
	publicAffliate : type.number().integer(),
	remark : type.string(),
	createTime : type.date(),
	referCount : type.number().integer(),
	startTime : type.date(),
	endTime : type.date(),
	timeLimitType : type.string()    
});


exports.AffiliateModel = Affiliate;

exports.addAffiliate = function (req, res) {
    var newAffiliate = new Affiliate(req.body);
    newAffiliate.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateAffiliate = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Affiliate.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteAffiliate = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Affiliate.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getAffiliate = function (req, res) {
    var id = req.params.id;
    Affiliate.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
