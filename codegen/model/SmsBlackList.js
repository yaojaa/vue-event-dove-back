var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SmsBlackList = thinky.createModel("SmsBlackList", {
    	blId : type.string(),
	blName : type.string()    
});


exports.SmsBlackListModel = SmsBlackList;

exports.addSmsBlackList = function (req, res) {
    var newSmsBlackList = new SmsBlackList(req.body);
    newSmsBlackList.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSmsBlackList = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SmsBlackList.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSmsBlackList = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SmsBlackList.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSmsBlackList = function (req, res) {
    var id = req.params.id;
    SmsBlackList.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
