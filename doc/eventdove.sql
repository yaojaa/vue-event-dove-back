/*
 Navicat Premium Data Transfer

 Source Server         : hg_data
 Source Server Type    : MySQL
 Source Server Version : 50625
 Source Host           : 54.223.209.16
 Source Database       : hyzing_nmyevent

 Target Server Type    : MySQL
 Target Server Version : 50625
 File Encoding         : utf-8

 Date: 10/12/2016 15:53:16 PM
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;



-- ----------------------------
--  Table structure for `Agenda`
--   活动日程 1
-- ----------------------------
DROP TABLE IF EXISTS `Agenda`;
CREATE TABLE `Agenda` (
  `agendaId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `type` tinyint(3) DEFAULT '2' COMMENT '1:入场签到 2:主题演讲;3:休息交流',
  `day` int(11) DEFAULT '1' COMMENT '第几天的日程  添加的时候下拉日程选',
  `title` varchar(500) DEFAULT NULL,
  `agendaTime` datetime DEFAULT NULL,
  `startTime` datetime DEFAULT NULL,
  `endTime` datetime DEFAULT NULL,
  `venue` varchar(100) DEFAULT NULL,
  `createTime` datetime DEFAULT NULL,
  `introduction` text,
  `sort` int(11) DEFAULT '0',
  `fieldData` longtext,
  `migrateId` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`agendaId`),
  KEY `FK_Reference_207` (`eventId`)
) ENGINE=MyISAM AUTO_INCREMENT=4748 DEFAULT CHARSET=utf8;


-- ----------------------------
--  Table structure for `Attendee`
--  参会人员表 2
-- ----------------------------
DROP TABLE IF EXISTS `Attendee`;
CREATE TABLE `Attendee` (
  `userProfileId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `ticketId` bigint(20) DEFAULT NULL,
  `orderId` int(11) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `eventTitle` varchar(1000) DEFAULT NULL,
  `checkinStatus` tinyint(3) unsigned DEFAULT '0' COMMENT '签到状态 0 未签到 1 已签到',
  `profileStatus` tinyint(2) DEFAULT NULL,
  `barcode` varchar(30) DEFAULT '',
  `refBarcode` varchar(30) DEFAULT NULL,
  `qrCodeContent` varchar(1024) DEFAULT NULL,
  `rfidTag` char(30) DEFAULT NULL,
  `pdataUserType` tinyint(3) unsigned DEFAULT '0' COMMENT '用户类别 0 保留 1 管理员 2 工作人员 3参会人员 4VIP',
  `pdataUserPriority` int(11) DEFAULT '0' COMMENT '用户优先级',
  `firstName` varchar(80) DEFAULT NULL,
  `lastName` varchar(80) DEFAULT NULL,
  `userName` varchar(80) DEFAULT NULL,
  `userNamePinyin` varchar(2000) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `homePhone` varchar(60) DEFAULT NULL,
  `cellPhone` varchar(50) DEFAULT NULL,
  `emailAddress` varchar(150) DEFAULT NULL,
  `tempPassword` char(8) DEFAULT '',
  `homeAddress` varchar(200) DEFAULT NULL,
  `shippingAddress` varchar(200) DEFAULT NULL,
  `jobTitle` varchar(500) DEFAULT NULL,
  `companyOrorganization` varchar(500) DEFAULT NULL,
  `workAddress` varchar(200) DEFAULT NULL,
  `workPhone` varchar(50) DEFAULT NULL,
  `website` varchar(100) DEFAULT NULL,
  `blog` varchar(100) DEFAULT NULL,
  `fax` varchar(30) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `post` varchar(500) DEFAULT NULL,
  `zipCode` varchar(20) DEFAULT NULL,
  `gender` varchar(100) DEFAULT NULL,
  `birthDate` varchar(100) DEFAULT NULL,
  `age` varchar(100) DEFAULT NULL,
  `profileData` longtext,
  `attendeeNotes` longtext,
  `identity` int(11) NOT NULL DEFAULT '0',
  `noteTimestamp` datetime DEFAULT NULL,
  `checkinTimestamp` datetime DEFAULT NULL,
  `modifyTimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createTimestamp` datetime DEFAULT NULL,
  `state` enum('A','U') DEFAULT 'A',
  `payStatus` tinyint(3) NOT NULL DEFAULT '0',
  `installVip` tinyint(2) DEFAULT '0',
  `hasAudit` tinyint(5) DEFAULT '0',
  `visitorStar` int(11) DEFAULT '0',
  `vistorDesc` varchar(500) DEFAULT NULL,
  `weixinOpenId` varchar(500) DEFAULT NULL,
  `auditTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`userProfileId`),
  KEY `FK_Reference_89` (`ticketId`),
  KEY `FK_Reference_88` (`orderId`),
  KEY `index_eventId` (`eventId`,`payStatus`,`hasAudit`),
  KEY `weixinOpenId` (`weixinOpenId`(333))
) ENGINE=MyISAM AUTO_INCREMENT=1309289 DEFAULT CHARSET=utf8 COMMENT='参会人员资料\r\n';

-- ----------------------------
--  Table structure for `AttendeeTicket`
-- 参会者票表 3
-- ----------------------------
DROP TABLE IF EXISTS `AttendeeTicket`;
CREATE TABLE `AttendeeTicket` (
  `attendeeTicketId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `orderId` int(11) DEFAULT NULL,
  `userProfileId` bigint(20) DEFAULT NULL,
  `ticketId` bigint(20) DEFAULT NULL,
  `checkinStatus` tinyint(4) DEFAULT NULL,
  `checkinTimestamp` datetime DEFAULT NULL,
  `auditTimestamp` datetime DEFAULT NULL,
  `hasAudit` tinyint(4) DEFAULT NULL,
  `payStatus` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`attendeeTicketId`),
  KEY `FK_Reference_196` (`orderId`),
  KEY `FK_Reference_193` (`userProfileId`),
  KEY `FK_Reference_194` (`ticketId`),
  KEY `FK_Reference_195` (`eventId`)
) ENGINE=MyISAM AUTO_INCREMENT=391680 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Auth`
--  用户－主办方信息关联表 4
-- ----------------------------
DROP TABLE IF EXISTS `Auth`;
CREATE TABLE `Auth` (
  `authId` int(11) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) NOT NULL,
  PRIMARY KEY (`authId`),
  KEY `fk_Auth_Login` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=59 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `AuthRequest`
--  主办方认证信息表 5
-- ----------------------------
DROP TABLE IF EXISTS `AuthRequest`;
CREATE TABLE `AuthRequest` (
  `authReqId` int(11) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) NOT NULL,
  `realName` varchar(45) NOT NULL,
  `idCard` varchar(50) DEFAULT NULL,
  `idCardResource` varchar(200) DEFAULT NULL,
  `idCardResource2` varchar(200) DEFAULT NULL,
  `reqTime` datetime NOT NULL,
  `auditTime` datetime DEFAULT NULL,
  `authStatus` tinyint(4) DEFAULT '0',
  `resultCause` varchar(2000) DEFAULT NULL COMMENT '审核未通过的原因',
  PRIMARY KEY (`authReqId`),
  KEY `fk_AuthRequest_Login1` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=112 DEFAULT CHARSET=utf8;


-- ----------------------------
--  Table structure for `City`    城市   6
-- ----------------------------
DROP TABLE IF EXISTS `City`;
CREATE TABLE `City` (
  `cityId` int(11) NOT NULL AUTO_INCREMENT,
  `provinceId` int(11) DEFAULT NULL,
  `countryName` varchar(50) DEFAULT '',
  `provinceName` varchar(50) DEFAULT '',
  `cityName` varchar(30) NOT NULL DEFAULT '',
  `cityCode` varchar(20) DEFAULT '',
  `lat` varchar(20) DEFAULT NULL,
  `lng` varchar(20) DEFAULT NULL,
  `timeDiff` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`cityId`),
  KEY `FK_Reference_11` (`provinceId`)
) ENGINE=MyISAM AUTO_INCREMENT=22338 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `CityRegion`   城市区域   7
-- ----------------------------
DROP TABLE IF EXISTS `CityRegion`;
CREATE TABLE `CityRegion` (
  `cityRegionId` int(11) NOT NULL AUTO_INCREMENT,
  `countryRegionId` int(5) DEFAULT NULL,
  `stateId` int(11) DEFAULT NULL,
  `name` varchar(30) DEFAULT '',
  `enName` varchar(80) NOT NULL DEFAULT '',
  `code` varchar(20) DEFAULT '',
  `countryRegionName` varchar(30) DEFAULT '',
  `countryRegionEnName` varchar(80) DEFAULT '',
  `stateName` varchar(30) DEFAULT NULL,
  `stateEnName` varchar(80) DEFAULT NULL,
  PRIMARY KEY (`cityRegionId`),
  KEY `FK_Reference_11` (`countryRegionId`),
  KEY `FK_Reference_12` (`stateId`)
) ENGINE=MyISAM AUTO_INCREMENT=4403 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `CollectionData`  数据采集点收集到的参会者数据信息  8
-- ----------------------------
DROP TABLE IF EXISTS `CollectionData`;
CREATE TABLE `CollectionData` (
  `collectionDataId` bigint(20) NOT NULL AUTO_INCREMENT,
  `pointFunctionId` bigint(20) DEFAULT NULL,
  `vistorStar` int(20) DEFAULT '0',
  `vistorDesc` varchar(500) DEFAULT NULL,
  `userProfileId` bigint(20) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `scanType` int(11) DEFAULT '0' COMMENT '0 组织者扫描票(Send email) 1 login扫描(send email) 2 匿名(do nothing,update pointCount)',
  `visitCount` int(11) DEFAULT NULL,
  `businessCardAttendeeId` bigint(20) DEFAULT NULL,
  `collectionTime` datetime DEFAULT NULL,
  `isSendStatus` tinyint(2) DEFAULT '0',
  PRIMARY KEY (`collectionDataId`),
  KEY `FK_Reference_136` (`pointFunctionId`),
  KEY `FK_Reference_137` (`userProfileId`)
) ENGINE=MyISAM AUTO_INCREMENT=124449 DEFAULT CHARSET=utf8 COMMENT='数据采集点收集到的数据';

-- ----------------------------
--  Table structure for `CollectionFunction`    采集数据类型（收集器） 9
-- ----------------------------
DROP TABLE IF EXISTS `CollectionFunction`;
CREATE TABLE `CollectionFunction` (
  `collectionFunctionId` bigint(20) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL,
  `functionName` varchar(200) DEFAULT NULL,
  `functionKey` varchar(100) DEFAULT 'checkIn',
  `functionDescription` varchar(500) DEFAULT NULL,
  `functionType` int(11) DEFAULT NULL COMMENT '// 代表功能类型 1. 签到； 2.资料发放',
  `createTime` datetime DEFAULT NULL,
  `state` char(2) DEFAULT 'A',
  PRIMARY KEY (`collectionFunctionId`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `CollectionPoint`    采集点（收集器）  10
-- ----------------------------
DROP TABLE IF EXISTS `CollectionPoint`;
CREATE TABLE `CollectionPoint` (
  `collectionPointId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `inviteId` bigint(20) DEFAULT NULL,
  `pointName` varchar(200) DEFAULT NULL,
  `functionKey` varchar(100) DEFAULT 'checkIn',
  `useState` tinyint(2) DEFAULT NULL,
  `useEmail` varchar(200) DEFAULT NULL,
  `pointTimeType` tinyint(2) DEFAULT '0',
  `startTime` datetime DEFAULT NULL,
  `pointDescription` varchar(500) DEFAULT NULL,
  `ticketState` tinyint(4) DEFAULT '0',
  `ticketStr` varchar(1000) DEFAULT NULL,
  `createTime` datetime DEFAULT NULL,
  `isRepeat` tinyint(2) DEFAULT '0',
  `endTime` datetime DEFAULT NULL,
  `pointState` tinyint(6) DEFAULT '0' COMMENT '0:未开通1已开通;2已冻结3失效,4未完成;',
  `pointCount` int(11) DEFAULT NULL,
  `needResponse` tinyint(2) DEFAULT '0',
  `responseMsg` varchar(500) DEFAULT NULL,
  `qrCodeImage` varchar(200) DEFAULT NULL COMMENT '二维码图片',
  `qrCodeContent` varchar(500) DEFAULT NULL COMMENT '二维码内容',
  `qrEntLogo` varchar(500) DEFAULT NULL COMMENT '二维码企业logo',
  `isEntLogo` tinyint(3) DEFAULT '0' COMMENT '0普通1定制2默认(接受邀请后初始)',
  `payEntLogo` tinyint(2) DEFAULT '0',
  `shareCheckInfo` tinyint(2) DEFAULT '1' COMMENT '是否共享展台信息',
  `emailContent` varchar(1000) DEFAULT NULL,
  `state` char(2) DEFAULT 'A',
  `otherStar` int(11) DEFAULT '0',
  `fiveStar` int(11) DEFAULT '0',
  `fourStar` int(11) DEFAULT '0',
  `threeStar` int(11) DEFAULT '0',
  `twoStar` int(11) DEFAULT '0',
  `oneStar` int(11) DEFAULT '0',
  PRIMARY KEY (`collectionPointId`)
) ENGINE=MyISAM AUTO_INCREMENT=1023 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `ConfigSetting`    会议个性化设置   11
-- ----------------------------
DROP TABLE IF EXISTS `ConfigSetting`;
CREATE TABLE `ConfigSetting` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `configCode` varchar(100) DEFAULT NULL,
  `defultStatus` tinyint(4) DEFAULT NULL COMMENT '0=非默认值，1=默认值',
  `configValue` varchar(500) DEFAULT NULL,
  `expressStatus` tinyint(2) DEFAULT '0',
  `configShowValue` varchar(300) DEFAULT NULL COMMENT '描述',
  `configDetail` varchar(200) DEFAULT NULL COMMENT '详细配置数据',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=18288 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Country`   国家   12
-- ----------------------------
DROP TABLE IF EXISTS `Country`;
CREATE TABLE `Country` (
  `countryId` int(11) NOT NULL AUTO_INCREMENT,
  `countryName` varchar(50) DEFAULT '',
  `countryCode` varchar(20) DEFAULT '',
  `state` char(1) NOT NULL DEFAULT 'A',
  PRIMARY KEY (`countryId`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `CountryRegion`   国家区域   13
-- ----------------------------
DROP TABLE IF EXISTS `CountryRegion`;
CREATE TABLE `CountryRegion` (
  `countryRegionId` smallint(5) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `enName` varchar(100) NOT NULL,
  PRIMARY KEY (`countryRegionId`)
) ENGINE=MyISAM AUTO_INCREMENT=243 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `CustomMailTemplate`   自定义邮件模版  14
-- ----------------------------
DROP TABLE IF EXISTS `CustomMailTemplate`;
CREATE TABLE `CustomMailTemplate` (
  `customMailTemplateId` bigint(20) NOT NULL AUTO_INCREMENT,
  `emailTemplateId` bigint(20) DEFAULT NULL COMMENT '各功能邮件的模板ID',
  `customMailTemplateDetailId` bigint(20) DEFAULT NULL,
  `templateCode` varchar(100) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `used` tinyint(4) DEFAULT NULL,
  `type` tinyint(4) DEFAULT '0',
  `status` tinyint(4) DEFAULT NULL,
  `customContent` longtext COMMENT '自定义邮件内容',
  `createTime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`customMailTemplateId`)
) ENGINE=MyISAM AUTO_INCREMENT=367 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `CustomMailTemplateDetail`   邮件模版详情  15
-- ----------------------------
DROP TABLE IF EXISTS `CustomMailTemplateDetail`;
CREATE TABLE `CustomMailTemplateDetail` (
  `customMailTemplateDetailId` bigint(20) NOT NULL AUTO_INCREMENT,
  `customMailTemplateId` bigint(20) DEFAULT NULL,
  `eventGroupId` bigint(20) DEFAULT NULL,
  `eventId` bigint(20) DEFAULT NULL COMMENT '活动的ID',
  `loginId` int(11) DEFAULT NULL,
  PRIMARY KEY (`customMailTemplateDetailId`)
) ENGINE=MyISAM AUTO_INCREMENT=1137 DEFAULT CHARSET=utf8;


-- ----------------------------
--  Table structure for `DefineSkin`   活支微站皮肤   16
-- ----------------------------
DROP TABLE IF EXISTS `DefineSkin`;
CREATE TABLE `DefineSkin` (
  `defineSkinId` bigint(20) NOT NULL AUTO_INCREMENT,
  `skinTemplateId` bigint(20) DEFAULT NULL,
  `skinTemplateCode` varchar(50) DEFAULT NULL,
  `defaultType` tinyint(4) DEFAULT NULL COMMENT '0默认1自定义',
  `useType` tinyint(4) DEFAULT NULL COMMENT '1.自定义网站2.主办方聚合页3.群组',
  `properties` text,
  `loginId` int(11) DEFAULT NULL,
  `defaultSkin` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`defineSkinId`),
  KEY `FK_Reference_185` (`skinTemplateId`)
) ENGINE=MyISAM AUTO_INCREMENT=106 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Discount`   优惠码   17
-- ----------------------------
DROP TABLE IF EXISTS `Discount`;
CREATE TABLE `Discount` (
  `discountId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `discountCode` varchar(50) DEFAULT '',
  `discountPrice` float DEFAULT NULL,
  `currencyName` varchar(10) DEFAULT '',
  `discountPercentage` int(11) DEFAULT '100',
  `limitUseCount` tinyint(2) DEFAULT '0' COMMENT '折扣码使用次数,0,不限制使用次数 1 限制使用,限制数目由于maxUseCount限制',
  `maxUseCount` int(11) DEFAULT NULL,
  `totalUseCount` int(5) DEFAULT '0' COMMENT '折扣码总计允许使用次数，0表示不限制',
  `startTime` datetime DEFAULT NULL,
  `endTime` datetime DEFAULT NULL,
  `state` char(1) DEFAULT 'A',
  `defaultTimeType` tinyint(4) DEFAULT '0',
  `discountType` tinyint(2) DEFAULT NULL,
  `discountRewardType` tinyint(2) DEFAULT '0' COMMENT '0固定值,1百分比值',
  `tickets` varchar(2048) DEFAULT NULL,
  `zkprice` varchar(20) DEFAULT NULL,
  `totalIncome` double DEFAULT '0',
  PRIMARY KEY (`discountId`),
  KEY `FK_Reference_168` (`eventId`)
) ENGINE=MyISAM AUTO_INCREMENT=184181 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `DiscountUsedLog`优惠码使用记录   18
-- ----------------------------
DROP TABLE IF EXISTS `DiscountUsedLog`;
CREATE TABLE `DiscountUsedLog` (
  `discountUsedLogId` bigint(20) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) DEFAULT NULL,
  `discountId` int(11) DEFAULT NULL,
  `createTime` datetime DEFAULT NULL,
  PRIMARY KEY (`discountUsedLogId`),
  KEY `FK_Reference_165` (`orderId`),
  KEY `FK_Reference_166` (`discountId`)
) ENGINE=MyISAM AUTO_INCREMENT=41363 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EmailCheck`   手机注册绑定邮箱  19
-- ----------------------------
DROP TABLE IF EXISTS `EmailCheck`;
CREATE TABLE `EmailCheck` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `token` varchar(40) DEFAULT NULL,
  `type` enum('','login_bind_email') DEFAULT NULL,
  `param` varchar(500) DEFAULT NULL,
  `expireTime` datetime DEFAULT NULL,
  `createTime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1275 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EmailConfig`     邮件模版设置    20
-- ----------------------------
DROP TABLE IF EXISTS `EmailConfig`;
CREATE TABLE `EmailConfig` (
  `emailConfigId` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(100) DEFAULT NULL,
  `eventMailTemplateId` bigint(20) DEFAULT NULL,
  `name` varchar(200) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `sendWay` tinyint(4) DEFAULT NULL,
  `blacklist` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`emailConfigId`),
  KEY `emailTemplateId` (`eventMailTemplateId`)
) ENGINE=MyISAM AUTO_INCREMENT=106 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EmailHistory`   历史邮件记录   11
-- ----------------------------
DROP TABLE IF EXISTS `EmailHistory`;
CREATE TABLE `EmailHistory` (
  `historyId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `fromAddress` varchar(250) DEFAULT '',
  `fromName` varchar(200) DEFAULT NULL,
  `replyAddress` varchar(200) DEFAULT '',
  `toAddress` longtext,
  `toName` varchar(2000) DEFAULT NULL,
  `subject` varchar(255) DEFAULT '',
  `content` longtext,
  `sendTime` timestamp NULL DEFAULT NULL,
  `status` tinyint(3) DEFAULT NULL COMMENT '0 发送成功 1 发送失败',
  PRIMARY KEY (`historyId`),
  KEY `FK_Reference_18` (`eventId`),
  KEY `FK_Reference_48` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=2586751 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Event`    活动主表    22
-- ----------------------------
DROP TABLE IF EXISTS `Event`;
CREATE TABLE `Event` (
  `eventId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventCode` varchar(100) DEFAULT '',
  `pubStatus` tinyint(3) DEFAULT '0' COMMENT '0未发布活动 1 己发布活动',
  `loginId` int(11) DEFAULT NULL,
  `eventContactInfoId` int(11) DEFAULT NULL,
  `domainId` int(11) DEFAULT NULL,
  `organizerId` bigint(20) DEFAULT NULL,
  `subdomainName` varchar(50) DEFAULT '',
  `eventTitle` varchar(200) DEFAULT NULL,
  `cityId` int(11) DEFAULT NULL,
  `eventAddress` varchar(255) DEFAULT '',
  `zipCode` varchar(20) DEFAULT NULL,
  `limitCount` int(11) NOT NULL DEFAULT '0',
  `logoUrl` varchar(128) DEFAULT '',
  `removeBrand` tinyint(3) DEFAULT '0' COMMENT '移除会鸽品牌',
  `entEvent` tinyint(4) DEFAULT '0',
  `capacity` int(11) DEFAULT '0',
  `regCount` int(10) unsigned DEFAULT '0' COMMENT '报名人数,在结束报名后生成这个字段',
  `attendeeCount` int(10) unsigned DEFAULT '0' COMMENT '参会人数，活动结束后统计的到场人数',
  `eventCategoryId` int(11) DEFAULT NULL,
  `eventCategoryName` varchar(50) DEFAULT '',
  `eventGroupId` bigint(20) DEFAULT NULL,
  `siteInfoId` int(11) DEFAULT NULL,
  `paymentId` bigint(20) DEFAULT NULL,
  `paymentMethod` tinyint(3) NOT NULL DEFAULT '0' COMMENT '0 表示实时分润 1 表示会鸽代收',
  `priceUnitId` tinyint(2) DEFAULT '2',
  `eventGroupName` varchar(50) DEFAULT '',
  `totalIncomeMoney` double DEFAULT '0' COMMENT '该会展的总收入',
  `totalFee` double DEFAULT '0',
  `startTimestamp` datetime DEFAULT NULL,
  `endTimestamp` datetime DEFAULT NULL,
  `createTimestamp` datetime DEFAULT NULL,
  `modifyTimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `accessTimestamp` datetime DEFAULT NULL,
  `publishTimestamp` datetime DEFAULT NULL,
  `brief` longtext,
  `content` longtext,
  `customMailTemplate` tinyint(3) DEFAULT '0' COMMENT '可自定义邮件模板0不可自定义1可以自定义',
  `eventTags` varchar(15) DEFAULT '群活动 物联网' COMMENT '活动关键字',
  `attentionCount` int(11) DEFAULT '0' COMMENT '被关注次数',
  `eventCreateSource` tinyint(3) DEFAULT '0',
  `settlementStatus` tinyint(5) DEFAULT NULL,
  `eventType` tinyint(3) DEFAULT NULL COMMENT '0 开放式活动 1封闭活动',
  `auditTicketType` tinyint(3) NOT NULL DEFAULT '1',
  `accessPassword` varchar(100) DEFAULT NULL,
  `smsTicket` tinyint(3) DEFAULT '0',
  `timeDiff` int(11) NOT NULL DEFAULT '0',
  `locale` varchar(10) DEFAULT NULL,
  `freedomLocale` tinyint(4) DEFAULT '0',
  `lat` varchar(20) DEFAULT NULL COMMENT '经度',
  `lng` varchar(20) DEFAULT NULL COMMENT '纬度',
  `attendeeStatus` tinyint(4) DEFAULT '0' COMMENT '//0 票的方式 1：参与者方式',
  `addressType` tinyint(4) DEFAULT '0',
  `showMap` tinyint(4) DEFAULT '1',
  `validCount` int(11) DEFAULT '0' COMMENT '需审核的人数',
  `commentCount` int(11) DEFAULT '0',
  `creditCardPay` tinyint(1) DEFAULT '0' COMMENT '0 不支持 1 支持',
  `weixinPay` tinyint(3) NOT NULL DEFAULT '0',
  `sendEndedReportMail` tinyint(2) DEFAULT '0' COMMENT '0没有发给组织者,1已发给组织者',
  `weiboTopic` varchar(200) DEFAULT '',
  `weiboName` varchar(200) DEFAULT '',
  `weiboQrImg` varchar(200) DEFAULT '',
  `weixinQrImg` varchar(200) DEFAULT '',
  `weixinPic` varchar(50) DEFAULT '',
  `externalUrl` varchar(200) DEFAULT '',
  `nameType` tinyint(2) DEFAULT '0',
  `showHotel` tinyint(2) NOT NULL DEFAULT '0' COMMENT '是否展示酒店购买入口  0：默认，不展示， 1. 展示',
  PRIMARY KEY (`eventId`),
  KEY `FK_Reference_17` (`domainId`),
  KEY `FK_Reference_38` (`loginId`),
  KEY `FK_Reference_84` (`cityId`),
  KEY `FK_Reference_83` (`eventCategoryId`),
  KEY `FK_Reference_72` (`eventGroupId`),
  KEY `FK_Reference_86` (`siteInfoId`)
) ENGINE=MyISAM AUTO_INCREMENT=52819026 DEFAULT CHARSET=utf8 COMMENT='活动（对象表）';

-- ----------------------------
--  Table structure for `EventActivity`    活动动态表    23
-- ----------------------------
DROP TABLE IF EXISTS `EventActivity`;
CREATE TABLE `EventActivity` (
  `activityId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `eventActivityItemId` int(11) DEFAULT NULL COMMENT '1 活动动态 2 推广动态',
  `eventActivityActionId` int(11) DEFAULT NULL COMMENT '1 发布活动 2 取消发布 3 留言 4 订单 5 推广收入 6 增加推广',
  `activityActionCode` varchar(30) NOT NULL,
  `activityTitle` varchar(1000) DEFAULT NULL,
  `activityContent` longtext,
  `createTimestamp` datetime DEFAULT NULL,
  `status` tinyint(4) DEFAULT '0' COMMENT '0=活动，1=群组',
  PRIMARY KEY (`activityId`),
  KEY `FK_Reference_159` (`eventActivityItemId`),
  KEY `FK_Reference_158` (`eventActivityActionId`)
) ENGINE=MyISAM AUTO_INCREMENT=391917 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventActivityAction`   活动动态对应类型  24
-- ----------------------------
DROP TABLE IF EXISTS `EventActivityAction`;
CREATE TABLE `EventActivityAction` (
  `activityActionId` int(11) NOT NULL AUTO_INCREMENT,
  `eventActivityItemId` int(11) DEFAULT NULL,
  `activityActionType` tinyint(2) DEFAULT NULL,
  `activityActionCode` varchar(30) DEFAULT NULL,
  `activityActionName` varchar(50) DEFAULT NULL,
  `activityActionTitleTemplate` longtext,
  `activityActionContentTemplate` varchar(1000) DEFAULT NULL,
  `locale` varchar(20) DEFAULT 'zh_CN',
  PRIMARY KEY (`activityActionId`)
) ENGINE=MyISAM AUTO_INCREMENT=49 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventBadge`  活动胸卡    25
-- ----------------------------
DROP TABLE IF EXISTS `EventBadge`;
CREATE TABLE `EventBadge` (
  `eventBadgeId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `badgePrintStyleId` int(4) NOT NULL,
  `eventId` bigint(20) NOT NULL,
  `loginId` int(11) NOT NULL,
  `badgeName` varchar(100) DEFAULT NULL,
  `collectInfo` mediumtext COMMENT '收集的信息（json串）',
  `activeBadge` tinyint(5) NOT NULL DEFAULT '0',
  `htmlContent` mediumtext,
  `createTime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`eventBadgeId`),
  KEY `FK_Reference_194` (`eventId`),
  KEY `FK_Reference_195` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=1304 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventBlockList`  活动首页显示列表   26
-- ----------------------------
DROP TABLE IF EXISTS `EventBlockList`;
CREATE TABLE `EventBlockList` (
  `eventBlockId` int(11) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `showType` tinyint(3) DEFAULT '0' COMMENT '0:首页活动显示',
  PRIMARY KEY (`eventBlockId`)
) ENGINE=MyISAM AUTO_INCREMENT=176 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventCategory` 活动分类   27
-- ----------------------------
DROP TABLE IF EXISTS `EventCategory`;
CREATE TABLE `EventCategory` (
  `eventCategoryId` int(11) NOT NULL AUTO_INCREMENT,
  `parentEventCategoryId` int(11) DEFAULT '0',
  `categoryName` varchar(50) DEFAULT '',
  `categoryDesc` varchar(200) DEFAULT '',
  `categoryEnName` varchar(80) DEFAULT '',
  `status` enum('A','U') DEFAULT 'A',
  `sort` int(11) DEFAULT '0',
  `relationCategory` int(11) DEFAULT '4',
  PRIMARY KEY (`eventCategoryId`),
  KEY `FK_Reference_51` (`parentEventCategoryId`)
) ENGINE=MyISAM AUTO_INCREMENT=101 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventContact`     活动网站联系方式    28
-- ----------------------------
DROP TABLE IF EXISTS `EventContact`;
CREATE TABLE `EventContact` (
  `eventContactId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `organizerId` bigint(20) DEFAULT NULL,
  `weiXin` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `mobile` varchar(30) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `qq` varchar(20) DEFAULT NULL,
  `emailAddress` varchar(50) DEFAULT NULL,
  `createTime` datetime DEFAULT NULL,
  PRIMARY KEY (`eventContactId`),
  KEY `FK_Reference_213` (`eventId`),
  KEY `FK_Reference_214` (`organizerId`)
) ENGINE=MyISAM AUTO_INCREMENT=6811 DEFAULT CHARSET=utf8 COMMENT='活动网站联系方式';

-- ----------------------------
--  Table structure for `EventContactInfo`    活动联系方式详情   29
-- ----------------------------
DROP TABLE IF EXISTS `EventContactInfo`;
CREATE TABLE `EventContactInfo` (
  `eventContactInfoId` int(11) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL,
  `userName` varchar(50) DEFAULT NULL,
  `cellPhone` varchar(20) DEFAULT NULL,
  `homePhone` varchar(60) DEFAULT NULL,
  `contactEmail` varchar(150) DEFAULT NULL,
  `contactAddress` varchar(300) DEFAULT NULL,
  `company` varchar(200) DEFAULT NULL,
  `jobTitle` varchar(100) DEFAULT NULL,
  `contactZipCode` varchar(20) DEFAULT NULL,
  `webSite` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`eventContactInfoId`)
) ENGINE=MyISAM AUTO_INCREMENT=28167 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventEmailNum` 活动邮件已用及可用量   30
-- ----------------------------
DROP TABLE IF EXISTS `EventEmailNum`;
CREATE TABLE `EventEmailNum` (
  `emailNumId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `usedCount` int(11) DEFAULT NULL,
  `canUseCount` int(11) DEFAULT NULL,
  PRIMARY KEY (`emailNumId`)
) ENGINE=MyISAM AUTO_INCREMENT=2830 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventFee` 活动单列服务费表   31
-- ----------------------------
DROP TABLE IF EXISTS `EventFee`;
CREATE TABLE `EventFee` (
  `eventFeeId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `basePrice` double DEFAULT '0',
  `ticketPercent` double DEFAULT '5',
  `maxFee` double NOT NULL DEFAULT '0',
  PRIMARY KEY (`eventFeeId`),
  KEY `FK_Reference_186` (`eventId`)
) ENGINE=MyISAM AUTO_INCREMENT=194 DEFAULT CHARSET=ucs2;

-- ----------------------------
--  Table structure for `EventMail`    活动邮件   32
-- ----------------------------
DROP TABLE IF EXISTS `EventMail`;
CREATE TABLE `EventMail` (
  `eventMailId` bigint(20) NOT NULL AUTO_INCREMENT,
  `emailTemplateId` bigint(20) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `eventId` bigint(20) DEFAULT NULL,
  `status` tinyint(3) unsigned DEFAULT '0',
  `sendStatus` tinyint(3) unsigned DEFAULT '0' COMMENT '发送状态 0 草稿 1 发送中 2 已发送',
  `priority` int(11) NOT NULL DEFAULT '3',
  `fromAddress` varchar(200) DEFAULT '',
  `fromName` varchar(2000) DEFAULT '',
  `replyAddress` varchar(200) DEFAULT '',
  `toAddress` longtext,
  `toName` varchar(2000) DEFAULT '',
  `mailCount` int(5) DEFAULT NULL,
  `htmlMail` int(11) DEFAULT '0',
  `subject` varchar(255) DEFAULT '',
  `toStruct` longtext COMMENT '收件人结构体',
  `content` longtext,
  `emailCode` varchar(1000) DEFAULT NULL,
  `emailSuffix` varchar(80) DEFAULT '',
  `attachmentPath` varchar(500) DEFAULT '""',
  `sendTimestamp` datetime DEFAULT NULL COMMENT '发送时间戳',
  `createTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`eventMailId`),
  KEY `FK_Reference_20` (`emailTemplateId`),
  KEY `FK_Reference_47` (`loginId`),
  KEY `FK_Reference_92` (`eventId`),
  KEY `eventMailId` (`eventMailId`),
  KEY `eventMailId_2` (`eventMailId`),
  KEY `emailSuffix` (`emailSuffix`)
) ENGINE=MyISAM AUTO_INCREMENT=748580 DEFAULT CHARSET=utf8 COMMENT='活动邮件';

-- ----------------------------
--  Table structure for `EventMailLimitConfig`   活动邮件流量设置   33
-- ----------------------------
DROP TABLE IF EXISTS `EventMailLimitConfig`;
CREATE TABLE `EventMailLimitConfig` (
  `limitConfigId` tinyint(4) NOT NULL AUTO_INCREMENT,
  `emailSuffix` varchar(80) DEFAULT NULL COMMENT 'email后缀，如：@qq.com',
  `second` int(11) DEFAULT NULL,
  `count` int(11) DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL COMMENT '0：全局配置（不需要设置email后缀）, 1:指定配置',
  PRIMARY KEY (`limitConfigId`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventMailTemplate`    活动邮件模版   34
-- ----------------------------
DROP TABLE IF EXISTS `EventMailTemplate`;
CREATE TABLE `EventMailTemplate` (
  `emailTemplateId` bigint(20) NOT NULL AUTO_INCREMENT,
  `status` tinyint(3) unsigned DEFAULT '0',
  `templateCode` varchar(100) DEFAULT NULL,
  `tplTitle` varchar(100) NOT NULL DEFAULT '' COMMENT '模板标题',
  `fromName` varchar(50) NOT NULL DEFAULT '""',
  `fromAddress` varchar(250) NOT NULL DEFAULT '""',
  `subject` varchar(255) DEFAULT '',
  `content` longtext,
  `createTimestamp` datetime DEFAULT NULL,
  `modifyTimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `public` char(1) DEFAULT NULL COMMENT 'Y 公开模板 N私密模板',
  `locale` varchar(20) DEFAULT 'zh_CN',
  `emailType` tinyint(2) DEFAULT '0',
  PRIMARY KEY (`emailTemplateId`)
) ENGINE=MyISAM AUTO_INCREMENT=270 DEFAULT CHARSET=utf8 COMMENT='活动邮件模板';

-- ----------------------------
--  Table structure for `EventMenu`   活动模块表   35
-- ----------------------------
DROP TABLE IF EXISTS `EventMenu`;
CREATE TABLE `EventMenu` (
  `menuId` int(11) NOT NULL AUTO_INCREMENT,
  `menuName` varchar(45) DEFAULT '',
  `enMenuName` varchar(45) DEFAULT '' COMMENT '英文名称\r\n            ',
  `menuObjectId` varchar(50) DEFAULT NULL,
  `menuObjectStyle` varchar(50) NOT NULL,
  `menuSort` tinyint(4) DEFAULT NULL,
  `menuState` char(1) DEFAULT NULL,
  `locale` varchar(20) DEFAULT 'zh_CN',
  PRIMARY KEY (`menuId`)
) ENGINE=MyISAM AUTO_INCREMENT=21 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventMessage`    活动留言   36
-- ----------------------------
DROP TABLE IF EXISTS `EventMessage`;
CREATE TABLE `EventMessage` (
  `eventMessageId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `sysLoginId` int(11) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `fromUserName` varchar(50) DEFAULT NULL,
  `senderEmail` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`eventMessageId`),
  KEY `eventId` (`eventId`)
) ENGINE=MyISAM AUTO_INCREMENT=9895 DEFAULT CHARSET=utf8 COMMENT='活动留言';

-- ----------------------------
--  Table structure for `EventOfflinePayment`   活动及线下支付关系表   37
-- ----------------------------
DROP TABLE IF EXISTS `EventOfflinePayment`;
CREATE TABLE `EventOfflinePayment` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `offlinePaymentId` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_Reference_190` (`eventId`),
  KEY `FK_Reference_192` (`offlinePaymentId`)
) ENGINE=MyISAM AUTO_INCREMENT=2112 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventOrderInvoice`   定单发票表   38
-- ----------------------------
DROP TABLE IF EXISTS `EventOrderInvoice`;
CREATE TABLE `EventOrderInvoice` (
  `orderInvoiceId` bigint(20) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) DEFAULT NULL,
  `eventId` bigint(20) DEFAULT NULL,
  `priceUnit` varchar(3) DEFAULT NULL,
  `orderPrice` double DEFAULT NULL,
  `fapiaoType` tinyint(2) DEFAULT '0' COMMENT '0:普通发票，1：专用发票',
  `fapiaoSend` int(11) NOT NULL DEFAULT '0',
  `head` varchar(500) DEFAULT NULL,
  `taxNumber` varchar(100) DEFAULT NULL,
  `services` varchar(300) DEFAULT NULL,
  `recipientName` varchar(300) DEFAULT NULL,
  `recipientAddress` varchar(300) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `companyAddress` varchar(500) DEFAULT NULL,
  `companyPhone` varchar(100) DEFAULT NULL,
  `companyBank` varchar(500) DEFAULT NULL,
  `remark` varchar(500) DEFAULT NULL,
  `bankAccount` varchar(100) DEFAULT NULL,
  `createTime` datetime DEFAULT NULL,
  `profileData` longtext COMMENT '备注内容',
  `modifyTime` datetime DEFAULT NULL,
  `expressStatus` tinyint(2) DEFAULT '0',
  `addressee` varchar(200) DEFAULT NULL,
  `contactPhone` varchar(100) DEFAULT NULL,
  `receiveAddress` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`orderInvoiceId`),
  KEY `FK_Reference_219` (`orderId`),
  KEY `FK_Reference_220` (`eventId`)
) ENGINE=MyISAM AUTO_INCREMENT=19513 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventRegForm`   活动报名人员收集项    39
-- ----------------------------
DROP TABLE IF EXISTS `EventRegForm`;
CREATE TABLE `EventRegForm` (
  `eventFormId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `formName` varchar(100) DEFAULT NULL,
  `timeLimit` int(5) DEFAULT NULL COMMENT '表单关闭时间',
  `eventEndMessage` varchar(300) DEFAULT NULL,
  `formType` tinyint(3) DEFAULT '0',
  PRIMARY KEY (`eventFormId`),
  KEY `FK_Reference_108` (`eventId`)
) ENGINE=MyISAM AUTO_INCREMENT=27834 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventRelate`  主活动子活动关联表   40
-- ----------------------------
DROP TABLE IF EXISTS `EventRelate`;
CREATE TABLE `EventRelate` (
  `eventRelateId` bigint(20) NOT NULL AUTO_INCREMENT,
  `masterEventId` bigint(20) DEFAULT NULL,
  `slaveEventId` bigint(20) DEFAULT NULL,
  `state` varchar(10) DEFAULT 'A',
  PRIMARY KEY (`eventRelateId`),
  KEY `slaveLink_masterEvent` (`masterEventId`),
  KEY `slaveLink_slaveEvent` (`slaveEventId`)
) ENGINE=MyISAM AUTO_INCREMENT=1199 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventResource`活动资源关联表   41
-- ----------------------------
DROP TABLE IF EXISTS `EventResource`;
CREATE TABLE `EventResource` (
  `eventResourcesId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `resourceId` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`eventResourcesId`),
  KEY `FK_Reference_187` (`eventId`),
  KEY `FK_Reference_188` (`resourceId`)
) ENGINE=MyISAM AUTO_INCREMENT=113 DEFAULT CHARSET=utf8;

-- ------------
-- ----------------------------
--  Table structure for `EventSmsTemplate`   活动短信模版   42
-- ----------------------------
DROP TABLE IF EXISTS `EventSmsTemplate`;
CREATE TABLE `EventSmsTemplate` (
  `eventSmsTemplateId` bigint(11) NOT NULL AUTO_INCREMENT,
  `templateCode` varchar(30) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `eventId` bigint(20) DEFAULT NULL,
  `smsTitle` varchar(200) DEFAULT NULL,
  `smsContent` text,
  `createTime` datetime DEFAULT NULL,
  `checkTime` datetime DEFAULT NULL,
  `templateState` tinyint(3) DEFAULT '1' COMMENT '0.系统模板 1.用户自定义模板。2.系统发送给用户的 不提供显示',
  `smsStatus` tinyint(3) DEFAULT '0' COMMENT '0.未审核 1.已审核(审核通过) 2.正在审核[已经提交] 3. 未通过审核',
  `locale` varchar(10) DEFAULT 'zh_CN',
  PRIMARY KEY (`eventSmsTemplateId`)
) ENGINE=MyISAM AUTO_INCREMENT=222 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventSpeaker`   活动嘉宾   43
-- ----------------------------
DROP TABLE IF EXISTS `EventSpeaker`;
CREATE TABLE `EventSpeaker` (
  `eventSpeakerId` bigint(20) NOT NULL AUTO_INCREMENT,
  `speakerId` int(11) DEFAULT NULL,
  `eventId` bigint(20) DEFAULT NULL,
  `remark` text,
  `sort` int(11) DEFAULT NULL,
  `status` tinyint(2) DEFAULT '0',
  `migrateId` varchar(100) DEFAULT NULL,
  `questionCount` int(11) DEFAULT '0',
  `flowerCount` int(11) DEFAULT '0',
  `rewardCount` int(11) DEFAULT '0',
  PRIMARY KEY (`eventSpeakerId`),
  KEY `FK_Reference_202` (`speakerId`),
  KEY `FK_Reference_203` (`eventId`)
) ENGINE=MyISAM AUTO_INCREMENT=14997 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `EventSubmenu`  活动子菜单表   44
-- ----------------------------
DROP TABLE IF EXISTS `EventSubmenu`;
CREATE TABLE `EventSubmenu` (
  `submenuId` int(11) NOT NULL AUTO_INCREMENT,
  `submenuName` varchar(50) DEFAULT NULL,
  `enSubmenuName` varchar(30) DEFAULT '',
  `submenuTagId` varchar(45) NOT NULL,
  `sysMenuId` int(11) NOT NULL,
  `urlValue` varchar(200) DEFAULT NULL,
  `submenuSort` tinyint(4) DEFAULT '1',
  `submenuState` char(1) NOT NULL DEFAULT 'A',
  `locale` varchar(20) DEFAULT 'zh_CN',
  PRIMARY KEY (`submenuId`),
  KEY `fk_SYS_SUBMENU_SYS_MENU1` (`sysMenuId`),
  KEY `FK_Reference_13` (`urlValue`)
) ENGINE=MyISAM AUTO_INCREMENT=81 DEFAULT CHARSET=utf8 COMMENT='最后一级子菜单';

-- ----------------------------
--  Table structure for `FeeFunction`    会鹆收费功能列表   45
-- ----------------------------
DROP TABLE IF EXISTS `FeeFunction`;
CREATE TABLE `FeeFunction` (
  `feeDetailId` int(11) NOT NULL AUTO_INCREMENT,
  `feeCategoryId` int(11) DEFAULT NULL,
  `feeType` tinyint(1) DEFAULT '0' COMMENT '0:RMB 1:美元',
  `functionType` tinyint(5) NOT NULL DEFAULT '0',
  `priceUnitId` tinyint(6) DEFAULT NULL,
  `feeDetailName` varchar(50) DEFAULT NULL,
  `fee` double DEFAULT NULL COMMENT '费用,固定费用的时候需要指定,不固定费用时不需要指定(如短信)',
  `minFee` double DEFAULT NULL COMMENT '最低收费,如短信,最低不能低于一元 ',
  `maxFee` double DEFAULT NULL COMMENT '最大费用',
  `functionName` varchar(200) DEFAULT NULL COMMENT '功能名称',
  `functionDesc` varchar(1000) DEFAULT NULL,
  `callbackName` varchar(50) DEFAULT NULL COMMENT '回调名称',
  `fixedFee` tinyint(5) NOT NULL DEFAULT '0',
  `checkParams` varchar(200) NOT NULL DEFAULT '',
  `noAuthUrl` varchar(200) NOT NULL DEFAULT '',
  `retUrl` varchar(200) NOT NULL DEFAULT '',
  `duplicate` tinyint(1) DEFAULT '0' COMMENT '0:可以重复缴费，1：不可重复缴费',
  `durationTime` int(11) DEFAULT '0' COMMENT '持续时长',
  `durationTimeUnit` tinyint(3) DEFAULT '2' COMMENT '持续时间单位1小时,2天,3年',
  `locale` varchar(20) DEFAULT 'zh_CN',
  PRIMARY KEY (`feeDetailId`),
  KEY `FK_Reference_178` (`feeCategoryId`),
  KEY `FK_Reference_180` (`priceUnitId`)
) ENGINE=MyISAM AUTO_INCREMENT=65 DEFAULT CHARSET=utf8 COMMENT=' 收费功能 ,有的需要和菜单关联';

-- ----------------------------
--  Table structure for `FeeFunctionOrder`  会鹆收费功能定单   46
-- ----------------------------
DROP TABLE IF EXISTS `FeeFunctionOrder`;
CREATE TABLE `FeeFunctionOrder` (
  `feeFunctionOrderId` bigint(20) NOT NULL AUTO_INCREMENT,
  `feeDetailId` int(11) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `payOrderId` bigint(20) DEFAULT NULL,
  `fee` double DEFAULT NULL COMMENT '需要支付的费用',
  `payStatus` tinyint(5) DEFAULT NULL COMMENT '0 未付款 1 己付款 2超时未支付 3 订单取消',
  `paramValues` varchar(500) NOT NULL DEFAULT '''',
  `orderNumber` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `orderIp` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `expireTime` datetime DEFAULT NULL,
  `orderTime` datetime DEFAULT NULL,
  PRIMARY KEY (`feeFunctionOrderId`),
  KEY `FK_Reference_179` (`feeDetailId`),
  KEY `FK_Reference_181` (`payOrderId`),
  KEY `FK_Reference_SYSLOGIN_182` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=1495 DEFAULT CHARSET=ucs2 COMMENT='收费功能订单';

-- ----------------------------
--  Table structure for `FormField`   活动表单收集项    47
-- ----------------------------
DROP TABLE IF EXISTS `FormField`;
CREATE TABLE `FormField` (
  `formFieldId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventFormId` bigint(20) DEFAULT NULL,
  `fieldId` int(11) DEFAULT NULL,
  `conditionId` bigint(20) DEFAULT NULL,
  `ticketIds` varchar(200) DEFAULT NULL,
  `required` tinyint(1) DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL,
  `maxlength` int(11) DEFAULT NULL,
  `fieldName` varchar(250) DEFAULT NULL,
  `genHtml` text,
  `showName` varchar(500) DEFAULT NULL,
  `enShowName` varchar(500) DEFAULT NULL,
  `enShowValue` text,
  `showValue` text,
  `allowDuplicate` tinyint(5) NOT NULL,
  `fieldRegexp` varchar(150) DEFAULT NULL,
  `hasSubStatus` tinyint(4) DEFAULT '0',
  `errorInfo` varchar(100) DEFAULT '""',
  `description` varchar(50) DEFAULT '""',
  `sort` int(5) NOT NULL DEFAULT '0',
  PRIMARY KEY (`formFieldId`),
  KEY `FK_Reference_109` (`eventFormId`),
  KEY `FK_Reference_110` (`fieldId`),
  KEY `conditionId` (`conditionId`)
) ENGINE=MyISAM AUTO_INCREMENT=206117 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `InvoiceNote`    发票备注    48
-- ----------------------------
DROP TABLE IF EXISTS `InvoiceNote`;
CREATE TABLE `InvoiceNote` (
  `noteId` int(11) NOT NULL AUTO_INCREMENT,
  `profileData` longtext,
  `userProfileId` bigint(20) NOT NULL,
  `createTime` datetime DEFAULT NULL,
  `updateTime` datetime DEFAULT NULL,
  PRIMARY KEY (`noteId`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=771 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `IpAddress`    ip地区对照表    49
-- ----------------------------
DROP TABLE IF EXISTS `IpAddress`;
CREATE TABLE `IpAddress` (
  `ipAddressId` int(11) NOT NULL AUTO_INCREMENT,
  `startIp` bigint(20) DEFAULT NULL,
  `endIp` bigint(20) DEFAULT NULL,
  `ipAddress` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`ipAddressId`)
) ENGINE=MyISAM AUTO_INCREMENT=438813 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Login`    注册用户主表    50
-- ----------------------------
DROP TABLE IF EXISTS `Login`;
CREATE TABLE `Login` (
  `loginId` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT '',
  `phone` varchar(15) DEFAULT '',
  `password` varchar(50) DEFAULT '',
  `salt` varchar(30) NOT NULL DEFAULT '',
  `viewName` varchar(150) DEFAULT NULL COMMENT '昵称',
  `leaderName` varchar(50) DEFAULT '',
  `lastLoginTime` datetime DEFAULT NULL,
  `lastLoginIp` varchar(50) DEFAULT '',
  `state` char(1) DEFAULT NULL,
  `vip` tinyint(4) DEFAULT '0',
  `loginRole` int(11) DEFAULT NULL,
  `locale` varchar(20) DEFAULT 'zh_CN',
  `token` varchar(100) DEFAULT NULL,
  `registerStatus` tinyint(1) DEFAULT '1' COMMENT '购买此创建者的活动门票时是否给与注册权限',
  `guideStatus` varchar(300) DEFAULT NULL,
  `publistEvent` tinyint(2) DEFAULT '0' COMMENT '0 不允许发布，需要审核 1 允许直接发布，',
  `paymentMethod` tinyint(2) DEFAULT '0',
  `authStatus` tinyint(4) DEFAULT '0',
  `managepw` varchar(50) DEFAULT NULL COMMENT '收款管理密码',
  PRIMARY KEY (`loginId`),
  KEY `username` (`username`),
  KEY `phone` (`phone`)
) ENGINE=MyISAM AUTO_INCREMENT=453282 DEFAULT CHARSET=utf8 COMMENT='登录表';

-- ----------------------------
--  Table structure for `Message`  会鹆系统消息表       51
-- ----------------------------
DROP TABLE IF EXISTS `Message`;
CREATE TABLE `Message` (
  `messageId` bigint(20) NOT NULL AUTO_INCREMENT,
  `messageSourceId` int(11) DEFAULT NULL COMMENT '消息源(目前仅有系统消息暂为空)',
  `messageSourceName` varchar(50) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL COMMENT '接收消息者',
  `messageTitle` varchar(100) DEFAULT NULL,
  `messageContent` varchar(500) DEFAULT NULL,
  `messageCategory` tinyint(4) DEFAULT NULL COMMENT '消息的大类(如:系统消息)',
  `subCategory` tinyint(4) DEFAULT NULL COMMENT '消息的小类(如:账号认证)',
  `createTime` datetime DEFAULT NULL,
  `readStatus` tinyint(4) DEFAULT NULL COMMENT '阅读状态1:已读0未读',
  PRIMARY KEY (`messageId`)
) ENGINE=MyISAM AUTO_INCREMENT=1653 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `MessagesInfo`  会鹆系统消息明细    52
-- ----------------------------
DROP TABLE IF EXISTS `MessagesInfo`;
CREATE TABLE `MessagesInfo` (
  `giId` bigint(20) NOT NULL AUTO_INCREMENT,
  `giType` tinyint(3) DEFAULT NULL COMMENT '0:互聊信息;1:更改群信息;2:邀请人员加入信息',
  `messageContent` text,
  PRIMARY KEY (`giId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='消息内容';

-- ----------------------------
--  Table structure for `MobileModuleConfig`   移动端模块配置表    53
-- ----------------------------
DROP TABLE IF EXISTS `MobileModuleConfig`;
CREATE TABLE `MobileModuleConfig` (
  `configId` int(11) NOT NULL AUTO_INCREMENT,
  `siteInfoId` int(11) DEFAULT NULL,
  `moduleId` int(11) DEFAULT NULL,
  `sort` tinyint(4) DEFAULT NULL,
  `status` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`configId`),
  KEY `FK_Reference_217` (`siteInfoId`),
  KEY `FK_Reference_218` (`moduleId`)
) ENGINE=MyISAM AUTO_INCREMENT=2876 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `MobilePageTemplate`   移动端微站模版    54
-- ----------------------------
DROP TABLE IF EXISTS `MobilePageTemplate`;
CREATE TABLE `MobilePageTemplate` (
  `mobilePageTemplateId` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `types` varchar(50) DEFAULT '',
  `content` longtext,
  `sort` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`mobilePageTemplateId`)
) ENGINE=MyISAM AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `MobileSiteMenu`   移动微站菜单模块    55
-- ----------------------------
DROP TABLE IF EXISTS `MobileSiteMenu`;
CREATE TABLE `MobileSiteMenu` (
  `mobileSiteMenuId` bigint(20) NOT NULL AUTO_INCREMENT,
  `menuBarId` bigint(20) DEFAULT NULL,
  `mobileSiteMenuItemId` bigint(20) DEFAULT NULL,
  `sort` int(11) DEFAULT NULL,
  PRIMARY KEY (`mobileSiteMenuId`),
  KEY `FK_Reference_243` (`menuBarId`),
  KEY `FK_Reference_244` (`mobileSiteMenuItemId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `MobileSiteMenuItem`   移动微站菜单项   56
-- ----------------------------
DROP TABLE IF EXISTS `MobileSiteMenuItem`;
CREATE TABLE `MobileSiteMenuItem` (
  `mobileSiteMenuItemId` bigint(20) NOT NULL AUTO_INCREMENT,
  `pageId` bigint(20) DEFAULT NULL,
  `directLink` varchar(600) DEFAULT NULL,
  `target` varchar(50) DEFAULT NULL COMMENT '??????',
  `menuType` tinyint(5) NOT NULL DEFAULT '0',
  `menuItemName` varchar(100) NOT NULL,
  `menuIcon` varchar(200) NOT NULL,
  PRIMARY KEY (`mobileSiteMenuItemId`),
  KEY `FK_Reference_242` (`pageId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `ModuleData`   微站模块数据   57
-- ----------------------------
DROP TABLE IF EXISTS `ModuleData`;
CREATE TABLE `ModuleData` (
  `moduleDataId` bigint(20) NOT NULL AUTO_INCREMENT,
  `descriptionId` bigint(20) DEFAULT NULL,
  `dataContent` text,
  `createTime` datetime DEFAULT NULL,
  `sort` int(11) DEFAULT NULL,
  `comment` tinyint(3) NOT NULL DEFAULT '0',
  `startTime` datetime DEFAULT NULL,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `endTime` datetime DEFAULT NULL,
  PRIMARY KEY (`moduleDataId`)
) ENGINE=MyISAM AUTO_INCREMENT=3570 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `ModuleDataDescription`    微站模块描述   58
-- ----------------------------
DROP TABLE IF EXISTS `ModuleDataDescription`;
CREATE TABLE `ModuleDataDescription` (
  `descriptionId` bigint(20) NOT NULL AUTO_INCREMENT,
  `moduleName` varchar(200) DEFAULT NULL,
  `moduleType` int(11) DEFAULT NULL,
  PRIMARY KEY (`descriptionId`)
) ENGINE=MyISAM AUTO_INCREMENT=6619 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `OfflinePayment`     线下支付方式表   59
-- ----------------------------
DROP TABLE IF EXISTS `OfflinePayment`;
CREATE TABLE `OfflinePayment` (
  `offlinePaymentId` bigint(20) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL,
  `bankName` varchar(100) DEFAULT NULL,
  `remittee` varchar(50) DEFAULT NULL,
  `account` varchar(30) DEFAULT NULL,
  `description` varchar(200) DEFAULT NULL,
  `fax` varchar(60) DEFAULT NULL,
  `faxRecipient` varchar(20) DEFAULT NULL,
  `swiftCode` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`offlinePaymentId`)
) ENGINE=MyISAM AUTO_INCREMENT=494 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Organizer`      主办方列表   60
-- ----------------------------
DROP TABLE IF EXISTS `Organizer`;
CREATE TABLE `Organizer` (
  `organizerId` bigint(20) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL,
  `domainId` bigint(20) DEFAULT NULL,
  `organizerName` varchar(200) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `organizerDesc` varchar(2000) DEFAULT NULL,
  `domainName` varchar(50) DEFAULT NULL,
  `weiBoSwitch` varchar(20) DEFAULT '0,0,0,0' COMMENT '活动发布,修改活动时间与地点,活动取消,活动有用户报名',
  `logoUrl` varchar(200) DEFAULT '/img/refactor2/image/banner_01.png',
  `webSiteUrl` varchar(300) DEFAULT NULL,
  `customSwitch` varchar(50) DEFAULT NULL COMMENT '指定主办方指定功能的开关',
  `tabName` varchar(50) DEFAULT NULL COMMENT '主办方聚合页签名称',
  `usedMobileLogo` tinyint(2) DEFAULT '0',
  `smsTitle` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`organizerId`),
  KEY `FK_Reference_117` (`domainId`),
  KEY `FK_Reference_188` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=69959 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `OrganizerActivity`     主办方  61
-- ----------------------------
DROP TABLE IF EXISTS `OrganizerActivity`;
CREATE TABLE `OrganizerActivity` (
  `organizerActivityId` bigint(22) NOT NULL AUTO_INCREMENT,
  `organizerId` bigint(20) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `eventId` bigint(20) DEFAULT NULL,
  `autoFlag` tinyint(5) DEFAULT NULL,
  `eventTitle` varchar(200) DEFAULT NULL,
  `subdomainName` varchar(200) DEFAULT NULL,
  `attendeeCount` int(11) DEFAULT NULL,
  `activityTime` datetime DEFAULT NULL,
  PRIMARY KEY (`organizerActivityId`),
  KEY `FK_Reference_188` (`organizerId`),
  KEY `FK_Reference_189` (`eventId`),
  KEY `FK_Reference_190` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=100119 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `OrganizerCustomInfo`  主办方自定义信息表   62
-- ----------------------------
DROP TABLE IF EXISTS `OrganizerCustomInfo`;
CREATE TABLE `OrganizerCustomInfo` (
  `customInfoId` bigint(20) NOT NULL AUTO_INCREMENT,
  `organizerId` bigint(20) DEFAULT NULL,
  `customInfoTitle` varchar(100) DEFAULT NULL,
  `customInfoContent` text,
  `createTime` datetime DEFAULT NULL,
  PRIMARY KEY (`customInfoId`),
  KEY `FK_Reference_215` (`organizerId`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `OrganizerSkin`  主办方微站皮肤   63
-- ----------------------------
DROP TABLE IF EXISTS `OrganizerSkin`;
CREATE TABLE `OrganizerSkin` (
  `organizerSkinId` bigint(20) NOT NULL AUTO_INCREMENT,
  `defaultSkinCode` int(11) DEFAULT '1',
  `organizerId` bigint(20) DEFAULT NULL,
  `skinType` tinyint(5) DEFAULT NULL COMMENT '0默认1自定义(修改设置)',
  `defaultCss` tinyint(5) DEFAULT NULL COMMENT '0初始CSS,1编辑过的CSS',
  `bgPic` varchar(200) DEFAULT NULL COMMENT '背景图片',
  `bgColor` varchar(50) DEFAULT NULL COMMENT '背景颜色',
  `titleBgPic` varchar(200) DEFAULT NULL,
  `titleBgColor` varchar(50) DEFAULT NULL,
  `titleTextColor` varchar(50) DEFAULT NULL COMMENT '标题文字颜色',
  `contentBgColor` varchar(50) DEFAULT NULL COMMENT '内容背景',
  `borderCss` varchar(500) DEFAULT NULL COMMENT '边框',
  `mainTextCss` varchar(50) DEFAULT NULL COMMENT '主文字',
  `secondTextCss` varchar(50) DEFAULT NULL COMMENT '次文字',
  `linkCss` varchar(50) DEFAULT NULL COMMENT '链接',
  `locale` varchar(20) DEFAULT NULL COMMENT 'zh_CN',
  PRIMARY KEY (`organizerSkinId`),
  KEY `FK_Reference_187` (`organizerId`)
) ENGINE=MyISAM AUTO_INCREMENT=358 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `OtherLogin`   第三方登录方式   64
-- ----------------------------
DROP TABLE IF EXISTS `OtherLogin`;
CREATE TABLE `OtherLogin` (
  `otherLoginId` bigint(20) NOT NULL AUTO_INCREMENT,
  `loginEntrance` tinyint(3) DEFAULT NULL,
  `thirdPartyId` varchar(50) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  PRIMARY KEY (`otherLoginId`)
) ENGINE=MyISAM AUTO_INCREMENT=61 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `PayOrder`    支付定单    65
-- ----------------------------
DROP TABLE IF EXISTS `PayOrder`;
CREATE TABLE `PayOrder` (
  `payOrderId` bigint(20) NOT NULL AUTO_INCREMENT,
  `paymentTypeId` tinyint(5) DEFAULT NULL,
  `payUserAccount` varchar(100) DEFAULT '' COMMENT '支付帐号名称 ',
  `payFrom` int(11) DEFAULT '1',
  `receiveAccount` varchar(100) DEFAULT NULL,
  `subject` varchar(300) DEFAULT NULL,
  `payMethod` int(5) NOT NULL DEFAULT '0' COMMENT '0 支付宝 1 银联 ',
  `orderNumber` varchar(50) DEFAULT '',
  `returnOrderNum` varchar(100) DEFAULT NULL COMMENT '支付宝交易号',
  `bankCode` varchar(20) DEFAULT NULL,
  `bankName` varchar(50) DEFAULT NULL,
  `bankSeqNum` varchar(64) DEFAULT NULL,
  `payStatus` tinyint(3) DEFAULT NULL COMMENT '0 未付款 1 己付款 2超时未支付',
  `returnUrl` varchar(1000) NOT NULL DEFAULT '""',
  `orderIpAddress` varchar(150) DEFAULT NULL,
  `totalBuyerNum` int(11) DEFAULT NULL,
  `totalPrice` double DEFAULT NULL,
  `feePrice` double NOT NULL DEFAULT '0',
  `paidPrice` double NOT NULL,
  `paidFee` double NOT NULL DEFAULT '0',
  `currencyName` varchar(10) DEFAULT '',
  `currencySign` varchar(5) DEFAULT '$',
  `orderTime` datetime DEFAULT NULL,
  `createTime` timestamp NULL DEFAULT NULL,
  `expireTime` datetime DEFAULT NULL,
  `payTime` datetime DEFAULT NULL,
  `receipt` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`payOrderId`),
  KEY `FK_Reference_114` (`paymentTypeId`)
) ENGINE=MyISAM AUTO_INCREMENT=80539 DEFAULT CHARSET=utf8 COMMENT='支付订单';

-- ----------------------------
--  Table structure for `Payment`    支付方式   66
-- ----------------------------
DROP TABLE IF EXISTS `Payment`;
CREATE TABLE `Payment` (
  `paymentId` bigint(20) NOT NULL AUTO_INCREMENT,
  `paymentTypeId` tinyint(5) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `paymentAccount` varchar(150) DEFAULT NULL,
  `additionalCode` varchar(100) DEFAULT NULL,
  `redirectUrl` varchar(50) DEFAULT NULL,
  `accountType` tinyint(3) NOT NULL DEFAULT '0',
  `mainName` varchar(50) DEFAULT NULL,
  `appSecret` varchar(50) DEFAULT NULL,
  `showUrl` varchar(50) DEFAULT NULL,
  `partnerKey` varchar(50) DEFAULT NULL,
  `partnerId` varchar(50) DEFAULT NULL,
  `defaultAccount` int(11) DEFAULT '1',
  `acceptMoneyState` tinyint(2) DEFAULT '1',
  PRIMARY KEY (`paymentId`),
  KEY `FK_Reference_104` (`paymentTypeId`),
  KEY `FK_Reference_105` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=137513 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `PaymentType`    支付方式类型   67
-- ----------------------------
DROP TABLE IF EXISTS `PaymentType`;
CREATE TABLE `PaymentType` (
  `paymentTypeId` tinyint(5) NOT NULL AUTO_INCREMENT,
  `typeName` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`paymentTypeId`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `PointDataResource`   采集点使用者资料   68
-- ----------------------------
DROP TABLE IF EXISTS `PointDataResource`;
CREATE TABLE `PointDataResource` (
  `dataResourceId` bigint(20) NOT NULL AUTO_INCREMENT,
  `pointFunctionId` bigint(20) DEFAULT NULL,
  `resourceId` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`dataResourceId`)
) ENGINE=MyISAM AUTO_INCREMENT=214 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `PointFunction` 采集点用户   69
-- ----------------------------
DROP TABLE IF EXISTS `PointFunction`;
CREATE TABLE `PointFunction` (
  `pointFunctionId` bigint(20) NOT NULL AUTO_INCREMENT,
  `collectionPointId` bigint(20) DEFAULT NULL,
  `collectionFunctionId` bigint(20) DEFAULT NULL,
  `dataWrapperId` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`pointFunctionId`)
) ENGINE=MyISAM AUTO_INCREMENT=925 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Province`    省    70
-- ----------------------------
DROP TABLE IF EXISTS `Province`;
CREATE TABLE `Province` (
  `provinceId` int(11) NOT NULL AUTO_INCREMENT,
  `provinceName` varchar(50) DEFAULT '',
  `provinceCode` varchar(20) DEFAULT NULL,
  `countryId` int(11) DEFAULT NULL,
  `countryName` varchar(50) DEFAULT '',
  `sortCode` int(5) DEFAULT NULL,
  PRIMARY KEY (`provinceId`),
  KEY `fk_PROVINCE_COUNTRY1` (`countryId`)
) ENGINE=MyISAM AUTO_INCREMENT=107 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Question`      问卷调查表   71
-- ----------------------------
DROP TABLE IF EXISTS `Question`;
CREATE TABLE `Question` (
  `questionId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `selectFieldId` int(11) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `questionTitle` varchar(500) DEFAULT NULL,
  `createTime` datetime DEFAULT NULL COMMENT '创建时间',
  `source` tinyint(2) DEFAULT NULL COMMENT '0.系统问题. 1.自定义创建',
  `questionStrObj` text,
  `state` char(2) DEFAULT NULL,
  PRIMARY KEY (`questionId`),
  KEY `FK_Reference_158` (`loginId`),
  KEY `FK_Reference_164` (`selectFieldId`)
) ENGINE=MyISAM AUTO_INCREMENT=2027 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `QuestionAnswer`   问卷答案表  72
-- ----------------------------
DROP TABLE IF EXISTS `QuestionAnswer`;
CREATE TABLE `QuestionAnswer` (
  `answerId` bigint(20) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL,
  `surveyId` bigint(20) DEFAULT NULL,
  `answerStrObj` text COMMENT '答案',
  `ipAddress` varchar(30) DEFAULT NULL,
  `createTime` datetime DEFAULT NULL,
  PRIMARY KEY (`answerId`)
) ENGINE=MyISAM AUTO_INCREMENT=17874 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `QuestionMessages`   问卷信息表   73
-- ----------------------------
DROP TABLE IF EXISTS `QuestionMessages`;
CREATE TABLE `QuestionMessages` (
  `qmId` bigint(20) NOT NULL,
  `sqId` bigint(20) DEFAULT NULL,
  `content` text,
  `qmType` tinyint(2) DEFAULT NULL COMMENT '0:参与者回答;1:嘉宾回答',
  `qmStatus` tinyint(2) DEFAULT NULL COMMENT '0:未读;1:已读',
  `createTime` datetime DEFAULT NULL,
  PRIMARY KEY (`qmId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `RaffleIitem`    抽奖奖项表    74
-- ----------------------------
DROP TABLE IF EXISTS `RaffleIitem`;
CREATE TABLE `RaffleIitem` (
  `raffleItemId` bigint(20) NOT NULL AUTO_INCREMENT,
  `lotteryId` bigint(20) DEFAULT NULL,
  `raffleTitle` varchar(200) DEFAULT NULL,
  `raffleNum` int(11) DEFAULT NULL COMMENT '次数',
  `hasNum` int(11) DEFAULT '0',
  `winningReminder` text,
  `raffleRemark` varchar(500) DEFAULT NULL COMMENT '说明',
  `rlType` tinyint(2) DEFAULT '0' COMMENT '0：正常奖项 1：空奖',
  PRIMARY KEY (`raffleItemId`),
  KEY `FK_Reference_180` (`lotteryId`)
) ENGINE=MyISAM AUTO_INCREMENT=210 DEFAULT CHARSET=utf8 COMMENT='抽奖项目';

-- ----------------------------
--  Table structure for `RechargeHistory`   充值记录表   75
-- ----------------------------
DROP TABLE IF EXISTS `RechargeHistory`;
CREATE TABLE `RechargeHistory` (
  `rechargeHistoryId` bigint(20) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `type` smallint(1) DEFAULT NULL,
  `count` int(20) DEFAULT NULL,
  `chargeTime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `RefundTicketDetail`    退票明细  76
-- ----------------------------
DROP TABLE IF EXISTS `RefundTicketDetail`;
CREATE TABLE `RefundTicketDetail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `orderId` int(11) DEFAULT NULL,
  `orderDetailId` int(11) DEFAULT NULL,
  `userProfileId` bigint(20) DEFAULT NULL,
  `ticketId` bigint(20) DEFAULT NULL,
  `price` float DEFAULT '0',
  `fee` float DEFAULT '0',
  `totalFee` double DEFAULT '0' COMMENT ' 包含服务费和网购手续费',
  `refundTime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_Reference_199` (`eventId`),
  KEY `FK_Reference_200` (`orderId`),
  KEY `FK_Reference_201` (`orderDetailId`),
  KEY `FK_Reference_202` (`userProfileId`),
  KEY `FK_Reference_203` (`ticketId`)
) ENGINE=MyISAM AUTO_INCREMENT=142256 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `RegisterField`    注册表单模版项校验列表   77
-- ----------------------------
DROP TABLE IF EXISTS `RegisterField`;
CREATE TABLE `RegisterField` (
  `fieldId` int(11) NOT NULL AUTO_INCREMENT,
  `fieldCategoryId` int(5) DEFAULT NULL,
  `fieldName` varchar(50) DEFAULT NULL,
  `showName` varchar(50) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `maxlength` int(11) DEFAULT NULL,
  `sort` int(11) DEFAULT NULL,
  `source` tinyint(2) NOT NULL DEFAULT '0',
  `fieldType` int(11) NOT NULL DEFAULT '0',
  `regexp` varchar(100) DEFAULT NULL COMMENT '验证field的内容格式的正则',
  `retain` tinyint(2) DEFAULT '1',
  `locale` varchar(20) DEFAULT 'zh_CN',
  PRIMARY KEY (`fieldId`),
  KEY `FK_Reference_107` (`fieldCategoryId`)
) ENGINE=MyISAM AUTO_INCREMENT=7896 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Resource`    资源表   78
-- ----------------------------
DROP TABLE IF EXISTS `Resource`;
CREATE TABLE `Resource` (
  `resourceId` bigint(20) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL,
  `resourceName` varchar(200) DEFAULT '',
  `accessUri` varchar(300) DEFAULT '',
  `resourceContextPath` varchar(300) DEFAULT '',
  `createTime` datetime DEFAULT NULL,
  `lastAccessTime` datetime DEFAULT NULL,
  `accessCount` int(11) DEFAULT '0',
  `state` char(1) DEFAULT 'A' COMMENT '资源状态，A资源，U己删除资源',
  `fileSize` int(11) DEFAULT '0',
  `fileType` tinyint(2) DEFAULT NULL COMMENT '文件类型，如文档，图片',
  PRIMARY KEY (`resourceId`),
  KEY `FK_Reference_43` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=114855 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SharedLinks`   分享链拉地址  79
-- ----------------------------
DROP TABLE IF EXISTS `SharedLinks`;
CREATE TABLE `SharedLinks` (
  `sharedLinkId` bigint(20) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL,
  `eventId` bigint(20) DEFAULT NULL,
  `linkName` varchar(100) DEFAULT NULL,
  `linkStr` varchar(200) DEFAULT NULL,
  `shareObject` varchar(200) DEFAULT NULL,
  `linksFlow` int(11) DEFAULT '0',
  `createTime` datetime DEFAULT NULL,
  `state` tinyint(2) DEFAULT NULL,
  PRIMARY KEY (`sharedLinkId`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `ShortMessage`        短信表  80
-- ----------------------------
DROP TABLE IF EXISTS `ShortMessage`;
CREATE TABLE `ShortMessage` (
  `shortMessageId` bigint(20) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL,
  `eventId` bigint(20) DEFAULT NULL,
  `smsRecordId` bigint(20) DEFAULT NULL,
  `messageContent` varchar(500) DEFAULT NULL,
  `receiverType` tinyint(5) DEFAULT NULL COMMENT '0 指定收件人  1 会议人员(SQL)',
  `receiver` text,
  `sendTime` datetime DEFAULT NULL,
  `createTime` datetime DEFAULT NULL,
  `messageStatus` tinyint(5) DEFAULT NULL COMMENT '0 草稿 1 等待发送 2 已经发送 3 余额不足',
  `auditStatus` tinyint(3) DEFAULT NULL COMMENT '0 使用系统模板，不需要审核 1 有改动，需要审核后发送 2 已经审核，可以发送   ',
  `messageCount` int(11) DEFAULT '0',
  `sendSource` tinyint(3) DEFAULT '0',
  `scheduleTime` datetime DEFAULT NULL,
  PRIMARY KEY (`shortMessageId`),
  KEY `FK_Reference_185` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=615730 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Site`        活动页面前台微站表   81
-- ----------------------------
DROP TABLE IF EXISTS `Site`;
CREATE TABLE `Site` (
  `siteId` bigint(20) NOT NULL AUTO_INCREMENT,
  `siteInfoId` int(11) DEFAULT NULL,
  `pageId` bigint(20) DEFAULT NULL COMMENT '???',
  `siteHeaderId` bigint(20) DEFAULT NULL,
  `siteBottomId` bigint(20) DEFAULT NULL,
  `siteLayoutId` int(11) DEFAULT NULL,
  `mobileSiteMenuId` bigint(20) DEFAULT NULL,
  `favicon` varchar(300) DEFAULT NULL,
  `styles` varchar(5000) DEFAULT NULL,
  PRIMARY KEY (`siteId`),
  KEY `FK_Reference_237` (`mobileSiteMenuId`),
  KEY `FK_Reference_238` (`siteInfoId`),
  KEY `FK_Reference_241` (`pageId`),
  KEY `FK_Reference_246` (`siteBottomId`),
  KEY `FK_Reference_247` (`siteLayoutId`)
) ENGINE=MyISAM AUTO_INCREMENT=9025 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SiteBottom`    活动页面前台微站 底部表  82
-- ----------------------------
DROP TABLE IF EXISTS `SiteBottom`;
CREATE TABLE `SiteBottom` (
  `siteBottomId` bigint(20) NOT NULL AUTO_INCREMENT,
  `content` text,
  `modifyTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`siteBottomId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SiteHeader`    活动页面前台微站 头部表    83
-- ----------------------------
DROP TABLE IF EXISTS `SiteHeader`;
CREATE TABLE `SiteHeader` (
  `siteHeaderId` bigint(20) NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `modifyTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`siteHeaderId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SiteInfo`    活动页面前台微站 主信息表     84
-- ----------------------------
DROP TABLE IF EXISTS `SiteInfo`;
CREATE TABLE `SiteInfo` (
  `siteInfoId` int(11) NOT NULL AUTO_INCREMENT,
  `skinId` int(11) DEFAULT '1',
  `skinCustomId` bigint(20) DEFAULT NULL,
  `mobileSkinId` int(11) DEFAULT '39',
  `mobileSkinCustomId` bigint(20) DEFAULT NULL,
  `bannerId` int(11) DEFAULT NULL,
  `defineSkinId` bigint(20) DEFAULT NULL,
  `templateId` int(11) DEFAULT '1',
  `mobileTemplateId` int(11) DEFAULT '3',
  `siteName` varchar(200) DEFAULT '',
  `metaContent` varchar(500) DEFAULT NULL,
  `backMetaContent` varchar(500) DEFAULT '',
  `subdomainName` varchar(50) DEFAULT '',
  `viewCount` int(11) DEFAULT '1',
  `mobileViewCount` int(11) DEFAULT '0',
  `siteFlow` int(11) DEFAULT '0',
  `logoUrl` varchar(128) DEFAULT '',
  `bannerAddress` varchar(200) DEFAULT '',
  `bannerLink` varchar(200) DEFAULT '',
  `bannerType` varchar(5) DEFAULT NULL,
  `backgroundPicType` varchar(5) DEFAULT NULL,
  `defaultSkin` char(5) DEFAULT '1',
  `mobileDefaultSkin` varchar(1) DEFAULT '1',
  `customModuleSkin` tinyint(4) DEFAULT '1',
  `mobileCustomModuleSkin` tinyint(4) DEFAULT '1',
  `createTime` datetime DEFAULT NULL,
  `analyticsCode` varchar(2000) DEFAULT 'UA-10668005-3',
  `refererUrl` varchar(200) DEFAULT NULL,
  `refererBackUrl` varchar(200) DEFAULT NULL,
  `mainDivHeight` int(5) DEFAULT '0',
  `state` char(1) DEFAULT 'A',
  `showAttentionQrImg` tinyint(2) DEFAULT '0' COMMENT '默认0:隐藏；1:显示',
  `showSiteUrlQrImg` tinyint(2) DEFAULT '0' COMMENT '默认0:隐藏；1:显示',
  `layoutStatus` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`siteInfoId`),
  KEY `templateId` (`templateId`),
  KEY `mobileTemplateId` (`mobileTemplateId`)
) ENGINE=MyISAM AUTO_INCREMENT=120369 DEFAULT CHARSET=utf8 COMMENT='eventId和eventGroupId可以任一为空,如果是eventGroupId表名是eventGroup的地址';

-- ----------------------------
--  Table structure for `SiteLayout`     活动页面前台微站 布局表  85
-- ----------------------------
DROP TABLE IF EXISTS `SiteLayout`;
CREATE TABLE `SiteLayout` (
  `siteLayoutId` int(11) NOT NULL AUTO_INCREMENT,
  `previewImg` varchar(300) DEFAULT NULL,
  `layoutContent` text,
  `replacedMacro` varchar(500) DEFAULT NULL COMMENT 'header,bottom,menubar,main  ?????',
  PRIMARY KEY (`siteLayoutId`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SiteMenuItem`   活动页面前台微站 菜单项表  86
-- ----------------------------
DROP TABLE IF EXISTS `SiteMenuItem`;
CREATE TABLE `SiteMenuItem` (
  `menuId` int(11) NOT NULL AUTO_INCREMENT,
  `siteInfoId` int(11) DEFAULT NULL,
  `templateId` int(11) DEFAULT NULL,
  `menuType` tinyint(5) DEFAULT '0',
  `menuName` varchar(50) DEFAULT '',
  `menuEnName` varchar(50) DEFAULT '',
  `changedMenuName` varchar(50) DEFAULT NULL,
  `mainPage` tinyint(3) DEFAULT NULL,
  `sort` tinyint(5) DEFAULT NULL,
  `state` char(1) DEFAULT NULL,
  `layoutStatus` tinyint(4) DEFAULT '0',
  `link` varchar(1000) DEFAULT '',
  `mobile` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`menuId`),
  KEY `FK_Reference_65` (`siteInfoId`),
  KEY `FK_Reference_68` (`templateId`)
) ENGINE=MyISAM AUTO_INCREMENT=109058 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SiteMenuModule`   活动页面前台微站 菜单模块表 87
-- ----------------------------
DROP TABLE IF EXISTS `SiteMenuModule`;
CREATE TABLE `SiteMenuModule` (
  `eventModuleId` bigint(20) NOT NULL AUTO_INCREMENT,
  `moduleId` int(11) DEFAULT NULL,
  `menuId` int(11) DEFAULT NULL,
  `siteInfoId` int(11) DEFAULT NULL,
  `view` tinyint(1) DEFAULT '1' COMMENT '0,不显示,1显示',
  `sort` tinyint(5) DEFAULT NULL,
  `moduleType` tinyint(5) DEFAULT NULL,
  `macroName` varchar(50) NOT NULL DEFAULT '',
  `macroId` int(11) DEFAULT NULL,
  `moduleName` varchar(100) DEFAULT NULL,
  `state` char(1) DEFAULT NULL,
  PRIMARY KEY (`eventModuleId`),
  KEY `FK_Reference_62` (`moduleId`),
  KEY `FK_Reference_67` (`menuId`),
  KEY `FK_Reference_64` (`siteInfoId`)
) ENGINE=MyISAM AUTO_INCREMENT=331918 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SiteMenuModuleSkin`    活动页面前台微站 菜单模块皮肤表 88
-- ----------------------------
DROP TABLE IF EXISTS `SiteMenuModuleSkin`;
CREATE TABLE `SiteMenuModuleSkin` (
  `moduleSkinId` int(11) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `siteInfoId` int(11) DEFAULT NULL,
  `eventModuleId` int(11) DEFAULT NULL,
  `templateCssCode` varchar(15) DEFAULT NULL,
  `skinId` int(11) DEFAULT NULL,
  `bgColor` varchar(15) DEFAULT NULL,
  `bgUrl` varchar(50) DEFAULT NULL,
  `bgPosition` varchar(20) DEFAULT NULL,
  `bgRepeat` varchar(20) DEFAULT NULL,
  `bgFix` varchar(10) DEFAULT NULL,
  `bgSize` varchar(10) DEFAULT NULL,
  `color` varchar(15) DEFAULT NULL,
  `iconContent` varchar(5) DEFAULT NULL,
  `iconColor` varchar(15) DEFAULT NULL,
  `titleColor` varchar(15) DEFAULT NULL,
  `titleDisplay` tinyint(4) DEFAULT '0',
  `moduleBgSet` tinyint(4) DEFAULT '0',
  `moduleColorSet` tinyint(4) DEFAULT '0',
  `iconDisplay` tinyint(4) DEFAULT '0',
  `status` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`moduleSkinId`),
  KEY `FK_Reference_198` (`eventId`),
  KEY `FK_Reference_199` (`siteInfoId`),
  KEY `FK_Reference_200` (`eventModuleId`)
) ENGINE=MyISAM AUTO_INCREMENT=2089 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SiteModule`     活动页面前台微站 模块表   89
-- ----------------------------
DROP TABLE IF EXISTS `SiteModule`;
CREATE TABLE `SiteModule` (
  `moduleId` int(11) NOT NULL AUTO_INCREMENT,
  `siteInfoId` int(11) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `descriptionId` bigint(20) DEFAULT NULL,
  `moduleName` varchar(300) DEFAULT NULL,
  `moduleIcon` varchar(100) DEFAULT NULL,
  `fmtModuleName` varchar(100) DEFAULT NULL COMMENT '国际化的key',
  `sort` tinyint(5) DEFAULT NULL,
  `moduleType` tinyint(3) DEFAULT NULL COMMENT '0,系统模块,1普通模块',
  `functionType` int(11) DEFAULT '0',
  `cssClass` varchar(30) DEFAULT NULL,
  `mobileCssClass` varchar(20) DEFAULT NULL,
  `content` longtext,
  `mobileContent` longtext,
  `createTime` datetime DEFAULT NULL,
  `templateId` int(11) DEFAULT NULL,
  `macroId` int(11) DEFAULT NULL,
  `macroName` varchar(50) DEFAULT '',
  `public` tinyint(3) DEFAULT '0' COMMENT '0 public 1 private ',
  `appType` tinyint(4) DEFAULT '1' COMMENT '0：网页和手机共用模块， 1或者null：网页模块 2： 手机模块',
  `state` char(1) DEFAULT NULL,
  `locale` varchar(20) DEFAULT 'zh_CN',
  PRIMARY KEY (`moduleId`),
  KEY `FK_Reference_66` (`siteInfoId`),
  KEY `FK_Reference_69` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=21541 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SiteTemplate`    活动页面前台微站 模板表   90
-- ----------------------------
DROP TABLE IF EXISTS `SiteTemplate`;
CREATE TABLE `SiteTemplate` (
  `templateId` int(11) NOT NULL AUTO_INCREMENT,
  `templateName` varchar(50) DEFAULT '',
  `templateFmt` varchar(100) DEFAULT NULL,
  `previewImg` varchar(100) DEFAULT NULL,
  `templateTypeId` int(11) DEFAULT NULL,
  `templateCode` varchar(50) DEFAULT NULL,
  `templateContent` text,
  `templateMobileContent` text,
  `status` tinyint(4) DEFAULT '-1',
  `customStatus` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`templateId`)
) ENGINE=MyISAM AUTO_INCREMENT=20 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Skin`      网站皮肤表  91
-- ----------------------------
DROP TABLE IF EXISTS `Skin`;
CREATE TABLE `Skin` (
  `skinId` int(11) NOT NULL AUTO_INCREMENT,
  `templateId` int(11) DEFAULT '1',
  `templateCssCode` varchar(30) DEFAULT NULL,
  `skinName` varchar(50) DEFAULT NULL,
  `skinDefaultCSS` longtext,
  `previewImg` varchar(200) DEFAULT NULL,
  `previewFileUrl` varchar(200) DEFAULT NULL,
  `bannerBgUrl` varchar(200) DEFAULT NULL,
  `bannerAlign` varchar(200) DEFAULT NULL,
  `bannerLayout` varchar(200) DEFAULT NULL,
  `bannerHeight` varchar(200) DEFAULT NULL,
  `bannerCovered` tinyint(4) DEFAULT '0',
  `bannerCoveredSub` int(11) DEFAULT NULL,
  `bannerSize` varchar(200) DEFAULT '',
  `eventTitleColor` varchar(200) DEFAULT NULL,
  `eventTitleDisplay` varchar(200) DEFAULT NULL,
  `menuOverBgColor` varchar(200) DEFAULT NULL,
  `menuOverBgImg` varchar(100) DEFAULT '',
  `menuOverColor` varchar(200) DEFAULT NULL,
  `menuOutBgColor` varchar(200) DEFAULT NULL,
  `menuOutColor` varchar(200) DEFAULT NULL,
  `menuOutHoverBgColor` varchar(30) DEFAULT '',
  `menuBgPic` varchar(200) DEFAULT NULL,
  `menuAlign` varchar(200) DEFAULT NULL,
  `menuLayout` varchar(200) DEFAULT NULL,
  `menuBgColor` varchar(200) DEFAULT NULL,
  `menuShadow` varchar(200) DEFAULT NULL,
  `moduleBgUrl` varchar(200) DEFAULT NULL,
  `moduleAlign` varchar(200) DEFAULT NULL,
  `moduleLayout` varchar(200) DEFAULT NULL,
  `moduleBgColor` varchar(200) DEFAULT NULL,
  `moduleTitleBgUrl` varchar(200) DEFAULT NULL,
  `moduleTitleAlign` varchar(200) DEFAULT NULL,
  `moduleTitleLayout` varchar(200) DEFAULT NULL,
  `moduleTitleBgColor` varchar(200) DEFAULT NULL,
  `showModuleBorder` varchar(200) DEFAULT NULL,
  `moduleSkinBorderColor` varchar(200) DEFAULT NULL,
  `moduleTitleColor` varchar(200) DEFAULT NULL,
  `mainLinkColor` varchar(200) DEFAULT NULL,
  `mainTextColor` varchar(200) DEFAULT NULL,
  `subsidiaryColor` varchar(200) DEFAULT NULL,
  `subsidiaryBgColor` varchar(200) DEFAULT NULL,
  `subsidiaryBorderColor` varchar(200) DEFAULT NULL,
  `bodyBgUrl` varchar(200) DEFAULT NULL,
  `bodyAlign` varchar(200) DEFAULT NULL,
  `bodyLayout` varchar(200) DEFAULT NULL,
  `bodyScoll` varchar(200) DEFAULT NULL,
  `bodyBgColor` varchar(200) DEFAULT NULL,
  `contentMainBgColor` varchar(200) DEFAULT NULL,
  `contentMainBgImg` varchar(100) DEFAULT '',
  `contentMainBorderColor` varchar(200) DEFAULT NULL,
  `radius` varchar(1000) DEFAULT NULL,
  `pageBackGroundStyle` varchar(1000) DEFAULT NULL,
  `bannerId` int(11) DEFAULT '1',
  `buttonRadiusSize` int(11) DEFAULT '0',
  `buttonAlignSize` varchar(30) DEFAULT '-36',
  `buttonTitleColor` varchar(10) DEFAULT '#ffffff',
  `buttonBgColor` varchar(10) DEFAULT '',
  `buttonBgImg` varchar(200) DEFAULT '',
  `buttonOverColor` varchar(15) DEFAULT '',
  `locale` varchar(20) DEFAULT 'zh_CN',
  `defaultStatus` tinyint(4) DEFAULT '0' COMMENT '0:非默认， 1： 默认',
  `paymentStatus` tinyint(4) DEFAULT '0',
  `paymentFunctionCode` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`skinId`),
  UNIQUE KEY `skinId` (`skinId`)
) ENGINE=MyISAM AUTO_INCREMENT=45 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SkinCustom`      自定义皮肤  92
-- ----------------------------
DROP TABLE IF EXISTS `SkinCustom`;
CREATE TABLE `SkinCustom` (
  `skinCustomId` bigint(20) NOT NULL AUTO_INCREMENT,
  `skinId` int(11) DEFAULT NULL,
  `bannerBgUrl` varchar(200) DEFAULT NULL,
  `bannerAlign` varchar(200) DEFAULT NULL,
  `bannerLayout` varchar(200) DEFAULT NULL,
  `bannerHeight` varchar(200) DEFAULT NULL,
  `bannerSize` varchar(200) DEFAULT '',
  `eventTitleColor` varchar(200) DEFAULT NULL,
  `eventTitleDisplay` varchar(200) DEFAULT NULL,
  `menuOverBgColor` varchar(200) DEFAULT NULL,
  `menuOverBgImg` varchar(100) DEFAULT '',
  `menuOverColor` varchar(200) DEFAULT NULL,
  `menuOutBgColor` varchar(200) DEFAULT NULL,
  `menuOutColor` varchar(200) DEFAULT NULL,
  `menuOutHoverBgColor` varchar(30) DEFAULT '',
  `menuBgPic` varchar(200) DEFAULT NULL,
  `menuAlign` varchar(200) DEFAULT NULL,
  `menuLayout` varchar(200) DEFAULT NULL,
  `menuBgColor` varchar(200) DEFAULT NULL,
  `menuShadow` varchar(200) DEFAULT NULL,
  `moduleBgUrl` varchar(200) DEFAULT NULL,
  `moduleAlign` varchar(200) DEFAULT NULL,
  `moduleLayout` varchar(200) DEFAULT NULL,
  `moduleBgColor` varchar(200) DEFAULT NULL,
  `moduleTitleBgUrl` varchar(200) DEFAULT NULL,
  `moduleTitleAlign` varchar(200) DEFAULT NULL,
  `moduleTitleLayout` varchar(200) DEFAULT NULL,
  `moduleTitleBgColor` varchar(200) DEFAULT NULL,
  `showModuleBorder` varchar(200) DEFAULT NULL,
  `moduleSkinBorderColor` varchar(200) DEFAULT NULL,
  `moduleTitleColor` varchar(200) DEFAULT NULL,
  `mainLinkColor` varchar(200) DEFAULT NULL,
  `mainTextColor` varchar(200) DEFAULT NULL,
  `subsidiaryColor` varchar(200) DEFAULT NULL,
  `subsidiaryBgColor` varchar(200) DEFAULT NULL,
  `subsidiaryBorderColor` varchar(200) DEFAULT NULL,
  `bodyBgUrl` varchar(200) DEFAULT NULL,
  `bodyAlign` varchar(200) DEFAULT NULL,
  `bodyLayout` varchar(200) DEFAULT NULL,
  `bodyScoll` varchar(200) DEFAULT NULL,
  `bodyBgColor` varchar(200) DEFAULT NULL,
  `contentMainBgColor` varchar(200) DEFAULT NULL,
  `contentMainBgImg` varchar(100) DEFAULT '',
  `contentMainBorderColor` varchar(200) DEFAULT NULL,
  `radius` varchar(1000) DEFAULT NULL,
  `pageBackGroundStyle` varchar(1000) DEFAULT NULL,
  `customButtonStyle` tinyint(2) DEFAULT '0',
  `buttonBgType` tinyint(3) DEFAULT '0',
  `buttonBgColor` varchar(50) DEFAULT '#3bad00',
  `showButtonBglight` tinyint(2) DEFAULT '0',
  `buttonBgImg` varchar(200) DEFAULT '/img/refactor2/image/default_join_btn_a.png',
  `buttonOverColor` varchar(15) DEFAULT '',
  `buttonTitleColor` varchar(50) DEFAULT '#FFFFFF',
  `buttonBorderColor` varchar(50) DEFAULT '#d7e6d3',
  `showButtonBoder` tinyint(2) DEFAULT '0',
  `buttonRadiusSize` int(11) DEFAULT '20',
  PRIMARY KEY (`skinCustomId`)
) ENGINE=MyISAM AUTO_INCREMENT=21530 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SkinTemplate`     网站皮肤模版   93
-- ----------------------------
DROP TABLE IF EXISTS `SkinTemplate`;
CREATE TABLE `SkinTemplate` (
  `skinTemplateId` bigint(20) NOT NULL AUTO_INCREMENT,
  `skinTemplateCode` varchar(50) DEFAULT NULL,
  `skinName` varchar(50) DEFAULT NULL,
  `previewIcon` varchar(200) DEFAULT NULL,
  `previewImage` varchar(200) DEFAULT NULL,
  `skinPath` varchar(200) DEFAULT NULL,
  `skinTemplate` text,
  `properties` varchar(2000) DEFAULT NULL,
  `useType` tinyint(10) DEFAULT NULL,
  `locale` varchar(10) DEFAULT 'zh_CN',
  `state` char(4) DEFAULT NULL,
  PRIMARY KEY (`skinTemplateId`)
) ENGINE=MyISAM AUTO_INCREMENT=23 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SmsBlackList`    短信黑字典   94
-- ----------------------------
DROP TABLE IF EXISTS `SmsBlackList`;
CREATE TABLE `SmsBlackList` (
  `blId` int(11) NOT NULL AUTO_INCREMENT,
  `blName` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`blId`)
) ENGINE=MyISAM AUTO_INCREMENT=3418 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `SmsSecurityCode`       短信验证码   95
-- ----------------------------
DROP TABLE IF EXISTS `SmsSecurityCode`;
CREATE TABLE `SmsSecurityCode` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `type` enum('sign_up','bind_phone','reset_pwd') DEFAULT NULL,
  `mobileNumber` varchar(20) DEFAULT '',
  `code` varchar(6) DEFAULT NULL,
  `createTime` datetime DEFAULT NULL,
  `expireTime` datetime DEFAULT NULL,
  `used` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5738254 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Speaker`    演讲嘉宾表   96
-- ----------------------------
DROP TABLE IF EXISTS `Speaker`;
CREATE TABLE `Speaker` (
  `speakerId` int(11) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL,
  `ownerId` int(11) DEFAULT NULL,
  `contactId` bigint(20) DEFAULT NULL,
  `createTime` datetime DEFAULT NULL,
  `updateTime` datetime DEFAULT NULL,
  `remark` varchar(500) DEFAULT NULL,
  `moduleDataId` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`speakerId`),
  KEY `FK_Reference_201` (`loginId`),
  KEY `FK_Reference_225` (`contactId`)
) ENGINE=MyISAM AUTO_INCREMENT=6581 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `State`   美国地区表     97
-- ----------------------------
DROP TABLE IF EXISTS `State`;
CREATE TABLE `State` (
  `stateId` int(11) NOT NULL AUTO_INCREMENT,
  `countryRegionId` smallint(5) NOT NULL,
  `name` varchar(30) NOT NULL,
  `enName` varchar(100) NOT NULL,
  `countryRegionName` varchar(30) NOT NULL,
  `countryRegionEnName` varchar(100) NOT NULL,
  PRIMARY KEY (`stateId`),
  KEY `FK_Reference_220` (`countryRegionId`)
) ENGINE=MyISAM AUTO_INCREMENT=2776 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `Subdomains`       活动微站二级域名表   98
-- ----------------------------
DROP TABLE IF EXISTS `Subdomains`;
CREATE TABLE `Subdomains` (
  `domainId` bigint(20) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL COMMENT '域名拥有者',
  `subdomainName` varchar(50) DEFAULT '',
  `domainType` tinyint(5) DEFAULT '1' COMMENT '域名类型,0系统域名1普通域名',
  `state` char(1) DEFAULT 'A' COMMENT 'Default is ''A'',delete status is ''U''',
  `reserve` tinyint(2) DEFAULT '0',
  PRIMARY KEY (`domainId`),
  KEY `FK_Reference_16` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=28498 DEFAULT CHARSET=utf8 COMMENT='二级域名';

-- ----------------------------
--  Table structure for `Ticket`     活动票（主表）    99
-- ----------------------------
DROP TABLE IF EXISTS `Ticket`;
CREATE TABLE `Ticket` (
  `ticketId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `ticketName` varchar(200) DEFAULT NULL,
  `eventTitle` varchar(200) DEFAULT NULL,
  `notifyChanel` tinyint(3) DEFAULT NULL COMMENT '0:email 1:SMS 2:纸质信件',
  `ticketCount` int(11) NOT NULL,
  `ticketAvailableCount` int(10) DEFAULT NULL,
  `orderTicketCount` int(11) DEFAULT '0',
  `selledTicketCount` int(11) DEFAULT '0',
  `price` double DEFAULT NULL,
  `fee` double DEFAULT NULL,
  `feeShowType` tinyint(2) DEFAULT NULL,
  `priceSign` varchar(10) DEFAULT '$',
  `priceUnit` varchar(10) DEFAULT '',
  `income` double DEFAULT '0',
  `timeWay` tinyint(2) DEFAULT '1',
  `startSalesTime` datetime DEFAULT NULL,
  `endSalesTime` datetime DEFAULT NULL,
  `modifyTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `minCountPerOrder` int(5) DEFAULT NULL COMMENT '一次可购买数',
  `maxCountPerOrder` int(5) DEFAULT NULL COMMENT '一次可最大购买数',
  `ticketDescription` text,
  `ticketBottomExplain` varchar(5000) DEFAULT NULL,
  `ticketTopExplain` varchar(5000) DEFAULT NULL,
  `ticketStatus` int(5) NOT NULL,
  `state` char(1) DEFAULT NULL,
  `needAudit` tinyint(5) DEFAULT '0',
  `purchaseLimit` tinyint(1) DEFAULT '0',
  `sort` int(11) DEFAULT '0',
  `ticketFreeState` tinyint(2) DEFAULT '1',
  `showStatus` tinyint(4) DEFAULT '0' COMMENT '在自定义网站中显示： 0-显示 ； 1-隐藏',
  `disStatus` tinyint(2) DEFAULT '0' COMMENT '是否开启满足购票数量后。自动打折功能. 默认0：不开启；1：开启',
  `disStartNum` int(11) DEFAULT '3' COMMENT '打折满足的最小数量',
  `disType` tinyint(2) DEFAULT '0' COMMENT '打折的方式  默认0：金额，1：打折',
  `disPrice` double DEFAULT NULL COMMENT '金额',
  `disPercentage` double DEFAULT NULL COMMENT '折扣',
  PRIMARY KEY (`ticketId`),
  KEY `FK_Reference_91` (`eventId`)
) ENGINE=MyISAM AUTO_INCREMENT=47459 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `TicketApplyKey`    活动票锁定临时表   100
-- ----------------------------
DROP TABLE IF EXISTS `TicketApplyKey`;
CREATE TABLE `TicketApplyKey` (
  `ticketApplyKeyId` int(11) NOT NULL AUTO_INCREMENT,
  `orderNumber` varchar(50) NOT NULL,
  `applyTime` datetime DEFAULT NULL,
  `expireTime` datetime DEFAULT NULL,
  `locked` tinyint(3) DEFAULT NULL,
  PRIMARY KEY (`ticketApplyKeyId`),
  KEY `TicketApplyKey_idx_id` (`ticketApplyKeyId`)
) ENGINE=MyISAM AUTO_INCREMENT=1394616 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `TicketExplain`    自定义门票样式表    101
-- ----------------------------
DROP TABLE IF EXISTS `TicketExplain`;
CREATE TABLE `TicketExplain` (
  `ticketExplainId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `content` longtext,
  `createTime` datetime DEFAULT NULL,
  `templateId` bigint(20) DEFAULT NULL,
  `headerContent` text,
  `ticketBodyContent` text,
  `customLogo` varchar(200) DEFAULT NULL,
  `customLogoStyle` varchar(50) DEFAULT '',
  PRIMARY KEY (`ticketExplainId`)
) ENGINE=MyISAM AUTO_INCREMENT=10401 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `TicketInvoiceFormField`   票所开发票表单字段表   102
-- ----------------------------
DROP TABLE IF EXISTS `TicketInvoiceFormField`;
CREATE TABLE `TicketInvoiceFormField` (
  `ticketInvoiceFormFieldId` bigint(20) NOT NULL AUTO_INCREMENT,
  `ticketInvoiceRegFormId` bigint(20) DEFAULT NULL,
  `ticketInvoiceRegisterFieldId` int(11) DEFAULT NULL,
  `required` tinyint(1) DEFAULT NULL,
  `maxlength` int(11) DEFAULT NULL,
  `fieldName` varchar(200) DEFAULT NULL,
  `genHtml` text,
  `showName` varchar(500) DEFAULT NULL,
  `enShowName` varchar(500) DEFAULT '""',
  `enShowValue` text,
  `showValue` text,
  `errorInfo` varchar(200) DEFAULT NULL,
  `description` varchar(100) DEFAULT NULL,
  `sort` int(5) DEFAULT '0',
  PRIMARY KEY (`ticketInvoiceFormFieldId`)
) ENGINE=MyISAM AUTO_INCREMENT=54452 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `TicketInvoiceRegForm`   票所开发票注册表单   103
-- ----------------------------
DROP TABLE IF EXISTS `TicketInvoiceRegForm`;
CREATE TABLE `TicketInvoiceRegForm` (
  `ticketInvoiceRegFormId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `formName` varchar(100) DEFAULT NULL,
  `timeLimit` int(5) DEFAULT NULL,
  `invoiceEndMessage` varchar(300) DEFAULT NULL,
  `formType` tinyint(3) DEFAULT NULL,
  PRIMARY KEY (`ticketInvoiceRegFormId`)
) ENGINE=MyISAM AUTO_INCREMENT=21894 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `TicketInvoiceRegisterField`   票所开发票注册表各单字段验证表   104
-- ----------------------------
DROP TABLE IF EXISTS `TicketInvoiceRegisterField`;
CREATE TABLE `TicketInvoiceRegisterField` (
  `ticketInvoiceRegisterFieldId` int(11) NOT NULL AUTO_INCREMENT,
  `fieldCategoryId` int(5) DEFAULT NULL,
  `fieldName` varchar(50) DEFAULT NULL,
  `showName` varchar(50) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `maxlength` int(11) DEFAULT NULL,
  `sort` int(11) DEFAULT NULL,
  `source` tinyint(2) NOT NULL DEFAULT '0',
  `fieldType` int(11) NOT NULL DEFAULT '0',
  `regexp` varchar(100) DEFAULT NULL COMMENT '验证field的内容格式的正则',
  `locale` varchar(20) DEFAULT 'zh_CN',
  PRIMARY KEY (`ticketInvoiceRegisterFieldId`),
  KEY `FK_Reference_107` (`fieldCategoryId`)
) ENGINE=MyISAM AUTO_INCREMENT=32 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `TicketOrder`       定单表（主表）   105
-- ----------------------------
DROP TABLE IF EXISTS `TicketOrder`;
CREATE TABLE `TicketOrder` (
  `orderId` int(11) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `payOrderId` bigint(20) DEFAULT NULL,
  `ticketNo` varchar(50) DEFAULT NULL,
  `orderNumber` varchar(50) DEFAULT NULL COMMENT '订单号',
  `totalBuyerNum` int(11) DEFAULT NULL,
  `releasedTicket` tinyint(3) NOT NULL DEFAULT '0',
  `attendeeTicket` tinyint(3) NOT NULL DEFAULT '0',
  `memberTicketCount` int(11) NOT NULL DEFAULT '0',
  `totalPrice` double DEFAULT NULL,
  `totalFee` double NOT NULL,
  `chargeFee` double NOT NULL,
  `buyerSource` tinyint(3) NOT NULL DEFAULT '0',
  `currencyName` varchar(10) DEFAULT '',
  `currencySign` varchar(5) DEFAULT '$',
  `firstName` varchar(70) DEFAULT NULL,
  `lastName` varchar(70) DEFAULT NULL,
  `pdataUserName` varchar(130) DEFAULT NULL COMMENT '用户资料姓名',
  `pdataUserMail` varchar(100) DEFAULT '',
  `uid` varchar(50) DEFAULT NULL,
  `orderTime` datetime DEFAULT NULL,
  `payStatus` tinyint(3) DEFAULT NULL,
  `payWay` int(11) DEFAULT '2',
  `regWay` tinyint(2) DEFAULT '0' COMMENT '0.本人添加[默认],1.活动组办方添加',
  `orderIp` varchar(150) DEFAULT NULL,
  `sessionId` varchar(50) DEFAULT NULL,
  `cpsFee` double DEFAULT '0',
  `discountId` bigint(20) DEFAULT NULL,
  `rawTotalPrice` double DEFAULT '0',
  `cellphone` varchar(30) DEFAULT '',
  `validTicketNum` int(11) DEFAULT '0',
  `profileDatas` longtext COMMENT '备注信息',
  `modifyTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `locale` varchar(10) DEFAULT '',
  `orderState` tinyint(2) NOT NULL DEFAULT '0' COMMENT '定单状态  0：默认， 1. 删除',
  PRIMARY KEY (`orderId`),
  KEY `FK_Reference_71` (`eventId`),
  KEY `FK_Reference_93` (`loginId`),
  KEY `FK_Reference_115` (`payOrderId`),
  KEY `pdataUserMail` (`pdataUserMail`)
) ENGINE=MyISAM AUTO_INCREMENT=1095516 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `TicketOrderDetail`      定单详情表   106
-- ----------------------------
DROP TABLE IF EXISTS `TicketOrderDetail`;
CREATE TABLE `TicketOrderDetail` (
  `orderDetailId` int(11) NOT NULL AUTO_INCREMENT,
  `ticketId` bigint(20) DEFAULT NULL,
  `orderId` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `memberTicket` int(11) NOT NULL DEFAULT '0',
  `totalPrice` double DEFAULT NULL,
  `totalFee` double NOT NULL DEFAULT '0',
  `priceUnit` varchar(10) DEFAULT '',
  `priceSign` varchar(5) DEFAULT '$',
  `cpsFee` double NOT NULL DEFAULT '0',
  `discountId` bigint(20) DEFAULT NULL,
  `discountFee` double DEFAULT '0',
  `rawTotalPrice` double DEFAULT '0',
  `auditQuantity` int(11) DEFAULT '0',
  `ticketDisFee` double DEFAULT '0' COMMENT '达到一定数量票价优惠的费用',
  PRIMARY KEY (`orderDetailId`),
  KEY `FK_Reference_70` (`ticketId`),
  KEY `FK_Reference_90` (`orderId`)
) ENGINE=MyISAM AUTO_INCREMENT=1170227 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `TicketOrderFormField`     定单采集字段表    107
-- ----------------------------
DROP TABLE IF EXISTS `TicketOrderFormField`;
CREATE TABLE `TicketOrderFormField` (
  `ticketOrderFormFieldId` bigint(20) NOT NULL AUTO_INCREMENT,
  `ticketOrderRegFormId` bigint(20) DEFAULT NULL,
  `ticketOrderRegisterFieldId` int(11) DEFAULT NULL,
  `required` tinyint(1) DEFAULT NULL,
  `maxlength` int(11) DEFAULT NULL,
  `fieldName` varchar(200) DEFAULT NULL,
  `genHtml` text,
  `showName` varchar(500) DEFAULT NULL,
  `enShowName` varchar(500) DEFAULT '""',
  `enShowValue` text,
  `showValue` text,
  `errorInfo` varchar(200) DEFAULT NULL,
  `description` varchar(100) DEFAULT NULL,
  `sort` int(5) DEFAULT '0',
  `fieldType` tinyint(2) DEFAULT '0' COMMENT '0:订单的备注,1:参会人员备注,2发票的备注',
  PRIMARY KEY (`ticketOrderFormFieldId`)
) ENGINE=MyISAM AUTO_INCREMENT=44926 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `TicketOrderRegForm`     定单注册表单   108
-- ----------------------------
DROP TABLE IF EXISTS `TicketOrderRegForm`;
CREATE TABLE `TicketOrderRegForm` (
  `ticketOrderRegFormId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `formName` varchar(100) DEFAULT NULL,
  `timeLimit` int(5) DEFAULT NULL,
  `orderEndMessage` varchar(300) DEFAULT NULL,
  `formType` tinyint(3) DEFAULT NULL,
  PRIMARY KEY (`ticketOrderRegFormId`)
) ENGINE=MyISAM AUTO_INCREMENT=22391 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `TicketOrderRegisterField`   定单注册表各单字段验证表   109
-- ----------------------------
DROP TABLE IF EXISTS `TicketOrderRegisterField`;
CREATE TABLE `TicketOrderRegisterField` (
  `ticketOrderRegisterFieldId` int(11) NOT NULL AUTO_INCREMENT,
  `fieldCategoryId` int(5) DEFAULT NULL,
  `fieldName` varchar(50) DEFAULT NULL,
  `showName` varchar(50) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `maxlength` int(11) DEFAULT NULL,
  `sort` int(11) DEFAULT NULL,
  `source` tinyint(2) NOT NULL DEFAULT '0',
  `fieldType` int(11) NOT NULL DEFAULT '0',
  `regexp` varchar(100) DEFAULT NULL COMMENT '验证field的内容格式的正则',
  `locale` varchar(20) DEFAULT 'zh_CN',
  `functionType` tinyint(2) DEFAULT '0' COMMENT '0:自定义表单的field,1:订单备注默认field,2:活动人员备注默认field',
  PRIMARY KEY (`ticketOrderRegisterFieldId`),
  KEY `FK_Reference_107` (`fieldCategoryId`)
) ENGINE=MyISAM AUTO_INCREMENT=31 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `TicketPurchaseLimit`     活票定购限制     110
-- ----------------------------
DROP TABLE IF EXISTS `TicketPurchaseLimit`;
CREATE TABLE `TicketPurchaseLimit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticketId` bigint(20) DEFAULT NULL,
  `parentTicketId` bigint(20) DEFAULT NULL,
  `eventId` bigint(20) NOT NULL,
  `buyNumber` int(11) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `FK_Reference_200` (`ticketId`),
  KEY `FK_Reference_201` (`parentTicketId`)
) ENGINE=MyISAM AUTO_INCREMENT=529 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `TrackCode`    追踪码    111
-- ----------------------------
DROP TABLE IF EXISTS `TrackCode`;
CREATE TABLE `TrackCode` (
  `trackCodeId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `userId` bigint(20) DEFAULT NULL,
  `trackCode` varchar(100) NOT NULL,
  `description` varchar(300) DEFAULT NULL,
  `trackCodeType` tinyint(5) DEFAULT NULL COMMENT '1. 活动\r\n            2. GROUP\r\n            3. Other 不关联，仅链接效果',
  `createTime` datetime DEFAULT NULL,
  `updateTime` datetime DEFAULT NULL,
  `clickCount` int(11) DEFAULT '0',
  `reserve` tinyint(2) DEFAULT '1' COMMENT '0：活动保留; 1:普通',
  `bindType` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`trackCodeId`),
  KEY `FK_Reference_248` (`eventId`),
  KEY `FK_Reference_249` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=55210 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `UserFlux`     用户短信邮件余量表      112
-- ----------------------------
DROP TABLE IF EXISTS `UserFlux`;
CREATE TABLE `UserFlux` (
  `userFluxId` bigint(20) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL,
  `deviceType` tinyint(3) DEFAULT NULL,
  `usedCount` int(11) DEFAULT '0',
  `leftCount` int(11) DEFAULT '0' COMMENT '限制使用次数',
  `emailUsedCount` int(11) DEFAULT '0',
  `emailLeftCount` int(11) DEFAULT '0',
  PRIMARY KEY (`userFluxId`),
  KEY `FK_Reference_174` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=27175 DEFAULT CHARSET=utf8 COMMENT='用户限量使用情况leftCount是用户使用的发送方式,如果是0的话,表示不限制 短消息余额';

-- ----------------------------
--  Table structure for `WebSiteInBox`        站内消息     113
-- ----------------------------
DROP TABLE IF EXISTS `WebSiteInBox`;
CREATE TABLE `WebSiteInBox` (
  `webSiteInboxId` bigint(20) NOT NULL AUTO_INCREMENT,
  `webSiteOutBoxId` bigint(20) DEFAULT NULL,
  `eventMessageId` int(11) DEFAULT NULL,
  `loginId` int(11) DEFAULT NULL,
  `fromLoginId` int(11) DEFAULT NULL,
  `receiverUserName` varchar(50) DEFAULT NULL,
  `senderUserName` varchar(50) DEFAULT NULL,
  `inboxTitle` varchar(200) DEFAULT NULL,
  `inboxContent` text,
  `inboxTime` timestamp NULL DEFAULT NULL,
  `messageType` tinyint(2) DEFAULT '1' COMMENT '0系统消息 1.站内信',
  `systemType` tinyint(2) DEFAULT '0' COMMENT '0.默认 1.活动 2.群组',
  `intboxState` tinyint(2) DEFAULT '0',
  `checkRead` tinyint(2) DEFAULT '0',
  `deleteStatus` varchar(30) DEFAULT '',
  `deleteDesc` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`webSiteInboxId`),
  KEY `eventMessageId` (`eventMessageId`),
  KEY `loginId` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=17902 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `WebSiteOutBox`      站内消息发件箱    114
-- ----------------------------
DROP TABLE IF EXISTS `WebSiteOutBox`;
CREATE TABLE `WebSiteOutBox` (
  `webSiteOutBoxId` bigint(20) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL,
  `outboxTitle` varchar(200) DEFAULT NULL,
  `outboxContent` varchar(500) DEFAULT NULL,
  `outboxTime` datetime DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `toUserStr` varchar(1000) DEFAULT NULL,
  `outboxState` tinyint(2) DEFAULT '0',
  PRIMARY KEY (`webSiteOutBoxId`)
) ENGINE=MyISAM AUTO_INCREMENT=156 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `WeiXinAttendeeInfo`     微信参会人信息表   115
-- ----------------------------
DROP TABLE IF EXISTS `WeiXinAttendeeInfo`;
CREATE TABLE `WeiXinAttendeeInfo` (
  `weiXinAttendeeInfoId` bigint(20) NOT NULL AUTO_INCREMENT,
  `eventId` bigint(20) DEFAULT NULL,
  `userProfileId` bigint(20) DEFAULT NULL,
  `sceneId` bigint(20) DEFAULT NULL,
  `token` varchar(60) DEFAULT NULL,
  `tempPassword` varchar(10) DEFAULT '',
  `avatar` varchar(500) DEFAULT '',
  `status` tinyint(4) DEFAULT '0',
  `createTime` datetime DEFAULT NULL,
  `expireTime` datetime DEFAULT NULL,
  PRIMARY KEY (`weiXinAttendeeInfoId`),
  KEY `FK_Reference_204` (`eventId`),
  KEY `FK_Reference_205` (`userProfileId`),
  KEY `FK_Reference_209` (`sceneId`),
  KEY `token` (`token`)
) ENGINE=MyISAM AUTO_INCREMENT=484563 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `WeiXinInfo`      微信用户信息表    116
-- ----------------------------
DROP TABLE IF EXISTS `WeiXinInfo`;
CREATE TABLE `WeiXinInfo` (
  `weiXinId` int(11) NOT NULL AUTO_INCREMENT,
  `loginId` int(11) DEFAULT NULL,
  `matchOrganizerIds` varchar(200) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `number` varchar(50) DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `qrCodeUrl` varchar(50) DEFAULT '',
  `weiXinUUID` varchar(50) DEFAULT NULL,
  `token` varchar(15) DEFAULT NULL,
  `attentionMessage` varchar(2048) DEFAULT NULL,
  `defaultMessage` varchar(2048) DEFAULT NULL,
  `appId` varchar(50) DEFAULT NULL,
  `appSecret` varchar(50) DEFAULT NULL,
  `accessToken` varchar(600) DEFAULT NULL,
  `jsapiTicket` varchar(200) DEFAULT '',
  `expireTime` timestamp NULL DEFAULT NULL,
  `createTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` varchar(2) DEFAULT NULL,
  `systemStatus` tinyint(4) DEFAULT NULL COMMENT '1：会鸽的app，获取活动时没有限制 0：用户app',
  `openCustomMenu` tinyint(4) DEFAULT '0',
  `openAdvance` tinyint(4) DEFAULT '0',
  `bindStatus` tinyint(4) DEFAULT NULL,
  `serviceCheck` datetime DEFAULT NULL,
  `serviceType` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`weiXinId`),
  KEY `FK_Reference_160` (`loginId`)
) ENGINE=MyISAM AUTO_INCREMENT=258 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `WeiXinMenu`     当前服务类型    117
-- ----------------------------
DROP TABLE IF EXISTS `WeiXinMenu`;
CREATE TABLE `WeiXinMenu` (
  `menuId` bigint(20) NOT NULL AUTO_INCREMENT,
  `weiXinId` int(11) DEFAULT NULL,
  `wallId` bigint(20) DEFAULT NULL,
  `serviceType` tinyint(4) DEFAULT NULL,
  `mainMenu` tinyint(4) DEFAULT NULL COMMENT '0：非主菜单，1：主菜单',
  PRIMARY KEY (`menuId`),
  KEY `FK_Reference_190` (`weiXinId`),
  KEY `FK_Reference_196` (`wallId`)
) ENGINE=MyISAM AUTO_INCREMENT=52 DEFAULT CHARSET=utf8 COMMENT='当前服务类型（如主菜单，微信墙，默认为主菜单）';
INCREMENT=68 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `WeiXinUser`     微信用户    118
-- ----------------------------
DROP TABLE IF EXISTS `WeiXinUser`;
CREATE TABLE `WeiXinUser` (
  `userId` bigint(20) NOT NULL AUTO_INCREMENT,
  `openId` varchar(100) DEFAULT NULL,
  `weiXinId` int(11) DEFAULT NULL,
  `menuId` bigint(20) DEFAULT NULL,
  `subscribe` tinyint(4) DEFAULT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `sex` tinyint(4) DEFAULT NULL,
  `city` varchar(20) DEFAULT NULL,
  `country` varchar(20) DEFAULT NULL,
  `province` varchar(20) DEFAULT NULL,
  `language` varchar(20) DEFAULT NULL,
  `headimgurl` varchar(500) DEFAULT NULL,
  `qqimgurl` varchar(500) DEFAULT NULL,
  `guideStatus` varchar(500) DEFAULT NULL,
  `subscribeTime` timestamp NULL DEFAULT NULL,
  `replyTime` timestamp NULL DEFAULT NULL,
  `updateTime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`userId`),
  KEY `FK_Reference_187` (`weiXinId`),
  KEY `FK_Reference_191` (`menuId`)
) ENGINE=MyISAM AUTO_INCREMENT=154320 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `WeiXinUserAttendee`    微信参会者列表    119
-- ----------------------------
DROP TABLE IF EXISTS `WeiXinUserAttendee`;
CREATE TABLE `WeiXinUserAttendee` (
  `weiXinUserAttendeeId` bigint(20) NOT NULL AUTO_INCREMENT,
  `weiXinAttendeeInfoId` bigint(20) DEFAULT NULL,
  `emailAddress` varchar(50) DEFAULT '',
  `userId` bigint(20) DEFAULT NULL,
  `openId` varchar(100) DEFAULT NULL,
  `createTime` datetime DEFAULT NULL,
  `updateTime` datetime DEFAULT NULL,
  PRIMARY KEY (`weiXinUserAttendeeId`),
  KEY `FK_Reference_207` (`weiXinAttendeeInfoId`),
  KEY `FK_Reference_206` (`userId`)
) ENGINE=MyISAM AUTO_INCREMENT=120293 DEFAULT CHARSET=utf8;


SET FOREIGN_KEY_CHECKS = 1;
