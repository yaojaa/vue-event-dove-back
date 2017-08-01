var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EdWinners = thinky.createModel("EdWinners", {
    	edWinnerId : type.string(),
	lotteryId : type.string(),
	loginId : type.string(),
	edPrizeId : type.string(),
	winnnerTime : type.date()    
});


exports.EdWinnersModel = EdWinners;

exports.addEdWinners = function (req, res) {
    var newEdWinners = new EdWinners(req.body);
    newEdWinners.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEdWinners = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EdWinners.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEdWinners = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EdWinners.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEdWinners = function (req, res) {
    var id = req.params.id;
    EdWinners.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
