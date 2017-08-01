/**
 * Created by Henry on 2017/4/1.
 */

const User               = require('../model/user');
const Event              = require('../model/event');
const MultiAuthorization = require('../model/multiAuthorization');
const redisClinet        = require('../util/redisUtil').redisClinet;
const redisUtil          = require('../util/redisUtil');
const REDIS_PREFIX       = require('../util/fixParams').REDIS_PREFIX;
const loggerSettings     = require('../logger');
const logger             = loggerSettings.winstonLogger;
const _                  = require('lodash');
const errorCodes         = require('../util/errorCodes.js').ErrorCodes;

/**
 * 针对非活动的年费版
 */
exports.checkVIPPackage = async function (req, res, next) {
    const userId = req.user.id;
    /**
     * 1. package 类型判断
     * 2. package 有效期判断
     */
    try {
        if (!await User.isVip(userId)) {
            return next({
                errorCode: 403, responseText: 'VIP only.'
            });
        }
        return next();
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};

// 对活动以及活动操作权限进行判断
exports.checkEventsAndOperations = async function (req, next, event) {
    /**
     * 1. Event 是否属于自己
     * 2. 如果是自己的，访问路径是否在blacklist中
     *      i. 检查是单场次专业版
     *      ii. 检查是否用户Vip
     *      iii. 是否过期
     * 3. 不是自己的，查看是否授权的活动，授权的操作，授权人的是否VIP
     *
     */
    const userId    = req.user.id;
    const operation = req._parsedUrl.pathname;

    try {

        const isOwnEvent = await Event.isOwnEvent(userId, event.id);
        if (isOwnEvent) {

            const flag = await redisUtil.sismember(REDIS_PREFIX.BLACK_ROUTES + 'vip', operation);
            if (flag > 0) {

                // vip 操作

                if (!event.isVIP) {
                    throw new Error(req.__('err_no_operation_permissions'));
                }

                if (!await User.isVip(userId)) {
                    throw new Error(req.__('err_no_operation_permissions'));
                }

                return next();
            }

            return next();

        }

        const fromUserId = event.userId;
        let ma           = await MultiAuthorization.getMultiAuthorization(fromUserId, userId);

        if (_.isEmpty(ma)) {
            throw new Error(req.__('err_no_operation_permissions'));
        }

        const isHasOp = !(__checkEvent(event.id, ma)  ) ||
            !( __checkOperation(operation, ma) ) ||
            !(await User.isVip(fromUserId));

        if (isHasOp) {
            throw new Error(req.__('err_no_operation_permissions'));
        }

        return next();

    } catch (err) {
        logger.error('checkEventsAndOperations ', err);
        throw err;
    }

};

// 是否授权活动
function __checkEvent(eventId, ma) {

    if (ma.isAllEvents) {
        return true;
    }

    const eventSet = new Set(ma.events);
    return eventSet.has(eventId);
}

// 是否授权操作
function __checkOperation(path, ma) {

    if (ma.isAllOperations) {
        return true;
    }

    const pathSet = new Set(ma.routes);
    return pathSet.has(path);
}
