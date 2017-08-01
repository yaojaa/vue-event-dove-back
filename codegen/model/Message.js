var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Message = thinky.createModel("Message", {
    	messageId : type.string(),
	messageSourceId : type.string(),
	messageSourceName : type.string(),
	loginId : type.string(),
	messageTitle : type.string(),
	messageContent : type.string(),
	messageCategory : type.number().integer(),
	subCategory : type.number().integer(),
	createTime : type.date(),
	readStatus : type.number().integer()    
});


exports.MessageModel = Message;

exports.addMessage = function (req, res) {
    var newMessage = new Message(req.body);
    newMessage.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateMessage = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Message.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteMessage = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Message.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getMessage = function (req, res) {
    var id = req.params.id;
    Message.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
