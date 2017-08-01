var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var AttendCustomExport = thinky.createModel("AttendCustomExport", {
    	customExportId : type.string(),
	eventId : type.string(),
	attendStr : type.string(),
	customStr : type.string(),
	ticketStr : type.string(),
	ticketOrderStr : type.string(),
	allCheckbox : type.number().integer()    
});


exports.AttendCustomExportModel = AttendCustomExport;

exports.addAttendCustomExport = function (req, res) {
    var newAttendCustomExport = new AttendCustomExport(req.body);
    newAttendCustomExport.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateAttendCustomExport = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    AttendCustomExport.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteAttendCustomExport = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    AttendCustomExport.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getAttendCustomExport = function (req, res) {
    var id = req.params.id;
    AttendCustomExport.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
