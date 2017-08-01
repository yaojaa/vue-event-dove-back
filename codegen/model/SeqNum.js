var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SeqNum = thinky.createModel("SeqNum", {
    	seqNumId : type.string(),
	maxNum : type.number().integer(),
	type : type.number().integer()    
});


exports.SeqNumModel = SeqNum;

exports.addSeqNum = function (req, res) {
    var newSeqNum = new SeqNum(req.body);
    newSeqNum.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSeqNum = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SeqNum.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSeqNum = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SeqNum.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSeqNum = function (req, res) {
    var id = req.params.id;
    SeqNum.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
