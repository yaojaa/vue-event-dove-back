var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var LotteryUser = thinky.createModel("LotteryUser", {
    	lotteryUserId : type.string(),
	lotteryId : type.string(),
	userId : type.string(),
	joinTime : type.date()    
});


exports.LotteryUserModel = LotteryUser;

exports.addLotteryUser = function (req, res) {
    var newLotteryUser = new LotteryUser(req.body);
    newLotteryUser.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateLotteryUser = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    LotteryUser.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteLotteryUser = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    LotteryUser.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getLotteryUser = function (req, res) {
    var id = req.params.id;
    LotteryUser.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
