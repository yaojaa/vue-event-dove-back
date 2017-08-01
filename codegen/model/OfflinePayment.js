var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var OfflinePayment = thinky.createModel("OfflinePayment", {
    	offlinePaymentId : type.string(),
	loginId : type.string(),
	bankName : type.string(),
	remittee : type.string(),
	account : type.string(),
	description : type.string(),
	fax : type.string(),
	faxRecipient : type.string(),
	swiftCode : type.string()    
});


exports.OfflinePaymentModel = OfflinePayment;

exports.addOfflinePayment = function (req, res) {
    var newOfflinePayment = new OfflinePayment(req.body);
    newOfflinePayment.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateOfflinePayment = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    OfflinePayment.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteOfflinePayment = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    OfflinePayment.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getOfflinePayment = function (req, res) {
    var id = req.params.id;
    OfflinePayment.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
