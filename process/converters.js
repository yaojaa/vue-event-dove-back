var _ = require('underscore'),
    md5 = require('md5'),
    datautils = require("./datautils"),
    f2n = datautils.f2n,
    loc2hash = datautils.loc2hash,
    locale2Country = datautils.locale2Country;

exports.eventConverter = function(item) {
	item.id = item.eventId.toString();
	
	item.title = _.clone(item.eventTitle);
	item.start_time = _.clone(item.startTimestamp);
	item.end_time = _.clone(item.endTimestamp);
    
    item.categories = [item.eventCategoryId];
    item.key_words = item.eventTags.split(' ');
	
	item.userId = item.loginId.toString();
	
	if(item.organizerId)
	   item.organizerId = item.organizerId.toString();
	
	if(item.accessPassword)
	   item.accessPassword = md5(item.accessPassword);
	
	item.address = {};
	item.address.detailed_address = item.eventAddress;
	
	if(item.cityId)
	   item.address.city = item.cityId.toString();
	    
	item.address.lat = f2n(item.lat);
	item.address.lng = f2n(item.lng);
	item.address.zipCode = item.zipCode;
	item.address.country = locale2Country(item.locale);
	
	item.geohash = loc2hash(item.address.lat, item.address.lng);
	
	item.banner_url = item.externalUrl;
	
	if(item.start_time < new Date()) {
	    item.historical = 1;
	}
	
	delete item.startTimestamp;
	delete item.endTimestamp;
	delete item.loginId;
	delete item.eventTitle;
	delete item.eventTags;
	delete item.eventAddress;
	delete item.eventCategoryId;
	delete item.eventCategoryName;
	delete item.cityId;
	delete item.lat;
	delete item.lng;
	delete item.zipCode;
	delete item.externalUrl;
	
	
    return item;
};

// TODO:
exports.userConverter = function(item) {
	item.id = item.loginId.toString();
    return item;
};

// TODO:
exports.attendeeConverter = function(item) {
	item.id = item.attendeeId.toString();
	return item;
};

