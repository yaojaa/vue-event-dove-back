var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Hotel = thinky.createModel("Hotel", {
    	id : type.number().integer(),
	name : type.string(),
	description : type.string(),
	loginId : type.string(),
	eventId : type.string(),
	address : type.string(),
	notice : type.string(),
	distance : type.string(),
	img1 : type.string(),
	img2 : type.string(),
	img3 : type.string(),
	status : type.number().integer(),
	createDate : type.string(),
	updateDate : type.string(),
	contMobile : type.string(),
	airport : type.string(),
	LEVEL : type.string(),
	openData : type.string(),
	img4 : type.string(),
	sort : type.number().integer()    
});


exports.HotelModel = Hotel;

exports.addHotel = function (req, res) {
    var newHotel = new Hotel(req.body);
    newHotel.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateHotel = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Hotel.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteHotel = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Hotel.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getHotel = function (req, res) {
    var id = req.params.id;
    Hotel.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
