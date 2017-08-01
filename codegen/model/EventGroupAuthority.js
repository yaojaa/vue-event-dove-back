var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroupAuthority = thinky.createModel("EventGroupAuthority", {
    	eventGroupAuthorityId : type.string(),
	authorityCode : type.string(),
	authorityContent : type.string(),
	roleType : type.number().integer(),
	defaultValue : type.number().integer()    
});


exports.EventGroupAuthorityModel = EventGroupAuthority;

exports.addEventGroupAuthority = function (req, res) {
    var newEventGroupAuthority = new EventGroupAuthority(req.body);
    newEventGroupAuthority.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroupAuthority = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroupAuthority.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroupAuthority = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroupAuthority.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroupAuthority = function (req, res) {
    var id = req.params.id;
    EventGroupAuthority.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
