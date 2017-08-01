/**
 * Created by zhaohongyu on 2017/1/5.
 */

'use strict';

const _          = require('lodash');
const myutil     = require('../util/util.js');
const thinky     = require('../util/thinky.js');
const validate   = myutil.validate;
const Recommend  = require('../model/selectObjectRecommend');
const Event      = require('../model/event');
const Member     = require('../model/member');
const Promise    = require('bluebird');
const settings   = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const errorCodes = require('../util/errorCodes.js').ErrorCodes;
const path       = require('path');
const fs         = require('fs');
const moment     = require('moment');

var SelectObjectRecommendModel               = Recommend.SelectObjectRecommendModel;
exports.add                                  = add;
exports.del                                  = del;
exports.update                               = update;
exports.recommend                            = recommend;
exports.getRecommendByObjectTypeAndPageIndex = getRecommendByObjectTypeAndPageIndex;
exports.uploadRecommendImage                 = uploadRecommendImage;

function add(req, res, next) {
    var body        = req.body;
    var purenessReq = myutil.getPurenessRequsetFields(body, Recommend.SelectObjectRecommendFields);// 准备需要插入数据库的数据

    if (_.isEmpty(body)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'request')
        });
    }

    if (!validate(req, res, SelectObjectRecommendModel)) {
        return;
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            // 当objectType为bannerEvent,hotEvent时检测objectId是否存在,不存在则不能添加
            if (myutil.inArray(body.objectType, ['bannerEvent', 'hotEvent'])) {
                try {
                    if (body.objectId !== "0") {
                        var eventAttributeNames = ['id'];
                        var event               = yield Event.getEventById(body.objectId, eventAttributeNames);
                    }
                } catch (err) {
                    throw new Error(req.__('NotExists', 'event'));
                }
            }

            var result = yield Recommend.add(purenessReq);
            return res.status(200).send(result);
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

function del(req, res, next) {
    var p = req.body;

    if (_.isEmpty(p.id)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {

            var result = yield Recommend.delete(p.id);
            return res.status(200).send(result);

        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

function update(req, res, next) {
    var body        = req.body;
    var purenessReq = myutil.getPurenessRequsetFields(body, Recommend.SelectObjectRecommendFields);// 准备需要插入数据库的数据

    if (_.isEmpty(body)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'request')
        });
    }

    if (_.isEmpty(body.id)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'id')
        });
    }

    const doSomething = Promise.coroutine(function*() {
        try {
            var result = yield Recommend.update(purenessReq);
            return res.status(200).send(result);
        } catch (err) {
            return next({
                errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
            });
        }
    })();
}

async function __getBannerEventList(recommendList, req) {

    const bannerEventLimit    = 5;
    let bannerEventList       = _.filter(recommendList, {"objectType": "bannerEvent"});
    bannerEventList           = bannerEventList.slice(0, bannerEventLimit);
    let bannerEventArr        = [];
    const eventAttributeNames = ['id', 'title', 'bannerUrl', 'startTime', 'detailedAddress', 'categories'];

    for (let recommend of bannerEventList) {
        let eventInfo = {};
        try {
            eventInfo = await Event.getEventById(recommend.objectId, eventAttributeNames)
        } catch (err) {
        }
        bannerEventArr.push(eventInfo);
    }

    let tmpArr = [];
    let index  = 0;
    for (let recommend of bannerEventList) {

        recommend.object = {};
        const object     = bannerEventArr[index];

        if (!_.isEmpty(object)) {
            const categoriesStrArr = await Event.getCateStrArr(object.categories, req);
            recommend.object       = {
                id              : object.id,
                name            : object.title,
                bannerUrl       : object.bannerUrl,
                startTime       : object.startTime,
                detailedAddress : object.detailedAddress,
                categories      : object.categories,
                categoriesStrArr: categoriesStrArr,
                categoriesStr   : categoriesStrArr.join()
            };
        }

        tmpArr.push(recommend);
        index++;

    }

    return tmpArr;

}

async function __getHotEventList(recommendList, req) {

    const hotEventLimit       = 12;
    let hotEventList          = _.filter(recommendList, {"objectType": "hotEvent"});
    hotEventList              = hotEventList.slice(0, hotEventLimit);
    let hotEventArr           = [];
    const eventAttributeNames = ['id', 'title', 'bannerUrl', 'startTime', 'detailedAddress', 'categories', 'thumbnail'];

    for (let recommend of hotEventList) {
        let eventInfo = {};
        try {
            eventInfo = await Event.getEventById(recommend.objectId, eventAttributeNames)
        } catch (err) {
        }
        hotEventArr.push(eventInfo);
    }

    let tmpArr = [];
    let index  = 0;
    for (let recommend of hotEventList) {

        recommend.object = {};
        const object     = hotEventArr[index];

        if (!_.isEmpty(object)) {
            const categoriesStrArr = await Event.getCateStrArr(object.categories, req);
            recommend.thumbnail = object.thumbnail;
            recommend.object       = {
                id              : object.id,
                name            : object.title,
                bannerUrl       : object.bannerUrl,
                startTime       : object.startTime,
                detailedAddress : object.detailedAddress,
                categories      : object.categories,
                categoriesStrArr: categoriesStrArr,
                categoriesStr   : categoriesStrArr.join()
            };
        }

        tmpArr.push(recommend);
        index++;

    }

    return tmpArr;

}

function __getCityList(recommendList, req) {

    const cityLimit = 5;
    let cityList    = _.filter(recommendList, {"objectType": "city"});
    cityList        = cityList.slice(0, cityLimit);
    return cityList;
}

async function __getGroupList(recommendList, req) {

    const groupLimit     = 3;
    let groupList        = _.filter(recommendList, {"objectType": "group"});
    groupList            = groupList.slice(0, groupLimit);
    let membershipArr    = [];
    const attributeNames = ['name'];

    for (let recommend of groupList) {
        let membershipInfo = {};
        try {
            membershipInfo = await Member.getMembershipById(recommend.objectId, attributeNames)
        } catch (err) {
        }
        membershipArr.push(membershipInfo);
    }

    let tmpArr = [];
    let index  = 0;
    for (let recommend of groupList) {

        recommend.object = {};
        const object     = membershipArr[index];

        if (!_.isEmpty(object)) {
            recommend.object = {
                name: object.name,
            };
        }

        tmpArr.push(recommend);
        index++;

    }

    return tmpArr;

}

// 会鸽首页
async function recommend(req, res, next) {
    try {

        const recommendList = await Recommend.getAllRecommend();

        // banner推荐
        const bannerEventList = await __getBannerEventList(recommendList, req);

        // 热门活动推荐
        const hotEventList = await __getHotEventList(recommendList, req);

        // 热门地区推荐
        const cityList = __getCityList(recommendList, req);

        // 热门会员推荐
        const groupList = await __getGroupList(recommendList, req);

        // 按分类查看
        const categoryList = await Event.getEventCategoriesList(req);


        const returnObj = {
            bannerEventList: bannerEventList,
            hotEventList   : hotEventList,
            cityList       : cityList,
            groupList      : groupList,
            categoryList   : categoryList
        };

        return res.status(200).send(returnObj);

    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

async function getRecommendByObjectTypeAndPageIndex(req, res, next) {

    const query = req.query;

    if (_.isEmpty(query.objectType)) {
        return next({
            errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: req.__('Empty', 'objectType')
        });
    }

    try {

        const data = await Recommend.getRecommendByObjectTypeAndPageIndex(query);

        const eventAttributeNames      = ['id', 'title', 'bannerUrl', 'startTime', 'detailedAddress', 'categories'];
        const memberShipAttributeNames = ['name'];
        let objectArr                  = [];

        for (let recommend of data.items) {

            let objectInfo = {};

            if (myutil.inArray(recommend.objectType, ['bannerEvent', 'hotEvent'])) {
                try {
                    objectInfo = await Event.getEventById(recommend.objectId, eventAttributeNames)
                } catch (err) {
                }
            }

            if (myutil.inArray(recommend.objectType, ['group'])) {
                try {
                    objectInfo = await Member.getMembershipById(recommend.objectId, memberShipAttributeNames)
                } catch (err) {
                }
            }

            objectArr.push(objectInfo);
        }

        if (!_.isEmpty(objectArr)) {

            let tmpArr = [];
            let index  = 0;
            for (let recommend of data.items) {
                recommend.object = {};
                const object     = objectArr[index];

                if (!_.isEmpty(object)) {

                    if (myutil.inArray(recommend.objectType, ['bannerEvent', 'hotEvent'])) {
                        const categoriesStrArr = await Event.getCateStrArr(object.categories, req);
                        recommend.object       = {
                            id              : object.id,
                            name            : object.title,
                            bannerUrl       : object.bannerUrl,
                            startTime       : object.startTime,
                            detailedAddress : object.detailedAddress,
                            categories      : object.categories,
                            categoriesStrArr: categoriesStrArr,
                            categoriesStr   : categoriesStrArr.join()
                        };
                    }

                    if (myutil.inArray(recommend.objectType, ['group'])) {
                        recommend.object = {
                            name: object.name,
                        };
                    }

                }

                tmpArr.push(recommend);
                index++;
            }

            data.items = tmpArr;

        }

        const paginate = myutil.getPaginate(req.query.page, req.query.limit, data.count, data.items);
        res.status(200).send(paginate);
    } catch (err) {
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}

// 上传图片
async function uploadRecommendImage(req, res, next) {
    try {
        const files     = req.files;
        const imageType = req.body.imageType;

        if (_.isEmpty(files.fileValue)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "fileValue")
            });
        }

        if (_.isEmpty(imageType)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "imageType")
            });
        }

        const fileValue = files.fileValue;

        // 判断文件大小
        if (fileValue.size > 2097152) {
            return next({
                errorCode   : errorCodes.ADDRESS_BOOK_FILE_SIZE_ERR,
                responseText: req.__("toMuch", 2097152 + " 字节")
            });
        }

        // 判断文件格式
        const isValidFileType = myutil.inArray(fileValue.type, ['image/jpeg', 'image/png']);
        if (isValidFileType === false) {
            return next({
                errorCode   : errorCodes.ADDRESS_BOOK_FILE_FORMAT_ERR,
                responseText: req.__('not_support_format_file')
            });
        }

        // 重命名为真实文件名
        var appDir     = myutil.getAppDir();// 项目全路径
        var tempFolder = path.join("public/files/recommend/" + imageType + "/", moment().format('YYYYMMDD'));
        var dstPath    = path.join(tempFolder, moment().format('YYYYMMDDHHmmss') + "_" + fileValue.originalFilename);// 文件相对路径
        var fullPath   = path.join(appDir, dstPath);// 文件全路径

        myutil.mkdirs.sync(path.join(appDir, tempFolder));
        fs.renameSync(fileValue.path, fullPath);

        return res.status(200).send({path: dstPath});
    } catch (err) {
        logger.error(err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
}
