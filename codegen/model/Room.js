var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Room = thinky.createModel("Room", {
    	id : type.number().integer(),
	name : type.string(),
	description : type.string(),
	rawPrice : type.number().integer(),
	price : type.number(),
	notice : type.string(),
	hotelId : type.string(),
	img1 : type.string(),
	img2 : type.string(),
	img3 : type.string(),
	startDate : type.string(),
	endDate : type.string(),
	status : type.number().integer(),
	createDate : type.string(),
	updateDate : type.string(),
	roomNumber : type.number().integer(),
	stockNumber : type.number().integer(),
	sellStockNumber : type.number().integer(),
	sort : type.number().integer(),
	mealPrice : type.string(),
	mealType : type.number().integer(),
	type : type.string()    
});


exports.RoomModel = Room;

exports.addRoom = function (req, res) {
    var newRoom = new Room(req.body);
    newRoom.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateRoom = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Room.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteRoom = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Room.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getRoom = function (req, res) {
    var id = req.params.id;
    Room.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
