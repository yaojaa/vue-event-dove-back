var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var RoomCalendar = thinky.createModel("RoomCalendar", {
    	id : type.number().integer(),
	roomId : type.string(),
	soldNumber : type.number().integer(),
	roomNumber : type.number().integer(),
	rawPrice : type.number().integer(),
	price : type.number(),
	breakfastPrice : type.number().integer(),
	date : type.string()    
});


exports.RoomCalendarModel = RoomCalendar;

exports.addRoomCalendar = function (req, res) {
    var newRoomCalendar = new RoomCalendar(req.body);
    newRoomCalendar.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateRoomCalendar = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    RoomCalendar.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteRoomCalendar = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    RoomCalendar.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getRoomCalendar = function (req, res) {
    var id = req.params.id;
    RoomCalendar.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
