var _  = require('lodash');
var fs = require('fs');

exports.getTemplateContent = function (templatePath, toReplaceData) {
    var templateOriginContent = fs.readFileSync(templatePath).toString();
    var template              = _.template(templateOriginContent);
    return template(toReplaceData);
};