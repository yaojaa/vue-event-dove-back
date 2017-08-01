var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var BadgePrintStyle = thinky.createModel("BadgePrintStyle", {
    	badgePrintStyleId : type.string(),
	eventId : type.string(),
	loginId : type.string(),
	title : type.string(),
	pageSize : type.string(),
	pageMargin : type.string(),
	badgeWidth : type.string(),
	badgeHeight : type.string(),
	badgePadding : type.string(),
	badgeStyle : type.string(),
	intervalWidth : type.string(),
	intervalHeight : type.string(),
	perPageRow : type.number().integer(),
	perPageColumn : type.number().integer(),
	webSiteStyle : type.string(),
	createTime : type.date(),
	status : type.number().integer()    
});


exports.BadgePrintStyleModel = BadgePrintStyle;

exports.addBadgePrintStyle = function (req, res) {
    var newBadgePrintStyle = new BadgePrintStyle(req.body);
    newBadgePrintStyle.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateBadgePrintStyle = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    BadgePrintStyle.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteBadgePrintStyle = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    BadgePrintStyle.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getBadgePrintStyle = function (req, res) {
    var id = req.params.id;
    BadgePrintStyle.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
