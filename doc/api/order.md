FORMAT: 1A
HOST: http://qa.www.eventdove.com/api
# Eventdove API
欢迎使用 **Eventdove** API ，这些 API 提供了操作 **Eventdove** 数据的接口。
# Group 定单相关

## 生成定单 [/order/create]
### 生成定单 [POST]

+ Parameters
    + eventId (string,required) - 活动Id
    + userId (string,required) - 创建活动用户Id
    + order (array,required) - 定单信息
         + ticketName (String, required) - 票名称
         + total (number,required) - 票张数
         + attendees (array, required) - 参会者信息
    + buyer(Object,optional) - 购票人信息
         + 参会者模式
         + userName(string,optional) - 联系人名称
         + mail(string,optional) - 联系人邮箱
         + 购票者模式 参考attendees
    + amount (number,required) - 定单支付金额
    + platform (string, required) - 平台
    + invoice (Object,optional) - 发票
         + type (string,optional) -  发票类型
         + title (string,optional) - 发票抬头
         + serviceItem (string,optional) - 服务项目
         + deliver (string,optional) - 领取方式
         + receiver (string,optional) - 收件人
         + contact (string,optional) - 联系方式
         + address (string,optional) - 地址
         + note (string,optional) - 备注


+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

    + Body

            {
                "eventId": "6225578788202352640",
                "userId": "6222384465050734592",
                "order":
                [
                    {
                        "ticketName": "第八届互联网吹牛皮大会门票1",
                        "total": 2,
                        "attendees":
                        [
                            {
                                name        :  '王小二',
                                email       :  'wanger@163.com',
                                fieldName1  :  '有限责任公司'
                            },
                            {
                                name        :  '李四',
                                email       :  'lisi@163.com',
                                fieldName1  :  '无限责任公司'
                            }
                        ]
                    },
                    {
                        "ticketName": "第八届互联网吹牛皮大会门票2",
                        "total": 1,
                        "attendees":
                        [   
                            {
                                name        :  '张三',
                                email       :  'zhangshan@163.com',
                                fieldName1  :  '无限责任公司'
                            }    
                        ]
                    }
                ]
            },
            "amount": 188,
            "platform":'web',

            // 购票者信息
            buyer:
            {
                name    :  '张三',
                email   :  'zhangshan@163.com',
                fieldName1  :  '私人合伙企业'
            },

            invoice:
            {
                type     :  '普通发票',
                title    :  '会唐科技有限公司'，
                serviceItem : '信息服务费',
                deliver  :  '快递',
                receiver :  '武松'，
                contact  :  '1350123456',
                address  :  '北京东城区解放路101号',
                note     :  '没什么好备注的'
            }
        }

+ Response 200 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"54f-XIJwA9oi98wE0wbWDYx1PQ"

    + Body





## 根据活动Id查询定单 [/order/getOrderByEventId/{?eventId,page,limit}]
### 根据活动Id查询定单 [GET]
+ Parameters
    + page: `1` (number,optional) - 当前页数
    + limit: `10` (number,optional) - 每一页数量
    + eventId (string,required) - 活动Id
+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

+ Response 200 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"5c0-ooDV8SKcH1WV642iW2MXPA"

    + Body

            {"items":[{"attendees":[{"barcode":"123456","checkedIn":false,"collectInfo":{"表单收集项1":"13511223311","表单收集项2":"张三"},"paymentStatus":0,"qrCodeContent":"123456","ticketName":"第八届互联网吹牛皮大会门票1"},{"barcode":"123456","checkedIn":false,"collectInfo":{"表单收集项1":"13511223322","表单收集项2":"李四"},"paymentStatus":0,"qrCodeContent":"123456","ticketName":"第八届互联网吹牛皮大会门票1"},{"barcode":"123456","checkedIn":false,"collectInfo":{"表单收集项1":"13511223333","表单收集项2":"王五"},"paymentStatus":0,"qrCodeContent":"123456","ticketName":"第八届互联网吹牛皮大会门票2"}],"cTime":"2017-01-18T06:47:26.647Z","currencyType":"yuan","eventId":"6225578788202352640","id":"6227375619139833856","mail":"test@163.com","orderDetails":[{"isContainFee":true,"ticketCount":2,"ticketFee":160,"ticketName":"第八届互联网吹牛皮大会门票1","ticketPrice":88,"ticketRawPrice":200},{"isContainFee":true,"ticketCount":1,"ticketFee":80,"ticketName":"第八届互联网吹牛皮大会门票2","ticketPrice":100,"ticketRawPrice":100}],"orderNumber":"148472204664692d8c0ef","paymentMethod":"none","phone":"133123456","purchasePlatform":"web","rawPriceTotal":300,"serviceFee":240,"status":"none","thirdPartyCharge":0,"totalPrice":188,"uTime":"2017-01-18T06:47:26.647Z","userId":"6222384465050734592","userName":"lxy11"}],"totalPage":1,"page":1,"total":1,"currentPageTatol":1,"perPage":10}

## 根据活定单号查询定单 [/order/getOrderByOrderNum/{orderNum}]
### 根据定单号查询定单 [GET]
根据定单号获取定单请求URL为RESTful风格
+ Parameters
    + orderNum (string,required) - 定单号
       + Default: `148472204664692d8c0ef`
+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

+ Response 200 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"573-fvr0IEG/jyJXPFaUUWXuMg"

    + Body

            [{"attendees":[{"barcode":"123456","checkedIn":false,"collectInfo":{"表单收集项1":"13511223311","表单收集项2":"张三"},"paymentStatus":0,"qrCodeContent":"123456","ticketName":"第八届互联网吹牛皮大会门票1"},{"barcode":"123456","checkedIn":false,"collectInfo":{"表单收集项1":"13511223322","表单收集项2":"李四"},"paymentStatus":0,"qrCodeContent":"123456","ticketName":"第八届互联网吹牛皮大会门票1"},{"barcode":"123456","checkedIn":false,"collectInfo":{"表单收集项1":"13511223333","表单收集项2":"王五"},"paymentStatus":0,"qrCodeContent":"123456","ticketName":"第八届互联网吹牛皮大会门票2"}],"cTime":"2017-01-18T06:47:26.647Z","currencyType":"yuan","eventId":"6225578788202352640","id":"6227375619139833856","mail":"test@163.com","orderDetails":[{"isContainFee":true,"ticketCount":2,"ticketFee":160,"ticketName":"第八届互联网吹牛皮大会门票1","ticketPrice":88,"ticketRawPrice":200},{"isContainFee":true,"ticketCount":1,"ticketFee":80,"ticketName":"第八届互联网吹牛皮大会门票2","ticketPrice":100,"ticketRawPrice":100}],"orderNumber":"148472204664692d8c0ef","paymentMethod":"none","phone":"133123456","purchasePlatform":"web","rawPriceTotal":300,"serviceFee":240,"status":"none","thirdPartyCharge":0,"totalPrice":188,"uTime":"2017-01-18T06:47:26.647Z","userId":"6222384465050734592","userName":"lxy11"}]


## 根据定单Id查询定单 [/order/getOrderById/{id}]
### 根据定单Id查询定单 [GET]
根据定单号获取定单请求URL为RESTful风格
+ Parameters
    + id (string,required) - 定单Id
       + Default: `6227375619139833856`

+ Request

   + Headers

           Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE



+ Response 200 (application/json; charset=utf-8)

   + Headers

           Access-Control-Allow-Origin: *
           X-Powered-By: Express
           Etag: W/"573-Nu3SE4QX+zYqlOjt76h4SA"

   + Body

           {"attendees":[{"barcode":"123456","checkedIn":false,"collectInfo":{"表单收集项1":"13511223311","表单收集项2":"张三"},"paymentStatus":0,"qrCodeContent":"123456","ticketName":"第八届互联网吹牛皮大会门票1"},{"barcode":"123456","checkedIn":false,"collectInfo":{"表单收集项1":"13511223322","表单收集项2":"李四"},"paymentStatus":0,"qrCodeContent":"123456","ticketName":"第八届互联网吹牛皮大会门票1"},{"barcode":"123456","checkedIn":false,"collectInfo":{"表单收集项1":"13511223333","表单收集项2":"王五"},"paymentStatus":0,"qrCodeContent":"123456","ticketName":"第八届互联网吹牛皮大会门票2"}],"cTime":"2017-01-18T06:47:26.647Z","currencyType":"yuan","eventId":"6225578788202352640","id":"6227375619139833856","mail":"test@163.com","orderDetails":[{"isContainFee":true,"ticketCount":2,"ticketFee":160,"ticketName":"第八届互联网吹牛皮大会门票1","ticketPrice":88,"ticketRawPrice":200},{"isContainFee":true,"ticketCount":1,"ticketFee":80,"ticketName":"第八届互联网吹牛皮大会门票2","ticketPrice":100,"ticketRawPrice":100}],"orderNumber":"148472204664692d8c0ef","paymentMethod":"none","phone":"133123456","purchasePlatform":"web","rawPriceTotal":300,"serviceFee":240,"status":"cancel","thirdPartyCharge":0,"totalPrice":188,"uTime":"2017-01-18T06:47:26.647Z","userId":"6222384465050734592","userName":"lxy11"}

## 根据定单Id删除定单 [/order/deleteOrder]
### 根据定单Id删除定单 [DELETE]
+ Parameters
    + id (string,required) - 定单Id
       + Default: `6227375619139833856`

+ Request (application/json; charset=utf-8)

   + Headers

           Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

   + Body

           {
               "orderId": "6227375619139833856"
           }

+ Response 200 (application/json; charset=utf-8)

   + Headers

           Access-Control-Allow-Origin: *
           X-Powered-By: Express
           Etag: W/"e-M9GwTpFmOdms9erGyiXyAg"

   + Body

           delete success

# Group 参会者相关
## 修改参会者 [/order/updateAttendee]
### 修改参会者 [POST]
+ Parameters
    + eventId (string,required) - 活动Id
    + orderId (string,required) - 定单Id
    + attendeeId (string,required) - 参会者Id
    + collectInfo (Object,required) - 参会者信息(采集项)

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

    + Body

            {
                "eventId": "6227803521635454976",
                "orderId": "6227782049630130176",
                "attendeeId": "6227782049625935873",
                "collectInfo": {
                    "表单收集项1": "13511226666",
                    "表单收集项2": "赵六"
                }
            }

+ Response 200 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"52c-SvgRQynlng1HedJyM+tM8g"

    + Body

            {"attendees":[{"attendeeId":"6227782049625935874","barcode":"123456","checkedIn":false,"collectInfo":{"表单收集项1":"13511223333","表单收集项2":"王五"},"paymentStatus":0,"qrCodeContent":"123456","ticketName":"第八届互联网吹牛皮大会门票122"},{"attendeeId":"6227782049625935873","barcode":"123456","checkedIn":false,"collectInfo":{"测试表单收集项添加4":"","测试表单收集项添加5":"","表单收集项1":"13511226666","表单收集项2":"赵六"},"paymentStatus":0,"qrCodeContent":"123456","ticketName":"第八届互联网吹牛皮大会门票121"}],"cTime":"2017-01-19T09:42:27.227Z","currencyType":"yuan","eventId":"6227778964480462848","id":"6227782049630130176","mail":"test@163.com","orderDetails":[{"isContainFee":true,"ticketCount":2,"ticketFee":160,"ticketName":"第八届互联网吹牛皮大会门票121","ticketPrice":132,"ticketRawPrice":100},{"isContainFee":true,"ticketCount":1,"ticketFee":80,"ticketName":"第八届互联网吹牛皮大会门票122","ticketPrice":66,"ticketRawPrice":100}],"orderNumber":"148481894722780019c0e","paymentMethod":"none","phone":"133123456","purchasePlatform":"web","rawPriceTotal":300,"serviceFee":240,"status":"none","thirdPartyCharge":0,"totalPrice":198,"uTime":"2017-01-19T09:42:27.227Z","userId":"6222384465050734592","userName":"lxy22"}

## 获取票剩余库存 [/order/getTicketInventory]
### 获取票剩余库存 [POST]
+ Parameters
    + eventId (string,required) - 活动Id
    + ticketName (string,required) - 票名称

+ Request (application/json; charset=utf-8)
    + Headers
            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

    + Body

            {
                "eventId": "6228890527861968896",
                "ticketName": "第八届互联网吹牛皮大会门票121"
            }

+ Response 400 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"2a-fJj6UCrvgc7U9qYNk50d8Q"

    + Body

            86


## 校验唯一采集项值是否唯一 [/order/isUnique]
### 校验唯一采集项值是否唯一 [POST]
+ Parameters
    + eventId (string,required) - 活动Id
    + value (string,required) - 唯一采集项值

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

    + Body

            {
                "eventId": "6228890527861968896",
                "value": "赵六1"
            }

+ Response 200 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"5-aJNKPpRV+nJCAjfrBZAjJw"

    + Body

            false
