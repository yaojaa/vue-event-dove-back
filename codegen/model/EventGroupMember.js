var _ = require('underscore');
var myutil = require('../util/util.js');
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var EventGroupMember = thinky.createModel("EventGroupMember", {
    	groupMemberId : type.string(),
	loginId : type.string(),
	eventGroupId : type.string(),
	groupRoleId : type.string(),
	viewName : type.string(),
	externalId : type.string(),
	pdataUserIcon : type.string(),
	memberEmail : type.string(),
	weiboInfo : type.string(),
	profileData : type.string(),
	joinTime : type.date(),
	expireTime : type.date(),
	activeTime : type.date(),
	sign : type.string(),
	omertaContent : type.string(),
	attentionGroupStatus : type.string(),
	memberStatus : type.number().integer(),
	authDefaultStatus : type.number().integer(),
	sendExpirationMail : type.string(),
	state : type.string(),
	firstName : type.string(),
	lastName : type.string(),
	homePhone : type.string(),
	cellPhone : type.string(),
	emailAddress : type.string(),
	homeAddress : type.string(),
	jobTitle : type.string(),
	companyOrorganization : type.string(),
	workPhone : type.string(),
	website : type.string(),
	blog : type.string(),
	gender : type.string(),
	age : type.string(),
	fax : type.string(),
	zipCode : type.string(),
	post : type.string(),
	department : type.string(),
	address : type.string()    
});


exports.EventGroupMemberModel = EventGroupMember;

exports.addEventGroupMember = function (req, res) {
    var newEventGroupMember = new EventGroupMember(req.body);
    newEventGroupMember.save().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.updateEventGroupMember = function (req, res) {
    var agenda = req.body;
    var id = agenda.id;
    EventGroupMember.get(id).update(agenda).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.deleteEventGroupMember = function (req, res) {
    var id = req.body.id;
    // use execute instead of run so that validate will not be called.
    EventGroupMember.get(id).delete().execute().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};

exports.getEventGroupMember = function (req, res) {
    var id = req.params.id;
    EventGroupMember.getAll(id).run().then(function(result) {
        res.send(200, result);
    }).error(myutil.handleError(res));
};
