var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var QRTZ_TRIGGERS = thinky.createModel("QRTZ_TRIGGERS", {
    	TRIGGER_NAME : type.string(),
	TRIGGER_GROUP : type.string(),
	JOB_NAME : type.string(),
	JOB_GROUP : type.string(),
	IS_VOLATILE : type.string(),
	DESCRIPTION : type.string(),
	NEXT_FIRE_TIME : type.number().integer(),
	PREV_FIRE_TIME : type.number().integer(),
	PRIORITY : type.number().integer(),
	TRIGGER_STATE : type.string(),
	TRIGGER_TYPE : type.string(),
	START_TIME : type.number().integer(),
	END_TIME : type.number().integer(),
	CALENDAR_NAME : type.string(),
	MISFIRE_INSTR : type.number().integer(),
	JOB_DATA : type.string()    
});


exports.QRTZ_TRIGGERSModel = QRTZ_TRIGGERS;

exports.addQRTZ_TRIGGERS = function (req, res) {
    var newQRTZ_TRIGGERS = new QRTZ_TRIGGERS(req.body);
    newQRTZ_TRIGGERS.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateQRTZ_TRIGGERS = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    QRTZ_TRIGGERS.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteQRTZ_TRIGGERS = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    QRTZ_TRIGGERS.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getQRTZ_TRIGGERS = function (req, res) {
    var id = req.params.id;
    QRTZ_TRIGGERS.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
