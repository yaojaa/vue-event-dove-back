var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Banner = thinky.createModel("Banner", {
    	bannerId : type.string(),
	bannerUrl : type.string(),
	bannerType : type.string()    
});


exports.BannerModel = Banner;

exports.addBanner = function (req, res) {
    var newBanner = new Banner(req.body);
    newBanner.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateBanner = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Banner.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteBanner = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Banner.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getBanner = function (req, res) {
    var id = req.params.id;
    Banner.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
