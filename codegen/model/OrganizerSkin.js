var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var OrganizerSkin = thinky.createModel("OrganizerSkin", {
    	organizerSkinId : type.string(),
	defaultSkinCode : type.number().integer(),
	organizerId : type.string(),
	skinType : type.number().integer(),
	defaultCss : type.number().integer(),
	bgPic : type.string(),
	bgColor : type.string(),
	titleBgPic : type.string(),
	titleBgColor : type.string(),
	titleTextColor : type.string(),
	contentBgColor : type.string(),
	borderCss : type.string(),
	mainTextCss : type.string(),
	secondTextCss : type.string(),
	linkCss : type.string(),
	locale : type.string()    
});


exports.OrganizerSkinModel = OrganizerSkin;

exports.addOrganizerSkin = function (req, res) {
    var newOrganizerSkin = new OrganizerSkin(req.body);
    newOrganizerSkin.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateOrganizerSkin = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    OrganizerSkin.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteOrganizerSkin = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    OrganizerSkin.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getOrganizerSkin = function (req, res) {
    var id = req.params.id;
    OrganizerSkin.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
