var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var ContactGroupList = thinky.createModel("ContactGroupList", {
    	groupContactIds : type.string(),
	contactId : type.string(),
	contactGroupId : type.string()    
});


exports.ContactGroupListModel = ContactGroupList;

exports.addContactGroupList = function (req, res) {
    var newContactGroupList = new ContactGroupList(req.body);
    newContactGroupList.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateContactGroupList = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    ContactGroupList.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteContactGroupList = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    ContactGroupList.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getContactGroupList = function (req, res) {
    var id = req.params.id;
    ContactGroupList.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
