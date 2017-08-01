var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var CityRegion = thinky.createModel("CityRegion", {
    	cityRegionId : type.string(),
	countryRegionId : type.string(),
	stateId : type.string(),
	name : type.string(),
	enName : type.string(),
	code : type.string(),
	countryRegionName : type.string(),
	countryRegionEnName : type.string(),
	stateName : type.string(),
	stateEnName : type.string()    
});


exports.CityRegionModel = CityRegion;

exports.addCityRegion = function (req, res) {
    var newCityRegion = new CityRegion(req.body);
    newCityRegion.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateCityRegion = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    CityRegion.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteCityRegion = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    CityRegion.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getCityRegion = function (req, res) {
    var id = req.params.id;
    CityRegion.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
