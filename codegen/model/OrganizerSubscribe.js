var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var OrganizerSubscribe = thinky.createModel("OrganizerSubscribe", {
    	orgSubId : type.string(),
	loginId : type.string(),
	organizerId : type.string(),
	state : type.string(),
	modifyTime : type.date()    
});


exports.OrganizerSubscribeModel = OrganizerSubscribe;

exports.addOrganizerSubscribe = function (req, res) {
    var newOrganizerSubscribe = new OrganizerSubscribe(req.body);
    newOrganizerSubscribe.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateOrganizerSubscribe = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    OrganizerSubscribe.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteOrganizerSubscribe = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    OrganizerSubscribe.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getOrganizerSubscribe = function (req, res) {
    var id = req.params.id;
    OrganizerSubscribe.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
