var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var InvoiceNote = thinky.createModel("InvoiceNote", {
    	noteId : type.string(),
	profileData : type.string(),
	userProfileId : type.string(),
	createTime : type.date(),
	updateTime : type.date()    
});


exports.InvoiceNoteModel = InvoiceNote;

exports.addInvoiceNote = function (req, res) {
    var newInvoiceNote = new InvoiceNote(req.body);
    newInvoiceNote.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateInvoiceNote = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    InvoiceNote.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteInvoiceNote = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    InvoiceNote.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getInvoiceNote = function (req, res) {
    var id = req.params.id;
    InvoiceNote.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
