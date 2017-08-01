var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Partner = thinky.createModel("Partner", {
    	partnerId : type.string(),
	partnerName : type.string(),
	website : type.string(),
	loginId : type.string(),
	createTime : type.date(),
	state : type.number().integer()    
});


exports.PartnerModel = Partner;

exports.addPartner = function (req, res) {
    var newPartner = new Partner(req.body);
    newPartner.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updatePartner = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Partner.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deletePartner = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Partner.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getPartner = function (req, res) {
    var id = req.params.id;
    Partner.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
