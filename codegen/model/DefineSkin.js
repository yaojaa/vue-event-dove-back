var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var DefineSkin = thinky.createModel("DefineSkin", {
    	defineSkinId : type.string(),
	skinTemplateId : type.string(),
	skinTemplateCode : type.string(),
	defaultType : type.number().integer(),
	useType : type.number().integer(),
	properties : type.string(),
	loginId : type.string(),
	defaultSkin : type.number().integer()    
});


exports.DefineSkinModel = DefineSkin;

exports.addDefineSkin = function (req, res) {
    var newDefineSkin = new DefineSkin(req.body);
    newDefineSkin.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateDefineSkin = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    DefineSkin.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteDefineSkin = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    DefineSkin.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getDefineSkin = function (req, res) {
    var id = req.params.id;
    DefineSkin.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
