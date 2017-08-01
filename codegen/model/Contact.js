var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Contact = thinky.createModel("Contact", {
    	contactId : type.string(),
	ownerId : type.string(),
	nickName : type.string(),
	pdataUserName : type.string(),
	pdataUserNamePinyin : type.string(),
	pdataUserPhone : type.string(),
	pdataUserMail : type.string(),
	pdataUserTitle : type.string(),
	idcard : type.string(),
	avatar : type.string(),
	wechat : type.string(),
	facebook : type.string(),
	twitter : type.string(),
	linkedin : type.string(),
	qq : type.string(),
	weibo : type.string(),
	bio : type.string(),
	pdataUserCompany : type.string(),
	profileData : type.string(),
	contactType : type.number().integer(),
	tag : type.string(),
	state : type.string()    
});


exports.ContactModel = Contact;

exports.addContact = function (req, res) {
    var newContact = new Contact(req.body);
    newContact.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateContact = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Contact.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteContact = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Contact.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getContact = function (req, res) {
    var id = req.params.id;
    Contact.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
