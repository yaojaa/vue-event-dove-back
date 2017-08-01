var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ContactUs = thinky.createModel("ContactUs", {
    	contactUsId : type.string(),
	category : type.string(),
	qesTitle : type.string(),
	contactEmail : type.string(),
	qesContent : type.string(),
	replyContent : type.string(),
	contactUsRep : type.number().integer(),
	createTime : type.date(),
	state : type.string()    
});


exports.ContactUsModel = ContactUs;

exports.addContactUs = function (req, res) {
    var newContactUs = new ContactUs(req.body);
    newContactUs.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateContactUs = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ContactUs.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteContactUs = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ContactUs.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getContactUs = function (req, res) {
    var id = req.params.id;
    ContactUs.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
