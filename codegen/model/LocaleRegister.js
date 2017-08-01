var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var LocaleRegister = thinky.createModel("LocaleRegister", {
    	localeRegisterId : type.string(),
	eventId : type.string(),
	userName : type.string(),
	jobTitle : type.string(),
	companyOrorganization : type.string(),
	department : type.string(),
	post : type.string(),
	address : type.string(),
	zipCode : type.string(),
	workPhone : type.string(),
	fax : type.string(),
	unitedCode : type.string(),
	otherPhone : type.string(),
	companyOther : type.string(),
	cellPhone : type.string(),
	bp : type.string(),
	website : type.string(),
	emailAddress : type.string(),
	profileData : type.string(),
	state : type.string()    
});


exports.LocaleRegisterModel = LocaleRegister;

exports.addLocaleRegister = function (req, res) {
    var newLocaleRegister = new LocaleRegister(req.body);
    newLocaleRegister.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateLocaleRegister = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    LocaleRegister.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteLocaleRegister = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    LocaleRegister.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getLocaleRegister = function (req, res) {
    var id = req.params.id;
    LocaleRegister.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
