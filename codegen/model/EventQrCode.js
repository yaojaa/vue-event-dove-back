var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventQrCode = thinky.createModel("EventQrCode", {
    	eventQrCodeId : type.string(),
	eventId : type.string(),
	matchInfo : type.string()    
});


exports.EventQrCodeModel = EventQrCode;

exports.addEventQrCode = function (req, res) {
    var newEventQrCode = new EventQrCode(req.body);
    newEventQrCode.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventQrCode = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventQrCode.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventQrCode = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventQrCode.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventQrCode = function (req, res) {
    var id = req.params.id;
    EventQrCode.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
