var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var RaffleIitem = thinky.createModel("RaffleIitem", {
    	raffleItemId : type.string(),
	lotteryId : type.string(),
	raffleTitle : type.string(),
	raffleNum : type.number().integer(),
	hasNum : type.number().integer(),
	winningReminder : type.string(),
	raffleRemark : type.string(),
	rlType : type.number().integer()    
});


exports.RaffleIitemModel = RaffleIitem;

exports.addRaffleIitem = function (req, res) {
    var newRaffleIitem = new RaffleIitem(req.body);
    newRaffleIitem.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateRaffleIitem = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    RaffleIitem.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteRaffleIitem = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    RaffleIitem.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getRaffleIitem = function (req, res) {
    var id = req.params.id;
    RaffleIitem.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
