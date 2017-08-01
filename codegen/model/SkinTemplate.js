var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var SkinTemplate = thinky.createModel("SkinTemplate", {
    	skinTemplateId : type.string(),
	skinTemplateCode : type.string(),
	skinName : type.string(),
	previewIcon : type.string(),
	previewImage : type.string(),
	skinPath : type.string(),
	skinTemplate : type.string(),
	properties : type.string(),
	useType : type.number().integer(),
	locale : type.string(),
	state : type.string()    
});


exports.SkinTemplateModel = SkinTemplate;

exports.addSkinTemplate = function (req, res) {
    var newSkinTemplate = new SkinTemplate(req.body);
    newSkinTemplate.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSkinTemplate = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    SkinTemplate.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSkinTemplate = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    SkinTemplate.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSkinTemplate = function (req, res) {
    var id = req.params.id;
    SkinTemplate.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
