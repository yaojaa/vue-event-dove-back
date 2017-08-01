const myutil     = require('../util/util.js');
const errorCodes = require('../util/errorCodes.js').ErrorCodes;

module.exports = function (options) {

    var middleware = function (req, res, next) {

        var isVerify = myutil.checkCaptcha(req) || myutil.checkVerificationCode(req);

        if (!isVerify) {
            return next({
                statusCode: 412,
                errorCode : errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('VerifyFailed')
            });
        }

        return next();
    };

    return middleware;
};
