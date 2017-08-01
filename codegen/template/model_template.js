var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var <%= ModelName %> = thinky.createModel("<%= ModelName %>", {
    <%= ModelBody %>    
});


exports.<%= ModelName %>Model = <%= ModelName %>;

exports.add<%= ModelName %> = function (req, res) {
    var new<%= ModelName %> = new <%= ModelName %>(req.body);
    new<%= ModelName %>.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.update<%= ModelName %> = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    <%= ModelName %>.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.delete<%= ModelName %> = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    <%= ModelName %>.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.get<%= ModelName %> = function (req, res) {
    var id = req.params.id;
    <%= ModelName %>.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
