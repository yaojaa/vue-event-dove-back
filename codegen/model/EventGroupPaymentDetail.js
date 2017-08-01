var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroupPaymentDetail = thinky.createModel("EventGroupPaymentDetail", {
    	eventGroupPaymentDetailId : type.string(),
	eventGroupPaymentId : type.string(),
	unitType : type.string(),
	feeTypeName : type.string(),
	memberFee : type.number(),
	memberFeeDesc : type.string()    
});


exports.EventGroupPaymentDetailModel = EventGroupPaymentDetail;

exports.addEventGroupPaymentDetail = function (req, res) {
    var newEventGroupPaymentDetail = new EventGroupPaymentDetail(req.body);
    newEventGroupPaymentDetail.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroupPaymentDetail = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroupPaymentDetail.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroupPaymentDetail = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroupPaymentDetail.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroupPaymentDetail = function (req, res) {
    var id = req.params.id;
    EventGroupPaymentDetail.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
