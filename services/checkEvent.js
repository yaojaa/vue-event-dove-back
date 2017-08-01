/**
 * Created by zhaohongyu on 2017/7/11.
 */

const _              = require('lodash');
const myutil         = require('../util/util.js');
const errorCodes     = require('../util/errorCodes.js').ErrorCodes;
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const Event          = require('../model/event');
const Authorization  = require('./authorization');

function __getEventId(req) {

    let eventId = '';

    if (!_.isEmpty(req.body)) {
        eventId = req.body.id || req.body.eventId;
    }


    if (!_.isEmpty(req.query)) {
        eventId = req.query.id || req.query.eventId;
    }

    return eventId;
}

module.exports = function (options) {

    const middleware = async function (req, res, next) {

        try {

            const eventId = __getEventId(req);
            if (_.isEmpty(eventId)) {
                throw new Error('缺少参数id或者eventId');
            }

            if (_.isUndefined(req.user)) {
                throw new Error('缺少用户信息');
            }

            const eventAttrNames = ['id', 'title', 'isVIP', 'userId'];
            const eventInfo      = await Event.tryGetEventInfo(eventId, eventAttrNames);

            if (_.isEmpty(eventInfo)) {
                throw new Error(req.__("NotExists", eventId));
            }

            await Authorization.checkEventsAndOperations(req, next, eventInfo);

        } catch (err) {
            return next({
                statusCode  : 403, errorCode: errorCodes.ERR_PERMISSION_DENIED,
                responseText: err.message
            });
        }

    };

    return middleware;
};
