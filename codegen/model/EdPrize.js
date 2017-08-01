var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EdPrize = thinky.createModel("EdPrize", {
    	edPrizeId : type.string(),
	lotteryId : type.string(),
	edPrizeName : type.string(),
	edPrizeContent : type.string(),
	funStatus : type.number().integer(),
	lotteryNum : type.number().integer()    
});


exports.EdPrizeModel = EdPrize;

exports.addEdPrize = function (req, res) {
    var newEdPrize = new EdPrize(req.body);
    newEdPrize.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEdPrize = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EdPrize.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEdPrize = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EdPrize.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEdPrize = function (req, res) {
    var id = req.params.id;
    EdPrize.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
