var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SceneLottery = thinky.createModel("SceneLottery", {
    	sceneLotteryId : type.string(),
	sceneId : type.string(),
	lotteryId : type.string(),
	timeState : type.number().integer(),
	startTime : type.date(),
	endTime : type.date()    
});


exports.SceneLotteryModel = SceneLottery;

exports.addSceneLottery = function (req, res) {
    var newSceneLottery = new SceneLottery(req.body);
    newSceneLottery.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSceneLottery = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SceneLottery.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSceneLottery = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SceneLottery.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSceneLottery = function (req, res) {
    var id = req.params.id;
    SceneLottery.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
