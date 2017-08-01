var _         = require('lodash');
var myutil    = require('../util/util.js');
var thinky    = require('../util/thinky.js');
var validator = require('validator');
var type      = thinky.type;
var r         = thinky.r;
var nextId    = myutil.nextId;
const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;

var FieldTypeFields = {
    id                 : type.string(),
    fieldType          : type.string()
                             .enum(
                                 'text', 'texterea', 'radio', 'checkbox', 'dropbox', 'number', 'file',
                                 'datepicker', 'country'
                             )// 采集项类型
                             .default('text'),
    fieldName          : type.string(),
    isCustomizableField: type.boolean().default(false) // 是否自定义采集项类型
};

/**
 *   isCustomizableField 采集项类型
 *           true 系统提供的采集项类型,用于在用户自定义采集项下拉中使用
 *           false 系统提供的常见采集项,如部门,职务,职称等
 */
var FieldType = thinky.createModel("FieldType", FieldTypeFields);

const FieldType_INDICES = ['fieldType', 'isCustomizableField'];
_.each(FieldType_INDICES, function (index) {
    FieldType.ensureIndex(index);
});

exports.FieldTypeModel  = FieldType;
exports.FieldTypeFields = FieldTypeFields;

exports.addFieldType = function (data, options) {
    var newFieldType = new FieldType(data);
    newFieldType.id  = nextId();
    return newFieldType.save();
};

exports.updateFieldType = function (data, options) {
    var id = data.id;
    return FieldType.get(id).update(data).run();
};

exports.getFieldTypeById = function (id, options) {
    return FieldType.get(id).run();
};

exports.getFieldTypeByIsCustomizableField = function (isCustomizableField, options) {
    return FieldType.getAll(isCustomizableField, {index: "isCustomizableField"}).run();
};

exports.getAllFieldType = function (options) {
    return FieldType.run();
};
