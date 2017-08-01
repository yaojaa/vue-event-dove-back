var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var AdvanceCourse = thinky.createModel("AdvanceCourse", {
    	advanceCourseId : type.string(),
	eventTime : type.date(),
	eventFunction : type.string(),
	eventContent : type.string(),
	viewName : type.string(),
	advanceCourseTime : type.date(),
	acStatus : type.number().integer(),
	state : type.string(),
	locale : type.string()    
});


exports.AdvanceCourseModel = AdvanceCourse;

exports.addAdvanceCourse = function (req, res) {
    var newAdvanceCourse = new AdvanceCourse(req.body);
    newAdvanceCourse.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateAdvanceCourse = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    AdvanceCourse.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteAdvanceCourse = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    AdvanceCourse.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getAdvanceCourse = function (req, res) {
    var id = req.params.id;
    AdvanceCourse.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
