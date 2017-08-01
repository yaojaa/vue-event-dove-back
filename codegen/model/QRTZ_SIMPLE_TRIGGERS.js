var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var QRTZ_SIMPLE_TRIGGERS = thinky.createModel("QRTZ_SIMPLE_TRIGGERS", {
    	TRIGGER_NAME : type.string(),
	TRIGGER_GROUP : type.string(),
	REPEAT_COUNT : type.number().integer(),
	REPEAT_INTERVAL : type.number().integer(),
	TIMES_TRIGGERED : type.number().integer()    
});


exports.QRTZ_SIMPLE_TRIGGERSModel = QRTZ_SIMPLE_TRIGGERS;

exports.addQRTZ_SIMPLE_TRIGGERS = function (req, res) {
    var newQRTZ_SIMPLE_TRIGGERS = new QRTZ_SIMPLE_TRIGGERS(req.body);
    newQRTZ_SIMPLE_TRIGGERS.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateQRTZ_SIMPLE_TRIGGERS = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    QRTZ_SIMPLE_TRIGGERS.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteQRTZ_SIMPLE_TRIGGERS = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    QRTZ_SIMPLE_TRIGGERS.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getQRTZ_SIMPLE_TRIGGERS = function (req, res) {
    var id = req.params.id;
    QRTZ_SIMPLE_TRIGGERS.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
