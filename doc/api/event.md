FORMAT: 1A
HOST: http://qa.www.eventdove.com/api
# Eventdove API
欢迎使用 **Eventdove** API ，这些 API 提供了操作 **Eventdove** 数据的接口。

# Group 创建活动
创建活动需要用到的接口

## 我的会员组 [/member/getMembershipByUserId]
### 我的会员组 [GET]

+ Request

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMzU4MTcwNzE3MzM3NzIyODgiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4ODg3MTIzNiwiZXhwIjoxNDg5NDc2MDM2fQ.3bR4AVDs5UkpT1fAVQQCepRj5H6X6CZYGZS8sQw9LsU



+ Response 200 (application/json; charset=utf-8)

    + Body

            []

## 根据用户id获取主办方列表 [/user/getOrganizersByUserId/{userId}]

### 根据用户id获取主办方列表 [GET]
根据用户id获取主办方列表

+ Parameters

    + userId: `6217240604074708992` (string) - 主办方用户id

+ Request (application/json; charset=utf-8)

    + Headers

            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMTcyNDA2MDQwNzQ3MDg5OTIiLCJ1c2VybmFtZSI6InpoYW9ob25neXUiLCJpYXQiOjE0ODI3NDI3MjUsImV4cCI6MTQ4Mjc0NTcyNX0.vhaLaC5lOLH4q9v6cPkBR3pd6XS-cG9m-3pCZfPcMQ4

+ Response 200 (application/json; charset=utf-8)

    + Body

            [{"name":"百度科技","website":"www.baidu.com"},{"name":"腾讯科技","website":"www.qq.com"},{"name":"搜狗科技","website":"www.sougou.com"},{"name":"会唐世纪","website":"www.eventown.com"}]

## 获取活动类别列表 [/event/getEventCategories]

### 获取活动类别列表 [GET]
获取活动类别列表

+ Request (application/json; charset=utf-8)

    + Headers

            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMTcyNDA2MDQwNzQ3MDg5OTIiLCJ1c2VybmFtZSI6InpoYW9ob25neXUiLCJpYXQiOjE0ODI3NDc4MzcsImV4cCI6MTQ4Mjc1MDgzN30.MIl1F2X0lLLEq7HXFJFplLQwXoKNeLaVkt9NaMRN5cI

+ Response 200 (application/json; charset=utf-8)

    + Body

            [
              {
                "name": "IT/互联网",
                "value": 1
              },
              {
                "name": "医药/生物",
                "value": 2
              },
              {
                "name": "讲座/沙龙",
                "value": 3
              },
              {
                "name": "艺术/音乐",
                "value": 4
              },
              {
                "name": "宴会",
                "value": 5
              },
              {
                "name": "商务/金融",
                "value": 6
              },
              {
                "name": "运动/亲子",
                "value": 7
              },
              {
                "name": "其他",
                "value": 8
              }
            ]

## 创建活动 [/event/create]

### 创建活动 [POST]
新建一个活动

+ Parameters
    + title: `世界互联网大会` (string) - 活动名称
    + content:  (array) - 活动内容是一个数组
    + logoUrl: `https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png` (string) - logo地址
    + bannerUrl: (string) - banner的url地址
    + startTime: `2016-12-27T17:31:04.000Z` (string) - 活动开始时间
    + endTime: `2016-12-28T17:31:12.000Z` (string) - 活动结束时间
    + isPublic: `true` (boolean) - 是否公开活动
    + askPromotion: `true` (boolean) - 是否需要宣传
    + smsNotice: `true` (boolean) - 是否发送短信通知
            + Default: `false`
    + userId: `123456789` (string) - 创建者用户id
    + organizers: (array) - 主办方数组
    + categories: `[1,2,3]` (array) - 活动类别
        是一个数组,可以传入多个类别
        + Members
            + `1`
            + `2`
            + `3`
            + `4`
            + `5`
            + `6`
            + `7`
            + `8`

    + keyWords: `["北京会唐网","会鸽网"]` (array) - 活动关键词
    + country: `中国` (string) - 国家
    + province: `北京` (string) - 省
    + city: `北京` (string) - 城市
    + zipCode: `121000` (string) - 邮编
    + detailedAddress: `北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网` (string) - 详细地址
    + lng: `123.1` (number) - 经度
    + lat: `231.3` (number) - 纬度
    + onlineAddress: `false` (boolean) - 是否是线上活动
    + geohash: `wxaddjd` (string) - geohash
    + paymentAccountIds: `['12344441','123444222']` (string) - 支付帐号数组
    + paymentPriceUnit: `yuan` (string) - 支付单位yuan/dollar
        + Default: `yuan`
        + Members
            + `yuan`
            + `dollar`
    + onsite: `false` (boolean) - 是否支持现场缴费        
    + transfer: `false` (boolean) - 是否支持银行转账,即线下收款        
    + basePrice: `100` (number) - 基础服务费(服务费低于该额度以该额度计)    默认 0: 无
    + percent: `5` (number) - 票服务费比例(占票价百分比)   默认为 0%
    + maxFee: `200` (number) - 最高服务费(服务费超过该额度以该额度收取) 0: 无
    + isCollectAttendees: `true` (boolean) - 是否收集参会者信息,默认true收集,false为只收集购票者信息
        + Default: `false`
        + Members
            + `true`
            + `false`
    + tickets:  (array) - 门票
    + collectItems:  (array) - 表单收集项

++ Request (application/json; charset=utf-8)

     + Headers

             Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
             Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA2NDYzNSwiZXhwIjoxNDg1NjY5NDM1fQ.dt2mQ3yi65Uk7WOVRVdXBxtfdd_rLnK2wEj1yT7zwkg

     + Body

             {"title":"\u5439a\u725b\u76ae\u5927\u4f1a2","content":[{"label":"\u6d3b\u52a8\u4ecb\u7ecd","content":"\u6d3b\u52a8\u4ecb\u7ecd"},{"label":"\u6d3b\u52a8\u8be6\u60c5","content":"\u6d3b\u52a8\u8be6\u60c5"},{"label":"\u6d3b\u52a8\u5609\u5bbe","content":"\u6d3b\u52a8\u5609\u5bbe"}],"logoUrl":"http://tupian.enterdesk.com/2012/0525/1/9.jpg","bannerUrl":"http://tupian.enterdesk.com/2012/0525/1/7.jpg","startTime":"2017-03-07T10:55:24Z","endTime":"2017-04-06T10:55:24Z","isPublic":true,"askPromotion":true,"smsNotice":true,"userId":"6235817071733772288","groupId":"123456789","organizers":[{"name":"\u641c\u72d7\u79d1\u6280","website":"www.sougou.com"},{"name":"\u4f1a\u5510\u4e16\u7eaa","website":"www.eventown.com"}],"categories":[1,2],"keyWords":["\u5439\u725b\u76ae","\u8d75\u6d2a\u79b9"],"country":"\u5317\u4eac","province":"\u5317\u4eac","city":"\u5317\u4eac","zipCode":"100010","detailedAddress":"\u5317\u4eac\u5e02\u671d\u9633\u533a\u671d\u9633\u8def\u6cf0\u79be\u6587\u5316\u5927\u53a6A\u5ea74\u5c42\u4f1a\u5510\u7f51","lng":11.111,"lat":39.111,"onlineAddress":false,"geohash":"wxaddjd","paymentAccountIds":["123456789","123456780"],"paymentPriceUnit":"dollar","onsite":true,"transfer":true,"basePrice":100.05,"percent":1,"maxFee":500.21,"isCollectAttendees":true,"tickets":[{"name":"\u7b2c\u516b\u5c4a\u4e92\u8054\u7f51\u5439\u725b\u76ae\u5927\u4f1a\u95e8\u7968121","describe":"111","needAudit":false,"defaultPrice":100,"startSalesTime":"2017-03-07T10:55:24Z","endSalesTime":"2017-04-06T10:55:24Z","totalCount":88,"soldCount":0,"minCount":1,"maxCount":85,"isServiceFeeInclude":true,"ticketServiceFee":80,"isMemberOnlyTicket":false,"isAllowGroupPurchase":true,"groupPurchaseTicketSetting":{"minGroupCount":2,"preferentialType":"fixed","value":5,"isAllowDiscount":true}},{"name":"\u7b2c\u516b\u5c4a\u4e92\u8054\u7f51\u5439\u725b\u76ae\u5927\u4f1a\u95e8\u7968122","describe":"111","needAudit":false,"defaultPrice":100,"startSalesTime":"2017-03-07T10:55:24Z","endSalesTime":"2017-04-06T10:55:24Z","totalCount":88,"soldCount":0,"minCount":1,"maxCount":85,"isServiceFeeInclude":true,"ticketServiceFee":80,"isMemberOnlyTicket":false,"isAllowGroupPurchase":true,"groupPurchaseTicketSetting":{"minGroupCount":10,"preferentialType":"rate","value":5.5,"isAllowDiscount":true}}],"collectItems":[{"itemName":"radio1","displayName":"\u6027\u522b1","fieldType":"radio","regexp":"[\\\\S]{1,128}","maxFileSize":100,"isRequired":true,"displayOrder":0,"isDeleted":false,"isUnique":false,"itemValues":[{"option":"\u7537","value":"\u7537","isDefault":true},{"option":"\u5973","value":"\u5973","isDefault":false},{"option":"\u4fdd\u5bc6","value":"\u4fdd\u5bc6","isDefault":false}]},{"itemName":"checkbox1","displayName":"\u7231\u597d","fieldType":"checkbox","regexp":"[\\\\S]{1,128}","maxFileSize":100,"isRequired":false,"displayOrder":0,"isDeleted":false,"isUnique":false,"itemValues":[{"option":"\u6253\u7403","value":"\u6253\u7403","isDefault":false},{"option":"\u6e38\u6cf3","value":"\u6e38\u6cf3","isDefault":true},{"option":"\u753b\u753b","value":"\u753b\u753b","isDefault":false}]}]}

 + Response 200 (application/json; charset=utf-8)

     + Body

            {"title":"吹a牛皮大会2","content":[{"content":"活动介绍","label":"活动介绍"},{"content":"活动详情","label":"活动详情"},{"content":"活动嘉宾","label":"活动嘉宾"}],"logoUrl":"http://tupian.enterdesk.com/2012/0525/1/9.jpg","bannerUrl":"http://tupian.enterdesk.com/2012/0525/1/7.jpg","startTime":"2017-03-07T10:55:24.000Z","endTime":"2017-04-06T10:55:24.000Z","isPublic":true,"askPromotion":true,"smsNotice":true,"userId":"6235817071733772288","groupId":"123456789","organizers":[{"name":"搜狗科技","website":"www.sougou.com"},{"name":"会唐世纪","website":"www.eventown.com"}],"categories":[1,2],"keyWords":["吹牛皮","赵洪禹"],"country":"北京","province":"北京","city":"北京","zipCode":"100010","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","lng":11.111,"lat":39.111,"onlineAddress":false,"geohash":"wxaddjd","paymentAccountIds":["123456789","123456780"],"paymentPriceUnit":"dollar","basePrice":100.05,"percent":1,"maxFee":500.21,"isCollectAttendees":true,"tickets":[{"defaultPrice":100,"describe":"111","endSalesTime":"2017-04-06T10:55:24.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":true,"minGroupCount":2,"preferentialType":"fixed","value":5},"isAllowGroupPurchase":true,"isMemberOnlyTicket":false,"isRefundable":false,"isServiceFeeInclude":true,"maxCount":85,"minCount":1,"name":"第八届互联网吹牛皮大会门票121","needAudit":false,"soldCount":0,"startSalesTime":"2017-03-07T10:55:24.000Z","status":"normal","ticketId":"6244832638138454016","ticketServiceFee":80,"totalCount":88},{"defaultPrice":100,"describe":"111","endSalesTime":"2017-04-06T10:55:24.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":true,"minGroupCount":10,"preferentialType":"rate","value":5.5},"isAllowGroupPurchase":true,"isMemberOnlyTicket":false,"isRefundable":false,"isServiceFeeInclude":true,"maxCount":85,"minCount":1,"name":"第八届互联网吹牛皮大会门票122","needAudit":false,"soldCount":0,"startSalesTime":"2017-03-07T10:55:24.000Z","status":"normal","ticketId":"6244832638142648320","ticketServiceFee":80,"totalCount":88}],"collectItems":[{"displayName":"性别1","displayOrder":0,"fieldType":"radio","isDeleted":false,"isRequired":true,"isUnique":false,"itemId":"6244832638142648321","itemName":"radio1","itemValues":[{"isDefault":true,"option":"男","value":"男"},{"isDefault":false,"option":"女","value":"女"},{"isDefault":false,"option":"保密","value":"保密"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"},{"displayName":"爱好","displayOrder":0,"fieldType":"checkbox","isDeleted":false,"isRequired":false,"isUnique":false,"itemId":"6244832638142648322","itemName":"checkbox1","itemValues":[{"isDefault":false,"option":"打球","value":"打球"},{"isDefault":true,"option":"游泳","value":"游泳"},{"isDefault":false,"option":"画画","value":"画画"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"},{"displayName":"name","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":false,"itemId":"6244832638146842624","itemName":"name","itemValues":[],"maxFileSize":0,"regexp":"[\\\\S]{1,30}"},{"displayName":"email","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":true,"itemId":"6244832638146842625","itemName":"email","itemValues":[],"maxFileSize":0,"regexp":"[\\\\S]{1,30}"}],"paymentMethod":["paypal","onsite"],"status":"unpublished","emailBalance":500,"isSelfRefundable":false,"ctime":"2017-03-07T10:55:24.315Z","utime":"2017-03-07T10:55:24.315Z","id":"6244832638151036928"}

## 根据活动主键id更新活动 [/event/update]

### 根据活动主键id更新活动 [POST]
根据活动主键id更新活动

+ Parameters
    + id: `6224540560988966912` (string) - 活动主键id

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA2NDYzNSwiZXhwIjoxNDg1NjY5NDM1fQ.dt2mQ3yi65Uk7WOVRVdXBxtfdd_rLnK2wEj1yT7zwkg

    + Body

            {
                "id": "6228850641452797952",
                "title": "测试活动1111",
                "content": [
                    {
                        "label": "活动介绍",
                        "content": "活动介绍"
                    },
                    {
                        "label": "活动详情",
                        "content": "活动详情"
                    },
                    {
                        "label": "活动嘉宾",
                        "content": "活动嘉宾"
                    }
                ],
                "logoUrl": "https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png",
                "bannerUrl": "https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png",
                "startTime": "2017-01-22T08:45:17.000Z",
                "endTime": "2017-01-23T08:45:17.000Z",
                "isPublic": true,
                "askPromotion": true,
                "smsNotice": true,
                "userId": "6222384718470582272",
                "groupId": "123456789",
                "organizerIds": [
                    ""
                ],
                "categories": [
                    1,
                    2
                ],
                "keyWords": [
                    "北京会唐网",
                    "会鸽网"
                ],
                "country": "北京",
                "province": "北京",
                "city": "北京",
                "zipCode": "100010",
                "detailedAddress": "北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网",
                "lng": 11.111,
                "lat": 39.111,
                "onlineAddress": false,
                "geohash": "wxaddjd",
                "paymentAccountIds": ["123456789","123456780"],
                "paymentAccountType": "online",
                "paymentPriceUnit": "yuan",
                "basePrice": 100.05,
                "percent": 1,
                "maxFee": 500.21,
                "tickets": [
                    {
                        "name": "第八届互联网吹牛皮大会门票121",
                        "describe": "111",
                        "needAudit": false,
                        "defaultPrice": 100,
                        "startSalesTime": "2017-01-22T08:45:17.000Z",
                        "endSalesTime": "2017-01-23T08:45:17.000Z",
                        "totalCount": 88,
                        "soldCount": 0,
                        "minCount": 1,
                        "maxCount": 100,
                        "ladderPriceSetting": [
                            {
                                "startTime": "2017-01-22T08:45:17.000Z",
                                "endTime": "2017-01-23T08:45:17.000Z",
                                "price": 66
                            },
                            {
                                "startTime": "2017-01-22T08:45:17.000Z",
                                "endTime": "2017-01-23T08:45:17.000Z",
                                "price": 44
                            }
                        ],
                        "isContainFee": true,
                        "ticketServiceFee": 80,
                        "isMemberOnlyTicket": false,
                        "isAllowGroupPurchase": false,
                        "groupPurchaseTicketSetting": {
                            "minGroupCount": 10,
                            "preferentialType": "free",
                            "value": 5,
                            "isAllowDiscount": false
                        }
                    },
                    {
                        "name": "第八届互联网吹牛皮大会门票122",
                        "describe": "111",
                        "needAudit": false,
                        "defaultPrice": 100,
                        "startSalesTime": "2017-01-22T08:45:17.000Z",
                        "endSalesTime": "2017-01-23T08:45:17.000Z",
                        "totalCount": 88,
                        "soldCount": 0,
                        "minCount": 1,
                        "maxCount": 100,
                        "ladderPriceSetting": [
                            {
                                "startTime": "2017-01-22T08:45:17.000Z",
                                "endTime": "2017-01-23T08:45:17.000Z",
                                "price": 66
                            },
                            {
                                "startTime": "2017-01-22T08:45:17.000Z",
                                "endTime": "2017-01-23T08:45:17.000Z",
                                "price": 44
                            }
                        ],
                        "isContainFee": true,
                        "ticketServiceFee": 80,
                        "isMemberOnlyTicket": false,
                        "isAllowGroupPurchase": false,
                        "groupPurchaseTicketSetting": {
                            "minGroupCount": 10,
                            "preferentialType": "discount",
                            "value": 5,
                            "isAllowDiscount": false
                        }
                    }
                ],
                "collectItems": [
                    {
                        "itemName": "username1",
                        "displayName": "姓名1",
                        "fieldType": "text",
                        "regexp": "[\\\\S]{1,128}",
                        "maxFileSize": 100,
                        "isRequired": true,
                        "displayOrder": 0,
                        "isDeleted": false,
                        "isUnique": false,
                        "itemValues": [
                            {
                                "option": "选项1",
                                "value": "选项1的值",
                                "isDefault": false
                            },
                            {
                                "option": "选项2",
                                "value": "选项2的值",
                                "isDefault": true
                            },
                            {
                                "option": "选项3",
                                "value": "选项3的值",
                                "isDefault": false
                            }
                        ]
                    },
                    {
                        "itemName": "username2",
                        "displayName": "姓名2",
                        "fieldType": "text",
                        "regexp": "[\\\\S]{1,128}",
                        "maxFileSize": 100,
                        "isRequired": false,
                        "displayOrder": 0,
                        "isDeleted": false,
                        "isUnique": false,
                        "itemValues": [
                            {
                                "option": "选项1",
                                "value": "选项1的值",
                                "isDefault": false
                            },
                            {
                                "option": "选项2",
                                "value": "选项2的值",
                                "isDefault": true
                            },
                            {
                                "option": "选项3",
                                "value": "选项3的值",
                                "isDefault": false
                            }
                        ]
                    }
                ]
            }

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"id":"6228850641452797952","title":"\u6d4b\u8bd5\u6d3b\u52a81111","content":[{"label":"\u6d3b\u52a8\u4ecb\u7ecd","content":"\u6d3b\u52a8\u4ecb\u7ecd"},{"label":"\u6d3b\u52a8\u8be6\u60c5","content":"\u6d3b\u52a8\u8be6\u60c5"},{"label":"\u6d3b\u52a8\u5609\u5bbe","content":"\u6d3b\u52a8\u5609\u5bbe"}],"logoUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","bannerUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","startTime":"2017-01-22T08:45:49.000Z","endTime":"2017-01-23T08:45:49.000Z","isPublic":true,"askPromotion":true,"smsNotice":true,"userId":"6222384718470582272","groupId":"123456789","organizerIds":[""],"categories":[1,2],"keyWords":["\u5317\u4eac\u4f1a\u5510\u7f51","\u4f1a\u9e3d\u7f51"],"country":"\u5317\u4eac","province":"\u5317\u4eac","city":"\u5317\u4eac","zipCode":"100010","detailedAddress":"\u5317\u4eac\u5e02\u671d\u9633\u533a\u671d\u9633\u8def\u6cf0\u79be\u6587\u5316\u5927\u53a6A\u5ea74\u5c42\u4f1a\u5510\u7f51","lng":11.111,"lat":39.111,"onlineAddress":false,"geohash":"wxaddjd","paymentAccountIds":["123456789","123456780"],"paymentAccountType":"online","paymentPriceUnit":"yuan","basePrice":100.05,"percent":1,"maxFee":500.21,"tickets":[{"name":"\u7b2c\u516b\u5c4a\u4e92\u8054\u7f51\u5439\u725b\u76ae\u5927\u4f1a\u95e8\u7968121","describe":"111","needAudit":false,"defaultPrice":100,"startSalesTime":"2017-01-22T08:45:49.000Z","endSalesTime":"2017-01-23T08:45:49.000Z","totalCount":88,"soldCount":0,"minCount":1,"maxCount":100,"ladderPriceSetting":[{"startTime":"2017-01-22T08:45:49.000Z","endTime":"2017-01-23T08:45:49.000Z","price":66},{"startTime":"2017-01-22T08:45:49.000Z","endTime":"2017-01-23T08:45:49.000Z","price":44}],"isContainFee":true,"ticketServiceFee":80,"isMemberOnlyTicket":false,"isAllowGroupPurchase":false,"groupPurchaseTicketSetting":{"minGroupCount":10,"preferentialType":"free","value":5,"isAllowDiscount":false}},{"name":"\u7b2c\u516b\u5c4a\u4e92\u8054\u7f51\u5439\u725b\u76ae\u5927\u4f1a\u95e8\u7968122","describe":"111","needAudit":false,"defaultPrice":100,"startSalesTime":"2017-01-22T08:45:49.000Z","endSalesTime":"2017-01-23T08:45:49.000Z","totalCount":88,"soldCount":0,"minCount":1,"maxCount":100,"ladderPriceSetting":[{"startTime":"2017-01-22T08:45:49.000Z","endTime":"2017-01-23T08:45:49.000Z","price":66},{"startTime":"2017-01-22T08:45:49.000Z","endTime":"2017-01-23T08:45:49.000Z","price":44}],"isContainFee":true,"ticketServiceFee":80,"isMemberOnlyTicket":false,"isAllowGroupPurchase":false,"groupPurchaseTicketSetting":{"minGroupCount":10,"preferentialType":"discount","value":5,"isAllowDiscount":false}}],"collectItems":[{"itemName":"username1","displayName":"\u59d3\u540d1","fieldType":"text","regexp":"[\\\\S]{1,128}","maxFileSize":100,"isRequired":true,"displayOrder":0,"isDeleted":false,"isUnique":false,"itemValues":[{"option":"\u9009\u98791","value":"\u9009\u98791\u7684\u503c","isDefault":false},{"option":"\u9009\u98792","value":"\u9009\u98792\u7684\u503c","isDefault":true},{"option":"\u9009\u98793","value":"\u9009\u98793\u7684\u503c","isDefault":false}]},{"itemName":"username2","displayName":"\u59d3\u540d2","fieldType":"text","regexp":"[\\\\S]{1,128}","maxFileSize":100,"isRequired":false,"displayOrder":0,"isDeleted":false,"isUnique":false,"itemValues":[{"option":"\u9009\u98791","value":"\u9009\u98791\u7684\u503c","isDefault":false},{"option":"\u9009\u98792","value":"\u9009\u98792\u7684\u503c","isDefault":true},{"option":"\u9009\u98793","value":"\u9009\u98793\u7684\u503c","isDefault":false}]}]}

# Group 表单收集项
表单收集项相关的操作接口

## 获取系统提供的用来创建其他表单收集项的列表 [/fieldType/getFieldTypeByIsCustomizableField/{customType}]
### 获取系统提供的用来创建其他表单收集项的列表 [GET]
获取系统提供的用来创建其他表单收集项的列表

+ Parameters

    + customType: `0` (enum[number]) - 采集项类型
        + `0` 系统提供的采集项类型,用于在用户自定义采集项下拉中使用
        + `1` 系统提供的常见采集项,如部门,职务,职称等

+ Request

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

+ Response 200 (application/json; charset=utf-8)

    + Body

            [{"id":"6242620484995911683","fieldName":"datepicker","fieldType":"datepicker","displayName":"日期","regexp":"[\\S]{16}"},{"id":"6242620484991717378","fieldName":"radio","fieldType":"radio","displayName":"单选","regexp":"[\\S]{1,50}"},{"id":"6242620484991717377","fieldName":"texterea","fieldType":"texterea","displayName":"文本域","regexp":"[\\S]{1,1000}"},{"id":"6242620484995911682","fieldName":"file","fieldType":"file","displayName":"文件","regexp":""},{"id":"6242620484991717379","fieldName":"checkbox","fieldType":"checkbox","displayName":"多选","regexp":"[\\S]{1,50}"},{"id":"6242620484991717376","fieldName":"text","fieldType":"text","displayName":"文本框","regexp":"[\\S]{1,128}"},{"id":"6242620484995911680","fieldName":"dropbox","fieldType":"dropbox","displayName":"下拉框","regexp":"[\\S]{1,30}"},{"id":"6242620484995911681","fieldName":"number","fieldType":"number","displayName":"数字","regexp":"[\\S]{1,50}"},{"id":"6242620485000105984","fieldName":"country","fieldType":"country","displayName":"国家","regexp":"[\\S]{50}"}]

## 获取系统提供的常用表单收集项列表 [/fieldType/getFieldTypeByIsCustomizableField/{customType}]
### 获取系统提供的常用表单收集项列表 [GET]
获取系统提供的常用表单收集项列表

+ Parameters

    + customType: `1` (enum[number]) - 采集项类型
        + `0` 系统提供的采集项类型,用于在用户自定义采集项下拉中使用
        + `1` 系统提供的常见采集项,如部门,职务,职称等

+ Request

    + Headers

            Cookie: locale=cn

+ Response 200 (application/json; charset=utf-8)

    + Body

            [{"id":"6242620484966551552","fieldName":"job","fieldType":"text","displayName":"职位","regexp":"[\\S]{1,30}"},{"id":"6242620484987523072","fieldName":"gender","fieldType":"text","displayName":"性别","regexp":"(男|女|其他)"},{"id":"6242620484962357248","fieldName":"company","fieldType":"text","displayName":"公司","regexp":"[\\S]{1,30}"},{"id":"6242620484958162944","fieldName":"email","fieldType":"text","displayName":"邮箱","regexp":"^([a-zA-Z0-9_\\.\\-])+\\@(([a-zA-Z0-9\\-])+\\.)+([a-zA-Z0-9]{2,4})+$"},{"id":"6242620484966551553","fieldName":"address","fieldType":"text","displayName":"地址","regexp":"[\\S]{1,30}"},{"id":"6242620484945580032","fieldName":"name","fieldType":"text","displayName":"姓名","regexp":"[\\S]{1,30}"},{"id":"6242620484962357249","fieldName":"department","fieldType":"text","displayName":"部门","regexp":"[\\S]{1,30}"},{"id":"6242620484970745857","fieldName":"fax","fieldType":"text","displayName":"传真","regexp":"^[0-9－-]+\\d*$"},{"id":"6242620484970745858","fieldName":"zipCode","fieldType":"text","displayName":"邮编","regexp":"^[0-9]+\\d*$"},{"id":"6242620484970745856","fieldName":"mobile","fieldType":"number","displayName":"手机号","regexp":"^[0-9－+-]+\\d*$"},{"id":"6242620484979134464","fieldName":"companyTelephone","fieldType":"text","displayName":"公司电话","regexp":"^[0-9－-]+\\d*$"},{"id":"6242620484979134465","fieldName":"companyWebsite","fieldType":"text","displayName":"公司网站","regexp":"(http|https)://[^\\S]+"},{"id":"6242620484983328770","fieldName":"homeAddress","fieldType":"text","displayName":"家庭住址","regexp":"[\\S]{1,50}"},{"id":"6242620484983328768","fieldName":"blog","fieldType":"text","displayName":"博客","regexp":"(http|https)://[^\\S]+"},{"id":"6242620484987523073","fieldName":"age","fieldType":"text","displayName":"年龄","regexp":"\\d{1,3}"},{"id":"6242620484983328769","fieldName":"homePhone","fieldType":"text","displayName":"家庭电话","regexp":"^[0-9－-]+\\d*$"}]

## 添加自定义表单收集项 [/formField/add]
### 添加自定义表单收集项 [POST]
添加自定义表单收集项

+ Parameters
    + eventId: `6227402487406661632` (string) - 活动主键id
    + itemName: `username2` (string) - 自定义采集项的名称,用来当做创建订单时收集项的key,必须是英文
    + displayName: `用户名2` (string) - 显示给用户看的名字
    + fieldType: `测试表单收集项添加2` (string) - FieldType的类型,比如text,dropbox,radio等
    + regexp: `测试表单收集项添加2` (string) - 正则表达式
    + maxFileSize: `0` (number) - 如果是上传文件,则表示为上传文件的大小单位为M
    + isRequired: `false` (boolean) - 是否为必填
        + Default: `false`
        + Members
            + `true`
            + `false`
    + displayOrder: `0` (number) - 排序,升序排序,数字越大越靠后
        + Default: `0`
    + isUnique: `false` (boolean) - 是否是唯一收集项,默认为false不是
        + Default: `false`
        + Members
            + `true`
            + `false`
    + fieldId: `45d07d91-26f8-4e45-9a4d-42018cb551a7` (string) - 系统表单收集项主键id
    + itemValues:  (array) - 存储select,radio,checkbox等类型的值对象

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer

    + Body

            {
                "eventId": "6228810014061105152",
                "itemName": "username12",
                "displayName": "姓名45",
                "fieldType": "text",
                "regexp": "[\\\\S]{1,128}",
                "maxFileSize": 100,
                "isRequired": true,
                "displayOrder": 0,
                "isUnique": true,
                "itemValues": [
                    {
                        "option": "选项1",
                        "value": "选项1的值",
                        "isDefault": false
                    },
                    {
                        "option": "选项2",
                        "value": "选项2的值",
                        "isDefault": true
                    },
                    {
                        "option": "选项3",
                        "value": "选项3的值",
                        "isDefault": false
                    }
                ]
            }

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"itemName":"username12","displayName":"姓名45","fieldType":"text","regexp":"[\\\\S]{1,128}","maxFileSize":100,"isRequired":true,"displayOrder":0,"isUnique":true,"itemValues":[{"option":"选项1","value":"选项1的值","isDefault":false},{"option":"选项2","value":"选项2的值","isDefault":true},{"option":"选项3","value":"选项3的值","isDefault":false}],"isDeleted":false,"itemId":"6228811360839536640"}

## 删除自定义表单收集项 [/formField/delete]
### 删除自定义表单收集项 [POST]
删除自定义表单收集项

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA2NDYzNSwiZXhwIjoxNDg1NjY5NDM1fQ.dt2mQ3yi65Uk7WOVRVdXBxtfdd_rLnK2wEj1yT7zwkg

    + Body

            {
                "eventId": "6228810014061105152",
                "itemName": "username12"
            }

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"displayName":"姓名2","displayOrder":12,"fieldType":"text","isDeleted":true,"isRequired":true,"isUnique":true,"itemId":"6228811360839536640","itemName":"username12","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"}

## 修改自定义表单收集项 [/formField/update]
### 修改自定义表单收集项 [POST]
修改自定义表单收集项

+ Parameters
    + eventId: `6227402487406661632` (string) - 活动主键id
    + originItemName: `测试表单收集项添加2` (string) - 表单收集项原来的名字,如果需要变更表单收集项名字请加入此字段
    + itemName: `username1` (string) - 自定义采集项的名称,用来当做创建订单时收集项的key,必须是英文
    + displayName: `用户名1` (string) - 显示给用户看的名字
    + fieldType: `测试表单收集项添加2` (string) - FieldType的类型,比如text,dropbox,radio等
    + regexp: `测试表单收集项添加2` (string) - 正则表达式
    + maxFileSize: `0` (number) - 如果是上传文件,则表示为上传文件的大小单位为M
    + isRequired: `false` (boolean) - 是否为必填
        + Default: `false`
        + Members
            + `true`
            + `false`
    + displayOrder: `0` (number) - 排序,升序排序,数字越大越靠后
        + Default: `0`
    + isUnique: `false` (boolean) - 是否是唯一收集项,默认为false不是
        + Default: `false`
        + Members
            + `true`
            + `false`
    + fieldId: `45d07d91-26f8-4e45-9a4d-42018cb551a7` (string) - 系统表单收集项主键id
    + itemValues:  (array) - 存储select,radio,checkbox等类型的值对象

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA2NDYzNSwiZXhwIjoxNDg1NjY5NDM1fQ.dt2mQ3yi65Uk7WOVRVdXBxtfdd_rLnK2wEj1yT7zwkg

    + Body

            {
                "eventId": "6228810014061105152",
                "originItemName": "username12",
                "itemName": "username12",
                "displayName": "姓名2",
                "fieldType": "text",
                "regexp": "[\\\\S]{1,128}",
                "maxFileSize": 100,
                "isRequired": true,
                "displayOrder": 12,
                "isUnique": true,
                "itemValues": [
                    {
                        "option": "选项1",
                        "value": "选项1的值",
                        "isDefault": false
                    },
                    {
                        "option": "选项2",
                        "value": "选项2的值",
                        "isDefault": true
                    },
                    {
                        "option": "选项3",
                        "value": "选项3的值",
                        "isDefault": false
                    }
                ]
            }

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"displayName":"姓名2","displayOrder":12,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":true,"itemId":"6228812596716376064","itemName":"username12","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"}

## 获取自定义表单收集项详情 [/formField/getByName/{eventId}/{formFieldName}]
### 获取自定义表单收集项详情 [GET]
根据活动id和自定义表单收集项名称查询表单收集项详情

+ Parameters
    + eventId: `6227402487406661632` (string) - 活动主键id
    + itemName: `测试表单收集项添加3` (string) - 自定义表单收集项名字

+ Request

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA2NDYzNSwiZXhwIjoxNDg1NjY5NDM1fQ.dt2mQ3yi65Uk7WOVRVdXBxtfdd_rLnK2wEj1yT7zwkg

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"displayName":"姓名2","displayOrder":12,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":true,"itemId":"6228812596716376064","itemName":"username12","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"}

## 根据活动id查询表单收集项列表 [/formField/getFormFieldListByEventId/{eventId}]
### 根据活动id查询表单收集项列表 [GET]
根据活动id查询表单收集项列表

+ Parameters
    + eventId: `6227402487406661632` (string) - 活动主键id

+ Request

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA2NDYzNSwiZXhwIjoxNDg1NjY5NDM1fQ.dt2mQ3yi65Uk7WOVRVdXBxtfdd_rLnK2wEj1yT7zwkg

+ Response 200 (application/json; charset=utf-8)

    + Body

            [{"displayName":"姓名1","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":false,"itemId":"6228809539345584128","itemName":"username1","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"},{"displayName":"姓名2","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":false,"isUnique":false,"itemId":"6228809539345584128","itemName":"username2","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"},{"displayName":"姓名2","displayOrder":12,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":true,"itemId":"6228812596716376064","itemName":"username12","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"}]

# Group 活动相关
活动相关的操作接口

## 发现活动 [/event/discover{?searchText,startDate,endDate,category,city,rowsPerPage,rowsPerPage}]
### 发现活动 [GET]
+ Parameters
    + searchText: `abc` (number, optional) - 搜索栏里的字符，对标题进行模糊匹配，对关键字进行精确匹配
    + startDate: `2018-01-01` (string, optional) - 开始日期 格式YYYY-MM-DD
    + endDate: `2020-01-01` (string, optional) - 结束日期 格式YYYY-MM-DD 和开始日期成对出现，否则不生效
    + category: `1` (number,optional) - 活动类型
    + city: `南京` (string,optional) - 城市
    + rowsPerPage: `1` (number,optional) - 当前页数 如果为空，则默认为第一页
    + rowsPerPage: `15` (number,optional) - 每一页数量 如果没空，默认15条

+ Request

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

+ Response 200 (application/json; charset=utf-8)

    + Body
        {"perPage":15,"total":4,"items":[{"askPromotion":true,"bannerUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","basePrice":100.05,"categories":[1,2],"city":"北京","collectItems":[{"displayName":"姓名1","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":false,"itemId":"6229137154795245568","itemName":"username1","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"},{"displayName":"姓名2","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":false,"isUnique":false,"itemId":"6229137154795245568","itemName":"username2","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"}],"content":[{"content":"活动介绍","label":"活动介绍"},{"content":"活动详情","label":"活动详情"},{"content":"活动嘉宾","label":"活动嘉宾"}],"country":"北京","ctime":"2017-01-23T04:19:41.877Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","endTime":"2017-01-24T04:19:41.000Z","geohash":"wxaddjd","groupId":"123456789","id":"6229150376931758080","isCollectAttendees":true,"isPublic":true,"keyWords":["吹牛皮","赵洪禹"],"lat":39.111,"lng":11.111,"logoUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","maxFee":500.21,"onlineAddress":false,"organizerIds":[""],"paymentAccountIds":["123456789","123456780"],"paymentAccountType":"online","paymentPriceUnit":"yuan","percent":1,"province":"北京","smsNotice":true,"startTime":"2017-01-23T04:19:41.000Z","tickets":[{"defaultPrice":100,"describe":"111","endSalesTime":"2017-01-24T04:19:41.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"free","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-01-24T04:19:41.000Z","price":66,"startTime":"2017-01-23T04:19:41.000Z"},{"endTime":"2017-01-24T04:19:41.000Z","price":44,"startTime":"2017-01-23T04:19:41.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票121","needAudit":false,"soldCount":0,"startSalesTime":"2017-01-23T04:19:41.000Z","status":"normal","ticketServiceFee":80,"totalCount":88},{"defaultPrice":100,"describe":"111","endSalesTime":"2017-01-24T04:19:41.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"discount","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-01-24T04:19:41.000Z","price":66,"startTime":"2017-01-23T04:19:41.000Z"},{"endTime":"2017-01-24T04:19:41.000Z","price":44,"startTime":"2017-01-23T04:19:41.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票122","needAudit":false,"soldCount":0,"startSalesTime":"2017-01-23T04:19:41.000Z","status":"normal","ticketServiceFee":80,"totalCount":88}],"title":"吹a牛皮大会","userId":"6222039025105113088","utime":"2017-01-23T04:19:41.877Z","zipCode":"100010"},{"askPromotion":true,"bannerUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","basePrice":100.05,"categories":[1,2],"city":"北京","collectItems":[{"displayName":"姓名1","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":false,"itemId":"6233228373208993792","itemName":"username1","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"},{"displayName":"姓名2","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":false,"isUnique":false,"itemId":"6233228373208993792","itemName":"username2","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"}],"content":[{"content":"活动介绍","label":"活动介绍"},{"content":"活动详情","label":"活动详情"},{"content":"活动嘉宾","label":"活动嘉宾"}],"country":"北京","ctime":"2017-02-03T10:25:26.158Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","endTime":"2017-02-04T10:25:26.000Z","geohash":"wxaddjd","groupId":"123456789","id":"6233228684443127808","isCollectAttendees":true,"isPublic":true,"keyWords":["吹牛皮","赵洪禹"],"lat":39.111,"lng":11.111,"logoUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","maxFee":500.21,"onlineAddress":false,"organizerIds":[""],"paymentAccountIds":["123456789","123456780"],"paymentAccountType":"online","paymentPriceUnit":"yuan","percent":1,"province":"北京","smsNotice":true,"startTime":"2017-02-03T10:25:26.000Z","tickets":[{"defaultPrice":100,"describe":"111","endSalesTime":"2017-02-04T10:25:26.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"free","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-02-04T10:25:26.000Z","price":66,"startTime":"2017-02-03T10:25:26.000Z"},{"endTime":"2017-02-04T10:25:26.000Z","price":44,"startTime":"2017-02-03T10:25:26.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票121","needAudit":false,"soldCount":0,"startSalesTime":"2017-02-03T10:25:26.000Z","status":"normal","ticketServiceFee":80,"totalCount":88},{"defaultPrice":100,"describe":"111","endSalesTime":"2017-02-04T10:25:26.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"discount","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-02-04T10:25:26.000Z","price":66,"startTime":"2017-02-03T10:25:26.000Z"},{"endTime":"2017-02-04T10:25:26.000Z","price":44,"startTime":"2017-02-03T10:25:26.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票122","needAudit":false,"soldCount":0,"startSalesTime":"2017-02-03T10:25:26.000Z","status":"normal","ticketServiceFee":80,"totalCount":88}],"title":"吹a牛皮大会","userId":"6222384718470582272","utime":"2017-02-03T10:25:26.158Z","zipCode":"100010"},{"askPromotion":true,"bannerUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","basePrice":100.05,"categories":[1,2],"city":"北京","collectItems":[{"displayName":"姓名1","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":false,"itemId":"6233228373208993792","itemName":"username1","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"},{"displayName":"姓名2","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":false,"isUnique":false,"itemId":"6233228373208993792","itemName":"username2","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"}],"content":[{"content":"活动介绍","label":"活动介绍"},{"content":"活动详情","label":"活动详情"},{"content":"活动嘉宾","label":"活动嘉宾"}],"country":"北京","ctime":"2017-02-03T10:25:01.072Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","endTime":"2017-02-04T10:25:00.000Z","geohash":"wxaddjd","groupId":"123456789","id":"6233228579224817664","isCollectAttendees":true,"isPublic":true,"keyWords":["吹牛皮","赵洪禹"],"lat":39.111,"lng":11.111,"logoUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","maxFee":500.21,"onlineAddress":false,"organizerIds":[""],"paymentAccountIds":["123456789","123456780"],"paymentAccountType":"online","paymentPriceUnit":"yuan","percent":1,"province":"北京","smsNotice":true,"startTime":"2017-02-03T10:25:00.000Z","tickets":[{"defaultPrice":100,"describe":"111","endSalesTime":"2017-02-04T10:25:00.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"free","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-02-04T10:25:00.000Z","price":66,"startTime":"2017-02-03T10:25:00.000Z"},{"endTime":"2017-02-04T10:25:00.000Z","price":44,"startTime":"2017-02-03T10:25:00.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票121","needAudit":false,"soldCount":0,"startSalesTime":"2017-02-03T10:25:00.000Z","status":"normal","ticketServiceFee":80,"totalCount":88},{"defaultPrice":100,"describe":"111","endSalesTime":"2017-02-04T10:25:00.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"discount","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-02-04T10:25:00.000Z","price":66,"startTime":"2017-02-03T10:25:00.000Z"},{"endTime":"2017-02-04T10:25:00.000Z","price":44,"startTime":"2017-02-03T10:25:00.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票122","needAudit":false,"soldCount":0,"startSalesTime":"2017-02-03T10:25:00.000Z","status":"normal","ticketServiceFee":80,"totalCount":88}],"title":"吹a牛皮大会","userId":"6222384718470582272","utime":"2017-02-03T10:25:01.072Z","zipCode":"100010"},{"askPromotion":true,"bannerUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","basePrice":100.05,"categories":[1,2],"city":"北京","collectItems":[{"displayName":"姓名1","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":false,"itemId":"6233231505494249472","itemName":"username1","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"},{"displayName":"姓名2","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":false,"isUnique":false,"itemId":"6233231505494249472","itemName":"username2","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"}],"content":[{"content":"活动介绍","label":"活动介绍"},{"content":"活动详情","label":"活动详情"},{"content":"活动嘉宾","label":"活动嘉宾"}],"country":"北京","ctime":"2017-02-04T06:14:06.192Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","endTime":"2017-02-05T06:14:06.000Z","geohash":"wxaddjd","groupId":"123456789","id":"6233527822347014144","isCollectAttendees":true,"isPublic":true,"keyWords":["吹牛皮","赵洪禹"],"lat":39.111,"lng":11.111,"logoUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","maxFee":500.21,"onlineAddress":false,"organizerIds":[""],"paymentAccountIds":["123456789","123456780"],"paymentAccountType":"online","paymentPriceUnit":"yuan","percent":1,"province":"北京","smsNotice":true,"startTime":"2017-02-04T06:14:06.000Z","tickets":[{"defaultPrice":100,"describe":"111","endSalesTime":"2017-02-05T06:14:06.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"free","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-02-05T06:14:06.000Z","price":66,"startTime":"2017-02-04T06:14:06.000Z"},{"endTime":"2017-02-05T06:14:06.000Z","price":44,"startTime":"2017-02-04T06:14:06.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票121","needAudit":false,"soldCount":0,"startSalesTime":"2017-02-04T06:14:06.000Z","status":"normal","ticketServiceFee":80,"totalCount":88},{"defaultPrice":100,"describe":"111","endSalesTime":"2017-02-05T06:14:06.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"discount","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-02-05T06:14:06.000Z","price":66,"startTime":"2017-02-04T06:14:06.000Z"},{"endTime":"2017-02-05T06:14:06.000Z","price":44,"startTime":"2017-02-04T06:14:06.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票122","needAudit":false,"soldCount":0,"startSalesTime":"2017-02-04T06:14:06.000Z","status":"normal","ticketServiceFee":80,"totalCount":88}],"title":"吹a牛皮大会","userId":"6222384718470582272","utime":"2017-02-04T06:14:06.192Z","zipCode":"100010"}],"currentPageTotal":4,"totalPage":1,"page":1}

## 根据用户id查询活动列表 [/event/getEventsByUserIdAndPageIndex{?userId}{?total}{&page}{&limit}]
### 根据用户id查询活动列表 [GET]
根据用户id查询活动列表

+ Parameters

    + userId: `6217240604074708992` (string) - 用户id
    + total: `-1` (string) - 总记录数,默认-1,请注意,不传递此字段系统多会进行一次查询记录总数,如果从系统获得准确的记录数后请传递此字段准确的值,以便优化查询效率
        + default `-1`
    + page: `1` (string) - 第几页
    + limit: `2` (string) - 每页显示记录数
    + orderBy: `id` (string) - 排序的字段
        + default `id`
        + Members
            + `id`
            + `startTime`
            + `endTime`
            + `ctime`

+ Request

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMzU4MTcwNzE3MzM3NzIyODgiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NjczNTk1NywiZXhwIjoxNDg3MzQwNzU3fQ.AKKcqvp7uZddqXgVORx5aVf23rHABbRscFrjXxTj3Hk

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"perPage":"3","total":4,"items":[{"askPromotion":true,"bannerUrl":"http://tupian.enterdesk.com/2012/0525/1/7.jpg","basePrice":100.05,"categories":[1,2],"city":"北京","collectItems":[{"displayName":"姓名1","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":false,"itemId":"6236807176241942528","itemName":"username1","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"},{"displayName":"姓名2","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":false,"isUnique":false,"itemId":"6236807176241942529","itemName":"username2","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"}],"content":[{"content":"活动介绍","label":"活动介绍"},{"content":"活动详情","label":"活动详情"},{"content":"活动嘉宾","label":"活动嘉宾"}],"country":"北京","ctime":"2017-02-13T07:25:05.089Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","endTime":"2017-02-14T07:25:04.000Z","geohash":"wxaddjd","groupId":"123456789","id":"6236807176241942530","isCollectAttendees":true,"isPublic":true,"keyWords":["吹牛皮","赵洪禹"],"lat":39.111,"lng":11.111,"logoUrl":"http://tupian.enterdesk.com/2012/0525/1/9.jpg","maxFee":500.21,"onlineAddress":false,"organizerIds":["6236806774037549056"],"paymentAccountIds":["123456789","123456780"],"paymentAccountType":"online","paymentPriceUnit":"yuan","percent":1,"province":"北京","smsNotice":true,"startTime":"2017-02-13T07:25:04.000Z","tickets":[{"defaultPrice":100,"describe":"111","endSalesTime":"2017-02-14T07:25:04.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"free","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"isServiceFeeInclude":true,"ladderPriceSetting":[{"endTime":"2017-02-14T07:25:04.000Z","price":66,"startTime":"2017-02-13T07:25:04.000Z"},{"endTime":"2017-02-14T07:25:04.000Z","price":44,"startTime":"2017-02-13T07:25:04.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票121","needAudit":false,"soldCount":0,"startSalesTime":"2017-02-13T07:25:04.000Z","status":"normal","ticketId":"6236807176237748224","ticketServiceFee":80,"totalCount":88},{"defaultPrice":100,"describe":"111","endSalesTime":"2017-02-14T07:25:04.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"discount","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"isServiceFeeInclude":true,"ladderPriceSetting":[{"endTime":"2017-02-14T07:25:04.000Z","price":66,"startTime":"2017-02-13T07:25:04.000Z"},{"endTime":"2017-02-14T07:25:04.000Z","price":44,"startTime":"2017-02-13T07:25:04.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票122","needAudit":false,"soldCount":0,"startSalesTime":"2017-02-13T07:25:04.000Z","status":"normal","ticketId":"6236807176237748225","ticketServiceFee":80,"totalCount":88}],"title":"吹a牛皮大会4","userId":"6235817071733772288","utime":"2017-02-13T07:25:05.089Z","zipCode":"100010"},{"askPromotion":true,"bannerUrl":"http://tupian.enterdesk.com/2012/0525/1/7.jpg","basePrice":100.05,"categories":[1,2],"city":"北京","collectItems":[{"displayName":"姓名1","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":false,"itemId":"6236806923400908800","itemName":"username1","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"},{"displayName":"姓名2","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":false,"isUnique":false,"itemId":"6236806923400908801","itemName":"username2","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"}],"content":[{"content":"活动介绍","label":"活动介绍"},{"content":"活动详情","label":"活动详情"},{"content":"活动嘉宾","label":"活动嘉宾"}],"country":"北京","ctime":"2017-02-13T07:24:04.806Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","endTime":"2017-02-14T07:24:04.000Z","geohash":"wxaddjd","groupId":"123456789","id":"6236806923405103104","isCollectAttendees":true,"isPublic":true,"keyWords":["吹牛皮","赵洪禹"],"lat":39.111,"lng":11.111,"logoUrl":"http://tupian.enterdesk.com/2012/0525/1/9.jpg","maxFee":500.21,"onlineAddress":false,"organizerIds":["6236806774037549056"],"paymentAccountIds":["123456789","123456780"],"paymentAccountType":"online","paymentPriceUnit":"yuan","percent":1,"province":"北京","smsNotice":true,"startTime":"2017-02-13T07:24:04.000Z","tickets":[{"defaultPrice":100,"describe":"111","endSalesTime":"2017-02-14T07:24:04.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"free","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"isServiceFeeInclude":true,"ladderPriceSetting":[{"endTime":"2017-02-14T07:24:04.000Z","price":66,"startTime":"2017-02-13T07:24:04.000Z"},{"endTime":"2017-02-14T07:24:04.000Z","price":44,"startTime":"2017-02-13T07:24:04.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票121","needAudit":false,"soldCount":0,"startSalesTime":"2017-02-13T07:24:04.000Z","status":"normal","ticketId":"6236806923392520192","ticketServiceFee":80,"totalCount":88},{"defaultPrice":100,"describe":"111","endSalesTime":"2017-02-14T07:24:04.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"discount","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"isServiceFeeInclude":true,"ladderPriceSetting":[{"endTime":"2017-02-14T07:24:04.000Z","price":66,"startTime":"2017-02-13T07:24:04.000Z"},{"endTime":"2017-02-14T07:24:04.000Z","price":44,"startTime":"2017-02-13T07:24:04.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票122","needAudit":false,"soldCount":0,"startSalesTime":"2017-02-13T07:24:04.000Z","status":"normal","ticketId":"6236806923392520193","ticketServiceFee":80,"totalCount":88}],"title":"吹a牛皮大会3","userId":"6235817071733772288","utime":"2017-02-13T07:24:04.806Z","zipCode":"100010"},{"askPromotion":true,"bannerUrl":"http://tupian.enterdesk.com/2012/0525/1/7.jpg","basePrice":100.05,"categories":[1,2],"city":"北京","collectItems":[{"displayName":"姓名1","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":false,"itemId":"6236806902412611586","itemName":"username1","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"},{"displayName":"姓名2","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":false,"isUnique":false,"itemId":"6236806902412611587","itemName":"username2","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"}],"content":[{"content":"活动介绍","label":"活动介绍"},{"content":"活动详情","label":"活动详情"},{"content":"活动嘉宾","label":"活动嘉宾"}],"country":"北京","ctime":"2017-02-13T07:23:59.804Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","endTime":"2017-02-14T07:23:59.000Z","geohash":"wxaddjd","groupId":"123456789","id":"6236806902421000192","isCollectAttendees":true,"isPublic":true,"keyWords":["吹牛皮","赵洪禹"],"lat":39.111,"lng":11.111,"logoUrl":"http://tupian.enterdesk.com/2012/0525/1/9.jpg","maxFee":500.21,"onlineAddress":false,"organizerIds":["6236806774037549056"],"paymentAccountIds":["123456789","123456780"],"paymentAccountType":"online","paymentPriceUnit":"yuan","percent":1,"province":"北京","smsNotice":true,"startTime":"2017-02-13T07:23:59.000Z","tickets":[{"defaultPrice":100,"describe":"111","endSalesTime":"2017-02-14T07:23:59.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"free","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"isServiceFeeInclude":true,"ladderPriceSetting":[{"endTime":"2017-02-14T07:23:59.000Z","price":66,"startTime":"2017-02-13T07:23:59.000Z"},{"endTime":"2017-02-14T07:23:59.000Z","price":44,"startTime":"2017-02-13T07:23:59.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票121","needAudit":false,"soldCount":0,"startSalesTime":"2017-02-13T07:23:59.000Z","status":"normal","ticketId":"6236806902412611584","ticketServiceFee":80,"totalCount":88},{"defaultPrice":100,"describe":"111","endSalesTime":"2017-02-14T07:23:59.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"discount","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"isServiceFeeInclude":true,"ladderPriceSetting":[{"endTime":"2017-02-14T07:23:59.000Z","price":66,"startTime":"2017-02-13T07:23:59.000Z"},{"endTime":"2017-02-14T07:23:59.000Z","price":44,"startTime":"2017-02-13T07:23:59.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票122","needAudit":false,"soldCount":0,"startSalesTime":"2017-02-13T07:23:59.000Z","status":"normal","ticketId":"6236806902412611585","ticketServiceFee":80,"totalCount":88}],"title":"吹a牛皮大会2","userId":"6235817071733772288","utime":"2017-02-13T07:23:59.804Z","zipCode":"100010"}],"currentPageTotal":3,"totalPage":2,"page":"1"}

## 活动详情 [/event/get/{eventId}]

### 根据活动id查询活动详情 [GET]
根据活动id查询活动详情

+ Parameters

    + eventId: `6217279541266747392` (string) - 活动主键id

+ Request

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA2NDYzNSwiZXhwIjoxNDg1NjY5NDM1fQ.dt2mQ3yi65Uk7WOVRVdXBxtfdd_rLnK2wEj1yT7zwkg

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"askPromotion":true,"bannerUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","basePrice":100.05,"categories":[1,2],"city":"北京","collectItems":[{"displayName":"姓名1","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":true,"isUnique":false,"itemId":"6228816564121112576","itemName":"username1","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"},{"displayName":"姓名2","displayOrder":0,"fieldType":"text","isDeleted":false,"isRequired":false,"isUnique":false,"itemId":"6228816564121112576","itemName":"username2","itemValues":[{"isDefault":false,"option":"选项1","value":"选项1的值"},{"isDefault":true,"option":"选项2","value":"选项2的值"},{"isDefault":false,"option":"选项3","value":"选项3的值"}],"maxFileSize":100,"regexp":"[\\\\S]{1,128}"}],"content":[{"content":"活动介绍","label":"活动介绍"},{"content":"活动详情","label":"活动详情"},{"content":"活动嘉宾","label":"活动嘉宾"}],"country":"北京","ctime":"2017-01-22T06:32:51.412Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","endTime":"2017-01-23T06:32:51.000Z","geohash":"wxaddjd","groupId":"123456789","id":"6228821499604766720","isCollectAttendees":true,"isPublic":true,"keyWords":["北京会唐网","会鸽网"],"lat":39.111,"lng":11.111,"logoUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","maxFee":500.21,"onlineAddress":false,"organizerIds":[""],"paymentAccountIds":["123456789","123456780"],"paymentAccountType":"online","paymentPriceUnit":"yuan","percent":1,"province":"北京","smsNotice":true,"startTime":"2017-01-22T06:32:51.000Z","tickets":[{"defaultPrice":100,"describe":"111","endSalesTime":"2017-01-23T06:32:51.000Z","groupPurchaseTicketSetting":{"discountPrice":20,"giveNumber":5,"isAllowDiscount":false,"minGroupCount":10},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-01-23T06:32:51.000Z","price":66,"startTime":"2017-01-22T06:32:51.000Z"},{"endTime":"2017-01-23T06:32:51.000Z","price":44,"startTime":"2017-01-22T06:32:51.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票121","needAudit":false,"soldCount":0,"startSalesTime":"2017-01-22T06:32:51.000Z","status":"normal","ticketServiceFee":80,"totalCount":88},{"defaultPrice":100,"describe":"111","endSalesTime":"2017-01-23T06:32:51.000Z","groupPurchaseTicketSetting":{"discountPrice":20,"giveNumber":5,"isAllowDiscount":false,"minGroupCount":10},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-01-23T06:32:51.000Z","price":66,"startTime":"2017-01-22T06:32:51.000Z"},{"endTime":"2017-01-23T06:32:51.000Z","price":44,"startTime":"2017-01-22T06:32:51.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票122","needAudit":false,"soldCount":0,"startSalesTime":"2017-01-22T06:32:51.000Z","status":"normal","ticketServiceFee":80,"totalCount":88}],"title":"测试活动333","userId":"6222384718470582272","utime":"2017-01-22T06:32:51.412Z","zipCode":"100010"}

## 删除活动 [/event/delete]

### 根据活动id删除活动 [POST]
根据活动id删除活动

+ Request (application/json; charset=utf-8)

    + Headers

            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMTcyNDA2MDQwNzQ3MDg5OTIiLCJ1c2VybmFtZSI6InpoYW9ob25neXUiLCJpYXQiOjE0ODIzMTQ0NzksImV4cCI6MTQ4MjMxNzQ3OX0.FDWkaV4RPKLw1zskaek2OPLmXSl2cqseBHvFBXxihEA

    + Body

            {
                "id": "6217279541266747392"
            }

+ Response 200 (application/json; charset=utf-8)

    + Body

            {
              "deleted": 1,
              "errors": 0,
              "inserted": 0,
              "replaced": 0,
              "skipped": 0,
              "unchanged": 0
            }

# Group 设置活动推荐
设置活动推荐

## 会鸽首页接口 [/recommend/index]
### 会鸽首页接口 [GET]
会鸽首页接口

+ Request

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"bannerEventList":[{"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T11:09:29.073Z","displayOrder":4,"id":"6228891115236495360","objectId":"6228890527861968896","objectType":"bannerEvent","utime":"2017-01-22T11:09:29.073Z","object":{"id":"6228890527861968896","name":"测试活动333","bannerUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","startTime":"2017-01-22T11:07:08.000Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","categories":[1,2],"categoriesStrArr":["IT/互联网","医药/生物"],"categoriesStr":"IT/互联网,医药/生物"}},{"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T11:09:25.148Z","displayOrder":4,"id":"6228891098782240768","objectId":"6228890527861968896","objectType":"bannerEvent","utime":"2017-01-22T11:09:25.148Z","object":{"id":"6228890527861968896","name":"测试活动333","bannerUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","startTime":"2017-01-22T11:07:08.000Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","categories":[1,2],"categoriesStrArr":["IT/互联网","医药/生物"],"categoriesStr":"IT/互联网,医药/生物"}}],"hotEventList":[{"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T11:09:32.022Z","displayOrder":2,"id":"6228891127605497856","objectId":"6228890527861968896","objectType":"hotEvent","utime":"2017-01-22T11:09:32.022Z","object":{"id":"6228890527861968896","name":"测试活动333","bannerUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","startTime":"2017-01-22T11:07:08.000Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","categories":[1,2],"categoriesStrArr":["IT/互联网","医药/生物"],"categoriesStr":"IT/互联网,医药/生物"}},{"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T11:09:31.187Z","displayOrder":2,"id":"6228891124103254016","objectId":"6228890527861968896","objectType":"hotEvent","utime":"2017-01-22T11:09:31.187Z","object":{"id":"6228890527861968896","name":"测试活动333","bannerUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","startTime":"2017-01-22T11:07:08.000Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","categories":[1,2],"categoriesStrArr":["IT/互联网","医药/生物"],"categoriesStr":"IT/互联网,医药/生物"}}],"cityList":[{"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T11:09:37.742Z","displayOrder":4,"id":"6228891151596916736","objectId":"南京","objectType":"city","utime":"2017-01-22T11:09:37.742Z"},{"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T11:09:44.964Z","displayOrder":4,"id":"6228891181888180224","objectId":"北京","objectType":"city","utime":"2017-01-22T11:09:44.964Z"},{"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T11:09:50.387Z","displayOrder":4,"id":"6228891204633890816","objectId":"天津","objectType":"city","utime":"2017-01-22T11:09:50.387Z"}],"groupList":[{"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T11:09:34.018Z","displayOrder":3,"id":"6228891135977328640","objectId":"这里应该是群组id4","objectType":"group","utime":"2017-01-22T11:09:34.018Z"},{"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T11:09:34.774Z","displayOrder":3,"id":"6228891139152416768","objectId":"这里应该是群组id4","objectType":"group","utime":"2017-01-22T11:09:34.774Z"},{"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T11:09:35.644Z","displayOrder":3,"id":"6228891142797266944","objectId":"这里应该是群组id4","objectType":"group","utime":"2017-01-22T11:09:35.644Z"}],"categoryList":[{"name":"IT/互联网","value":1,"img":"/images/it.png"},{"name":"医药/生物","value":2,"img":"/images/yy.png"},{"name":"讲座/沙龙","value":3,"img":"/images/jz.png"},{"name":"艺术/音乐","value":4,"img":"/images/ys.png"},{"name":"宴会","value":5,"img":"/images/yh.png"},{"name":"商务/金融","value":6,"img":"/images/sw.png"},{"name":"运动/亲子","value":7,"img":"/images/yd.png"},{"name":"其他","value":8,"img":"/images/qt.png"}]}

## 根据推荐活动类型分页查询推荐活动列表 [/recommend/getRecommendByObjectTypeAndPageIndex{?objectType}{&orderBy}{&page}{&limit}]
### 根据推荐活动类型分页查询推荐活动列表 [GET]
根据推荐活动类型分页查询推荐活动列表

+ Parameters

    + objectType: `hotEvent` (string) - 推荐类型
        + Members
          + `bannerEvent`
          + `hotEvent`
          + `group`
          + `city`
    + page: `1` (string) - 第几页
    + limit: `2` (string) - 每页显示记录数
    + orderBy: `displayOrder` (string) - 排序的字段
        + default `displayOrder`
        + Members
            + `displayOrder`

+ Request

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"perPage":"3","total":2,"items":[{"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T11:09:31.187Z","displayOrder":2,"id":"6228891124103254016","objectId":"6228890527861968896","objectType":"hotEvent","utime":"2017-01-22T11:09:31.187Z","object":{"id":"6228890527861968896","name":"测试活动333","bannerUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","startTime":"2017-01-22T11:07:08.000Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","categories":[1,2],"categoriesStrArr":["IT/互联网","医药/生物"],"categoriesStr":"IT/互联网,医药/生物"}},{"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T11:09:32.022Z","displayOrder":2,"id":"6228891127605497856","objectId":"6228890527861968896","objectType":"hotEvent","utime":"2017-01-22T11:09:32.022Z","object":{"id":"6228890527861968896","name":"测试活动333","bannerUrl":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","startTime":"2017-01-22T11:07:08.000Z","detailedAddress":"北京市朝阳区朝阳路泰禾文化大厦A座4层会唐网","categories":[1,2],"categoriesStrArr":["IT/互联网","医药/生物"],"categoriesStr":"IT/互联网,医药/生物"}}],"currentPageTotal":2,"totalPage":1,"page":"1"}

## 设置一个活动为推荐活动 [/recommend/add]
### 设置一个活动为推荐活动 [POST]
设置一个活动为推荐活动

+ Parameters

    + objectId: `6217240604074708992` (string) - 被推荐条目的主键id
    + banner: `https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png` (string) - 被推荐条目的展示用到的图片地址
    + objectType: `bannerEvent` (string) - 推荐类型(bannerEvent推荐,hotEvent推荐,group推荐,city推荐)
        + Members
            + `bannerEvent` banner推荐
            + `hotEvent` 热门活动
            + `group` 热门群组
            + `city` 热门地区

    + displayOrder: `2` (string) - 排序值,升序排序

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIwMzkwMjUxMDUxMTMwODgiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA3NTMwMiwiZXhwIjoxNDg1NjgwMTAyfQ.6SlOIhZOOvY3dYrmD7bdRo3n_ZPxupurLIFiRZQg0P8

    + Body

            {
                "objectId": "6228863625898102784",
                "banner": "https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png",
                "objectType": "bannerEvent",
                "displayOrder": "2"
            }

+ Response 201 (application/json; charset=utf-8)

    + Body

            {"objectId":"6228863625898102784","banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","objectType":"bannerEvent","displayOrder":2,"ctime":"2017-01-22T10:20:45.061Z","utime":"2017-01-22T10:20:45.061Z","id":"6228878851041267712"}

## 根据主键id删除活动推荐 [/recommend/del]

### 根据主键id删除活动推荐 [POST]
根据主键id删除活动推荐

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIwMzkwMjUxMDUxMTMwODgiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA3NTMwMiwiZXhwIjoxNDg1NjgwMTAyfQ.6SlOIhZOOvY3dYrmD7bdRo3n_ZPxupurLIFiRZQg0P8

    + Body

            {
                "id": "6228878851041267712"
            }

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"deleted":1,"errors":0,"inserted":0,"replaced":0,"skipped":0,"unchanged":0}

## 根据主键id更新活动推荐 [/recommend/update]

### 根据主键id更新活动推荐 [POST]
根据主键id更新活动推荐

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIwMzkwMjUxMDUxMTMwODgiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA3NTMwMiwiZXhwIjoxNDg1NjgwMTAyfQ.6SlOIhZOOvY3dYrmD7bdRo3n_ZPxupurLIFiRZQg0P8

    + Body

            {
                "id": "6228878851041267712",
                "objectId": "6228863625898102784",
                "banner": "https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png",
                "objectType": "bannerEvent",
                "displayOrder": "3"
            }

+ Response 201 (application/json; charset=utf-8)

    + Body

            {"banner":"https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white_fe6da1ec.png","ctime":"2017-01-22T10:20:45.061Z","displayOrder":"3","id":"6228878851041267712","objectId":"6228863625898102784","objectType":"bannerEvent","utime":"2017-01-22T10:20:47.442Z"}

# Group 门票设置

## 为活动添加多张门票 [/ticket/addTickets]

### 为活动添加多张门票 [POST]
为活动添加多张门票

+ Parameters

    + eventId: `6217279541266747392` (string) - 活动主键id
    + tickets:  (object) - 门票

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA2NDYzNSwiZXhwIjoxNDg1NjY5NDM1fQ.dt2mQ3yi65Uk7WOVRVdXBxtfdd_rLnK2wEj1yT7zwkg

    + Body

            {
                "eventId": "6228850641452797952",
                "tickets": [
                    {
                        "name": "第八届互联网吹牛皮大会门票1212",
                        "describe": "111",
                        "needAudit": false,
                        "defaultPrice": 100,
                        "startSalesTime": "2017-01-22T08:46:16.000Z",
                        "endSalesTime": "2017-01-23T08:46:16.000Z",
                        "totalCount": 88,
                        "soldCount": 0,
                        "minCount": 1,
                        "maxCount": 100,
                        "ladderPriceSetting": [
                            {
                                "startTime": "2017-01-22T08:46:16.000Z",
                                "endTime": "2017-01-23T08:46:16.000Z",
                                "price": 66
                            },
                            {
                                "startTime": "2017-01-22T08:46:16.000Z",
                                "endTime": "2017-01-23T08:46:16.000Z",
                                "price": 44
                            }
                        ],
                        "isContainFee": true,
                        "ticketServiceFee": 80,
                        "isMemberOnlyTicket": false,
                        "isAllowGroupPurchase": false,
                        "groupPurchaseTicketSetting": {
                            "minGroupCount": 10,
                            "preferentialType": "free",
                            "value": 5,
                            "isAllowDiscount": false
                        }
                    },
                    {
                        "name": "第八届互联网吹牛皮大会门票1223",
                        "describe": "111",
                        "needAudit": false,
                        "defaultPrice": 100,
                        "startSalesTime": "2017-01-22T08:46:16.000Z",
                        "endSalesTime": "2017-01-23T08:46:16.000Z",
                        "totalCount": 88,
                        "soldCount": 0,
                        "minCount": 1,
                        "maxCount": 100,
                        "ladderPriceSetting": [
                            {
                                "startTime": "2017-01-22T08:46:16.000Z",
                                "endTime": "2017-01-23T08:46:16.000Z",
                                "price": 66
                            },
                            {
                                "startTime": "2017-01-22T08:46:16.000Z",
                                "endTime": "2017-01-23T08:46:16.000Z",
                                "price": 44
                            }
                        ],
                        "isContainFee": true,
                        "ticketServiceFee": 80,
                        "isMemberOnlyTicket": false,
                        "isAllowGroupPurchase": false,
                        "groupPurchaseTicketSetting": {
                            "minGroupCount": 10,
                            "preferentialType": "discount",
                            "value": 5,
                            "isAllowDiscount": false
                        }
                    }
                ]
            }

+ Response 200 (application/json; charset=utf-8)

    + Body

            [{"name":"第八届互联网吹牛皮大会门票1212","describe":"111","needAudit":false,"defaultPrice":100,"startSalesTime":"2017-01-22T08:30:50.000Z","endSalesTime":"2017-01-23T08:30:50.000Z","totalCount":88,"soldCount":0,"minCount":1,"maxCount":100,"ladderPriceSetting":[{"startTime":"2017-01-22T08:30:50.000Z","endTime":"2017-01-23T08:30:50.000Z","price":66},{"startTime":"2017-01-22T08:30:50.000Z","endTime":"2017-01-23T08:30:50.000Z","price":44}],"isContainFee":true,"ticketServiceFee":80,"isMemberOnlyTicket":false,"isAllowGroupPurchase":false,"groupPurchaseTicketSetting":{"minGroupCount":10,"preferentialType":"free","value":5,"isAllowDiscount":false},"status":"normal"},{"name":"第八届互联网吹牛皮大会门票1223","describe":"111","needAudit":false,"defaultPrice":100,"startSalesTime":"2017-01-22T08:30:50.000Z","endSalesTime":"2017-01-23T08:30:50.000Z","totalCount":88,"soldCount":0,"minCount":1,"maxCount":100,"ladderPriceSetting":[{"startTime":"2017-01-22T08:30:50.000Z","endTime":"2017-01-23T08:30:50.000Z","price":66},{"startTime":"2017-01-22T08:30:50.000Z","endTime":"2017-01-23T08:30:50.000Z","price":44}],"isContainFee":true,"ticketServiceFee":80,"isMemberOnlyTicket":false,"isAllowGroupPurchase":false,"groupPurchaseTicketSetting":{"minGroupCount":10,"preferentialType":"discount","value":5,"isAllowDiscount":false},"status":"normal"}]

## 为活动设置门票 [/ticket/add]

### 为活动设置门票 [POST]
为活动设置门票

+ Parameters

    + eventId: `6217279541266747392` (string) - 活动主键id
    + name: `世界互联网大会门票` (string) - 门票的名称
    + describe: `门票门票速度多少` (string) - 门票的描述
    + needAudit: `true` (boolean) - 是否需要审核
        + Default: `false`
    + defaultPrice: `100` (number) - 门票的默认价格
    + startSalesTime: `100` (string) - 门票的开始时间
    + endSalesTime: `100` (string) - 门票的结束时间
    + totalCount: `100` (number) - 总库存
    + soldCount: `100` (number) - 已售数量
    + status: `normal` (string) - 门票的状态

        + Members
            + `normal`
            + `deleted`
        + Default: `normal`
    + minCount: `100` (number) - 每个订单最少购买张数 默认: 1
    + maxCount: `100` (number) - 每个订单最大购张数 默认: 100
    + ladderPriceSetting: (array) - 阶梯价设置
    + isContainFee: `true` (boolean) - 是否包含服务费
        + Default: `true`
    + ticketServiceFee: `10` (number) - 服务费
    + isMemberOnlyTicket: `true` (boolean) - 是否只允许群组会员进行购买
            + Default: `false`
    + isAllowGroupPurchase: `true` (boolean) - 是否允许团购
            + Default: `false`
    + groupPurchaseTicketSetting:  (object) - 团购设置

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA2NDYzNSwiZXhwIjoxNDg1NjY5NDM1fQ.dt2mQ3yi65Uk7WOVRVdXBxtfdd_rLnK2wEj1yT7zwkg

    + Body

            {
                "eventId": "6228850641452797952",
                "name": "第八届互联网吹牛皮大会门票123",
                "describe": "111",
                "needAudit": false,
                "defaultPrice": 100,
                "startSalesTime": "2017-01-22T08:46:48.000Z",
                "endSalesTime": "2017-01-23T08:46:48.000Z",
                "totalCount": 88,
                "soldCount": 0,
                "minCount": 1,
                "maxCount": 100,
                "ladderPriceSetting": [
                    {
                        "startTime": "2017-01-22T08:46:48.000Z",
                        "endTime": "2017-01-23T08:46:48.000Z",
                        "price": 66
                    },
                    {
                        "startTime": "2017-01-22T08:46:48.000Z",
                        "endTime": "2017-01-23T08:46:48.000Z",
                        "price": 44
                    }
                ],
                "isContainFee": true,
                "ticketServiceFee": 80,
                "isMemberOnlyTicket": false,
                "isAllowGroupPurchase": false,
                "groupPurchaseTicketSetting": {
                    "minGroupCount": 10,
                    "preferentialType": "free",
                    "value": 5,
                    "isAllowDiscount": false
                }
            }

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"name":"第八届互联网吹牛皮大会门票123","describe":"111","needAudit":false,"defaultPrice":100,"startSalesTime":"2017-01-22T08:31:06.000Z","endSalesTime":"2017-01-23T08:31:06.000Z","totalCount":88,"soldCount":0,"minCount":1,"maxCount":100,"ladderPriceSetting":[{"startTime":"2017-01-22T08:31:06.000Z","endTime":"2017-01-23T08:31:06.000Z","price":66},{"startTime":"2017-01-22T08:31:06.000Z","endTime":"2017-01-23T08:31:06.000Z","price":44}],"isContainFee":true,"ticketServiceFee":80,"isMemberOnlyTicket":false,"isAllowGroupPurchase":false,"groupPurchaseTicketSetting":{"minGroupCount":10,"preferentialType":"free","value":5,"isAllowDiscount":false},"status":"normal"}

## 更新门票信息 [/ticket/update]

### 更新门票信息 [POST]
更新门票信息

+ Parameters

    + originTicketName: `第八届互联网吹牛皮大会门票5` (string) - 门票名称,如果需要更新门票名称的话需要同时传递此字段

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA2NDYzNSwiZXhwIjoxNDg1NjY5NDM1fQ.dt2mQ3yi65Uk7WOVRVdXBxtfdd_rLnK2wEj1yT7zwkg

    + Body

            {
                "eventId": "6228850641452797952",
                "originTicketName": "第八届互联网吹牛皮大会门票123",
                "name": "第八届互联网吹牛皮大会门票123",
                "describe": "这里是门票的描述77777",
                "needAudit": false,
                "defaultPrice": 123,
                "startSalesTime": "2017-01-22T08:47:35.000Z",
                "endSalesTime": "2017-01-23T08:47:35.000Z",
                "totalCount": 88,
                "soldCount": 0,
                "minCount": 122,
                "maxCount": 100,
                "ladderPriceSetting": [
                    {
                        "startTime": "2017-01-22T08:47:35.000Z",
                        "endTime": "2017-01-23T08:47:35.000Z",
                        "price": 787878
                    },
                    {
                        "startTime": "2017-01-22T08:47:35.000Z",
                        "endTime": "2017-01-23T08:47:35.000Z",
                        "price": 123456
                    }
                ],
                "isContainFee": true,
                "ticketServiceFee": 80,
                "isMemberOnlyTicket": true,
                "isAllowGroupPurchase": true,
                "groupPurchaseTicketSetting": {
                    "minGroupCount": 10,
                    "preferentialType": "free",
                    "value": 5,
                    "isAllowDiscount": false
                }
            }

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"defaultPrice":123,"describe":"这里是门票的描述77777","endSalesTime":"2017-01-23T08:31:11.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"free","value":5},"isAllowGroupPurchase":true,"isContainFee":true,"isMemberOnlyTicket":true,"ladderPriceSetting":[{"endTime":"2017-01-23T08:31:11.000Z","price":787878,"startTime":"2017-01-22T08:31:11.000Z"},{"endTime":"2017-01-23T08:31:11.000Z","price":123456,"startTime":"2017-01-22T08:31:11.000Z"}],"maxCount":100,"minCount":122,"name":"第八届互联网吹牛皮大会门票123","needAudit":false,"soldCount":0,"startSalesTime":"2017-01-22T08:31:11.000Z","status":"normal","ticketServiceFee":80,"totalCount":88}

## 删除门票 [/ticket/delete]

### 删除门票 [POST]
删除门票

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIwMzkwMjUxMDUxMTMwODgiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NDY0Njc1NSwiZXhwIjoxNDg1MjUxNTU1fQ.WzSWNo3pAh4wTJqqiJpPCn9Nq_HzlY0soxeRZ2wXLhk

    + Body

            {
                "eventId": "6227067372734386176",
                "name": "第八届互联网吹牛皮大会门票5"
            }

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"defaultPrice":100,"describe":"55555","endSalesTime":"2017-01-17T10:29:16.000Z","groupPurchaseTicketSetting":{"discountPrice":20,"giveNumber":5,"isAllowDiscount":false,"minGroupCount":10},"isAllowGroupPurchase":true,"isContainFee":true,"isMemberOnlyTicket":true,"ladderPriceSetting":[{"endTime":"2017-01-18T10:29:16.000Z","price":66,"startTime":"2017-01-17T10:29:16.000Z"},{"endTime":"2017-01-18T10:29:16.000Z","price":44,"startTime":"2017-01-17T10:29:16.000Z"}],"maxCount":100,"minCount":122,"name":"第八届互联网吹牛皮大会门票5","needAudit":false,"soldCount":0,"startSalesTime":"2017-01-17T10:29:16.000Z","status":"deleted","ticketServiceFee":80,"totalCount":88}

## 根据活动id获取门票列表 [/event/tickets/{eventId}]

### 根据活动id获取门票列表 [GET]
根据活动id获取门票列表

+ Parameters

    + eventId: `6227067372734386176` (string) - 活动主键id

+ Request

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA2NDYzNSwiZXhwIjoxNDg1NjY5NDM1fQ.dt2mQ3yi65Uk7WOVRVdXBxtfdd_rLnK2wEj1yT7zwkg

+ Response 200 (application/json; charset=utf-8)

    + Body

            [{"defaultPrice":100,"describe":"111","endSalesTime":"2017-01-23T08:28:55.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"free","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-01-23T08:28:55.000Z","price":66,"startTime":"2017-01-22T08:28:55.000Z"},{"endTime":"2017-01-23T08:28:55.000Z","price":44,"startTime":"2017-01-22T08:28:55.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票121","needAudit":false,"soldCount":0,"startSalesTime":"2017-01-22T08:28:55.000Z","status":"normal","ticketServiceFee":80,"totalCount":88},{"defaultPrice":100,"describe":"111","endSalesTime":"2017-01-23T08:28:55.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"discount","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-01-23T08:28:55.000Z","price":66,"startTime":"2017-01-22T08:28:55.000Z"},{"endTime":"2017-01-23T08:28:55.000Z","price":44,"startTime":"2017-01-22T08:28:55.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票122","needAudit":false,"soldCount":0,"startSalesTime":"2017-01-22T08:28:55.000Z","status":"normal","ticketServiceFee":80,"totalCount":88},{"defaultPrice":100,"describe":"111","endSalesTime":"2017-01-23T08:30:50.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"free","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-01-23T08:30:50.000Z","price":66,"startTime":"2017-01-22T08:30:50.000Z"},{"endTime":"2017-01-23T08:30:50.000Z","price":44,"startTime":"2017-01-22T08:30:50.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票1212","needAudit":false,"soldCount":0,"startSalesTime":"2017-01-22T08:30:50.000Z","status":"normal","ticketServiceFee":80,"totalCount":88},{"defaultPrice":100,"describe":"111","endSalesTime":"2017-01-23T08:30:50.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"discount","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-01-23T08:30:50.000Z","price":66,"startTime":"2017-01-22T08:30:50.000Z"},{"endTime":"2017-01-23T08:30:50.000Z","price":44,"startTime":"2017-01-22T08:30:50.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票1223","needAudit":false,"soldCount":0,"startSalesTime":"2017-01-22T08:30:50.000Z","status":"normal","ticketServiceFee":80,"totalCount":88},{"defaultPrice":123,"describe":"这里是门票的描述77777","endSalesTime":"2017-01-23T08:31:11.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"free","value":5},"isAllowGroupPurchase":true,"isContainFee":true,"isMemberOnlyTicket":true,"ladderPriceSetting":[{"endTime":"2017-01-23T08:31:11.000Z","price":787878,"startTime":"2017-01-22T08:31:11.000Z"},{"endTime":"2017-01-23T08:31:11.000Z","price":123456,"startTime":"2017-01-22T08:31:11.000Z"}],"maxCount":100,"minCount":122,"name":"第八届互联网吹牛皮大会门票123","needAudit":false,"soldCount":0,"startSalesTime":"2017-01-22T08:31:11.000Z","status":"normal","ticketServiceFee":80,"totalCount":88}]

## 根据活动id和门票名称获取门票详情 [/event/getEventTicketDetail/{eventId}/{ticketName}]

### 根据活动id和门票名称获取门票详情 [GET]
根据活动id和门票名称获取门票详情

+ Parameters

    + eventId: `6227067372734386176` (string) - 活动主键id
    + ticketName: `第八届互联网吹牛皮大会门票1` (string) - 活动门票名称

+ Request

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NTA2NDYzNSwiZXhwIjoxNDg1NjY5NDM1fQ.dt2mQ3yi65Uk7WOVRVdXBxtfdd_rLnK2wEj1yT7zwkg

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"defaultPrice":100,"describe":"111","endSalesTime":"2017-01-23T08:28:55.000Z","groupPurchaseTicketSetting":{"isAllowDiscount":false,"minGroupCount":10,"preferentialType":"free","value":5},"isAllowGroupPurchase":false,"isContainFee":true,"isMemberOnlyTicket":false,"ladderPriceSetting":[{"endTime":"2017-01-23T08:28:55.000Z","price":66,"startTime":"2017-01-22T08:28:55.000Z"},{"endTime":"2017-01-23T08:28:55.000Z","price":44,"startTime":"2017-01-22T08:28:55.000Z"}],"maxCount":100,"minCount":1,"name":"第八届互联网吹牛皮大会门票121","needAudit":false,"soldCount":0,"startSalesTime":"2017-01-22T08:28:55.000Z","status":"normal","ticketServiceFee":80,"totalCount":88}
