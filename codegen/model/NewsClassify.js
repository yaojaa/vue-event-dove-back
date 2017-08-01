var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var NewsClassify = thinky.createModel("NewsClassify", {
    	newsClassifyId : type.string(),
	newsTypeId : type.string(),
	parentNewsClassifyId : type.string(),
	viewLevel : type.string(),
	classifyName : type.string(),
	classifyResourceClass : type.string(),
	state : type.string(),
	locale : type.string()    
});


exports.NewsClassifyModel = NewsClassify;

exports.addNewsClassify = function (req, res) {
    var newNewsClassify = new NewsClassify(req.body);
    newNewsClassify.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateNewsClassify = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    NewsClassify.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteNewsClassify = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    NewsClassify.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getNewsClassify = function (req, res) {
    var id = req.params.id;
    NewsClassify.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
