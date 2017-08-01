var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var QRTZ_JOB_DETAILS = thinky.createModel("QRTZ_JOB_DETAILS", {
    	JOB_NAME : type.string(),
	JOB_GROUP : type.string(),
	DESCRIPTION : type.string(),
	JOB_CLASS_NAME : type.string(),
	IS_DURABLE : type.string(),
	IS_VOLATILE : type.string(),
	IS_STATEFUL : type.string(),
	REQUESTS_RECOVERY : type.string(),
	JOB_DATA : type.string()    
});


exports.QRTZ_JOB_DETAILSModel = QRTZ_JOB_DETAILS;

exports.addQRTZ_JOB_DETAILS = function (req, res) {
    var newQRTZ_JOB_DETAILS = new QRTZ_JOB_DETAILS(req.body);
    newQRTZ_JOB_DETAILS.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateQRTZ_JOB_DETAILS = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    QRTZ_JOB_DETAILS.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteQRTZ_JOB_DETAILS = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    QRTZ_JOB_DETAILS.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getQRTZ_JOB_DETAILS = function (req, res) {
    var id = req.params.id;
    QRTZ_JOB_DETAILS.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
