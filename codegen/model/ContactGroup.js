var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ContactGroup = thinky.createModel("ContactGroup", {
    	contactGroupId : type.string(),
	loginId : type.string(),
	groupName : type.string(),
	fmtGroupName : type.string(),
	groupDesc : type.string(),
	count : type.number().integer(),
	createTime : type.date(),
	state : type.string(),
	status : type.number().integer()    
});


exports.ContactGroupModel = ContactGroup;

exports.addContactGroup = function (req, res) {
    var newContactGroup = new ContactGroup(req.body);
    newContactGroup.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateContactGroup = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ContactGroup.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteContactGroup = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ContactGroup.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getContactGroup = function (req, res) {
    var id = req.params.id;
    ContactGroup.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
