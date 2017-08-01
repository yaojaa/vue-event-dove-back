var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Subdomains = thinky.createModel("Subdomains", {
    	domainId : type.string(),
	loginId : type.string(),
	subdomainName : type.string(),
	domainType : type.number().integer(),
	state : type.string(),
	reserve : type.number().integer()    
});


exports.SubdomainsModel = Subdomains;

exports.addSubdomains = function (req, res) {
    var newSubdomains = new Subdomains(req.body);
    newSubdomains.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateSubdomains = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    Subdomains.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteSubdomains = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    Subdomains.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getSubdomains = function (req, res) {
    var id = req.params.id;
    Subdomains.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
