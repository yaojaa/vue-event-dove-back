var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var News = thinky.createModel("News", {
    	newsId : type.string(),
	createLoginId : type.string(),
	newsClassifyId : type.string(),
	newsTypeId : type.string(),
	resourceLink : type.string(),
	newsTitle : type.string(),
	newsTag : type.string(),
	newsContent : type.string(),
	createUserName : type.string(),
	createTimestamp : type.date(),
	modifyTimestamp : type.date(),
	viewCount : type.string(),
	intoTop : type.string(),
	state : type.string(),
	sort : type.number().integer(),
	locale : type.string()    
});


exports.NewsModel = News;

exports.addNews = function (req, res) {
    var newNews = new News(req.body);
    newNews.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateNews = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    News.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteNews = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    News.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getNews = function (req, res) {
    var id = req.params.id;
    News.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
