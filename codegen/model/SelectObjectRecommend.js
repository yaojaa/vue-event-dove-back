var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SelectObjectRecommend = thinky.createModel("SelectObjectRecommend", {
    	eventId : type.string(),
	selectObjectRecommendId : type.string(),
	banner : type.string(),
	selectType : type.number().integer(),
	selectTypeName : type.string(),
	sort : type.number().integer()    
});


exports.SelectObjectRecommendModel = SelectObjectRecommend;

exports.addSelectObjectRecommend = function (req, res) {
    var newSelectObjectRecommend = new SelectObjectRecommend(req.body);
    newSelectObjectRecommend.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSelectObjectRecommend = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SelectObjectRecommend.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSelectObjectRecommend = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SelectObjectRecommend.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSelectObjectRecommend = function (req, res) {
    var id = req.params.id;
    SelectObjectRecommend.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
