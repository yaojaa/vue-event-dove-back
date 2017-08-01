var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventOrderInvoice = thinky.createModel("EventOrderInvoice", {
    	orderInvoiceId : type.string(),
	orderId : type.string(),
	eventId : type.string(),
	priceUnit : type.string(),
	orderPrice : type.number().integer(),
	fapiaoType : type.number().integer(),
	fapiaoSend : type.number().integer(),
	head : type.string(),
	taxNumber : type.string(),
	services : type.string(),
	recipientName : type.string(),
	recipientAddress : type.string(),
	phone : type.string(),
	companyAddress : type.string(),
	companyPhone : type.string(),
	companyBank : type.string(),
	remark : type.string(),
	bankAccount : type.string(),
	createTime : type.date(),
	profileData : type.string(),
	modifyTime : type.date(),
	expressStatus : type.number().integer(),
	addressee : type.string(),
	contactPhone : type.string(),
	receiveAddress : type.string()    
});


exports.EventOrderInvoiceModel = EventOrderInvoice;

exports.addEventOrderInvoice = function (req, res) {
    var newEventOrderInvoice = new EventOrderInvoice(req.body);
    newEventOrderInvoice.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventOrderInvoice = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventOrderInvoice.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventOrderInvoice = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventOrderInvoice.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventOrderInvoice = function (req, res) {
    var id = req.params.id;
    EventOrderInvoice.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
