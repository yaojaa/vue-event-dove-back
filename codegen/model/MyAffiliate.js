var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var MyAffiliate = thinky.createModel("MyAffiliate", {
    	myAffiliateId : type.string(),
	eventId : type.string(),
	loginId : type.string(),
	affiliateId : type.string(),
	referralKey : type.string(),
	siteVisits : type.number().integer(),
	ticketSolds : type.number().integer(),
	salesIncome : type.number().integer(),
	sharedFee : type.number(),
	accessTime : type.date(),
	createTime : type.date()    
});


exports.MyAffiliateModel = MyAffiliate;

exports.addMyAffiliate = function (req, res) {
    var newMyAffiliate = new MyAffiliate(req.body);
    newMyAffiliate.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateMyAffiliate = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    MyAffiliate.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteMyAffiliate = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    MyAffiliate.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getMyAffiliate = function (req, res) {
    var id = req.params.id;
    MyAffiliate.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
