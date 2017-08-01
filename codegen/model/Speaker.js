var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Speaker = thinky.createModel("Speaker", {
    	speakerId : type.string(),
	loginId : type.string(),
	ownerId : type.string(),
	contactId : type.string(),
	createTime : type.date(),
	updateTime : type.date(),
	remark : type.string(),
	moduleDataId : type.string()    
});


exports.SpeakerModel = Speaker;

exports.addSpeaker = function (req, res) {
    var newSpeaker = new Speaker(req.body);
    newSpeaker.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSpeaker = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Speaker.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSpeaker = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Speaker.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSpeaker = function (req, res) {
    var id = req.params.id;
    Speaker.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
