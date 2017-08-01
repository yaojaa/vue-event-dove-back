var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var HotelOrder = thinky.createModel("HotelOrder", {
    	id : type.number().integer(),
	roomId : type.string(),
	checkInDate : type.string(),
	checkOutDate : type.string(),
	mobile : type.string(),
	number : type.number().integer(),
	contact : type.string(),
	guests : type.string(),
	price : type.number(),
	totalPrice : type.number(),
	hotelId : type.string(),
	payOrderId : type.string(),
	orderNumber : type.string(),
	loginId : type.string(),
	status : type.number().integer(),
	createDate : type.string(),
	updateDate : type.string(),
	userMail : type.string(),
	lastName : type.string(),
	firstName : type.string(),
	mealNum : type.number().integer(),
	mealPrice : type.string(),
	remarks : type.string()    
});


exports.HotelOrderModel = HotelOrder;

exports.addHotelOrder = function (req, res) {
    var newHotelOrder = new HotelOrder(req.body);
    newHotelOrder.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateHotelOrder = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    HotelOrder.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteHotelOrder = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    HotelOrder.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getHotelOrder = function (req, res) {
    var id = req.params.id;
    HotelOrder.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
