var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var MyAffiliateUsedLog = thinky.createModel("MyAffiliateUsedLog", {
    	myAffiliateUsedId : type.string(),
	myAffliateId : type.string(),
	orderId : type.string(),
	income : type.number().integer(),
	sharedFee : type.number(),
	orderTime : type.date()    
});


exports.MyAffiliateUsedLogModel = MyAffiliateUsedLog;

exports.addMyAffiliateUsedLog = function (req, res) {
    var newMyAffiliateUsedLog = new MyAffiliateUsedLog(req.body);
    newMyAffiliateUsedLog.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateMyAffiliateUsedLog = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    MyAffiliateUsedLog.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteMyAffiliateUsedLog = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    MyAffiliateUsedLog.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getMyAffiliateUsedLog = function (req, res) {
    var id = req.params.id;
    MyAffiliateUsedLog.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
