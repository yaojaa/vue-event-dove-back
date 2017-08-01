FORMAT: 1A
HOST: http://qa.www.eventdove.com/api
# Eventdove API
欢迎使用 **Eventdove** API ，这些 API 提供了操作 **Eventdove** 数据的接口。
# Group 推广邮件短信相关
## 生成推广邮件短信 [/notice/addSmsEmailRecord]
### 生成推广邮件短信 [POST]
+ Parameters
    + receiver: `wanger@163.com,lisi@163.com`(string,required) - 短信或邮件收件人 备注: 多个以“,”隔开
    + content: `测试测试`(string,required) - 短信邮件发送的内容
    + scheduledSendTimeType: `timedTransmission`(string,required) - 任务执行的时间类型,立即发送"sendImmediately",定时发送"timedTransmission"
    + sendTime: `2429-12-30T00:00:00.000Z,`(date,optional) - 计划任务将要在什么时候执行的时间  备注: scheduledSendTimeType 为 sendImmediately 时该值为空或不填
    + type: `email`(number,required) - 记录类型,短信类型"sms",邮件类型"email"
    + title: `推广测试邮件` (string,optional) - 标题     备注: type 为 sms 时该值为空或不填
    + userId: `6235817071733772288`(number,required) - 用户Id
    + eventId:`6237218272375345156` (string,required) - 活动Id

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

    + Body

            {
                "title": "推广测试邮件",
                "receiver": "wanger@163.com,lisi@163.com",
                "content": "测试测试",
                "scheduledSendTimeType": "timedTransmission",
                "sendTime": "2429-12-30T00:00:00.000Z",
                "eventId": "6237218272375345156",
                "userId": "6235817071733772288",
                "type": "email"
            }

+ Response 200 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"20c-PwV1uuGCjs2m1ED1fSDUAg"

    + Body

            {"content":"测试测试","scheduledSendTimeType":"timedTransmission","eventId":"6237218272375345156","userId":"6235817071733772288","type":"email","scheduledSendTime":"2429-12-30T00:00:00.000Z","receivers":[{"receiverName":"","receiverNumber":"wanger@163.com","sendStatus":"toBeSent"},{"receiverName":"","receiverNumber":"lisi@163.com","sendStatus":"toBeSent"}],"templateId":"0","emailTitle":"","isDraft":false,"isDelete":false,"ctime":"2017-02-17T10:09:56.634Z","utime":"2017-02-17T10:09:56.634Z","id":"6238298215846907904"}

## 根据id查询邮件短信 [/notice/getEmailAndSmsRecord/:id/:userId]
### 根据id查询邮件短信 [GET]
根据根据id查询邮件短信请求URL为RESTful风格
实例: /notice/getEmailAndSmsRecord/6238258188760780800/6235817071733772288

+ Parameters
    + id:`6238298215846907904` (string,required) - 推广记录Id
    + userId:`6235817071733772288` (string,required) - 用户Id

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

    + Body

            {}

+ Response 200 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"20b-C1NTCC0YSIW5nc+jQPQCLg"

    + Body

            {"content":"测试测试","ctime":"2017-02-17T07:30:53.433Z","emailTitle":"","eventId":"6237218272375345156","id":"6238258188760780800","isDelete":true,"isDraft":false,"receivers":[{"receiverName":"","receiverNumber":"wanger@163.com","sendStatus":"toBeSent"},{"receiverName":"","receiverNumber":"lisi@163.com","sendStatus":"toBeSent"}],"scheduledSendTime":"2429-12-30T00:00:00.000Z","scheduledSendTimeType":"timedTransmission","templateId":"0","type":"sms","userId":"6235817071733772288","utime":"2017-02-17T07:30:53.433Z"}

## 分页查询邮件短信 [/notice/getAllEmailAndSmsRecord/{?eventId,type,state,page,limit,total}]
### 分页查询邮件短信 [GET]
+ Parameters
  + page: `1` (number,optional) - 当前页数
  + limit: `10`(number,optional) - 每一页数量
  + total: `-1`(number,optional) - 总记录数(备注：-1或不传为重查总记录数)
  + eventId:`6237218272375345156`(string,required) - 活动Id
  + type:`sms` (string,required) - 记录类型 sms: 短信 email: 邮件
  + state:`all` (string,required) - 记录状态  delete 查询删除  all 查询所有  not: 查询未删除

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

    + Body

            {}

+ Response 200 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"25b-0NlRY03+oNhhqP7BOLi8lA"

    + Body

            {"perPage":10,"total":1,"items":[{"content":"测试测试","ctime":"2017-02-17T07:30:53.433Z","emailTitle":"","eventId":"6237218272375345156","id":"6238258188760780800","isDelete":false,"isDraft":false,"receivers":[{"receiverName":"","receiverNumber":"wanger@163.com","sendStatus":"toBeSent"},{"receiverName":"","receiverNumber":"lisi@163.com","sendStatus":"toBeSent"}],"scheduledSendTime":"2429-12-30T00:00:00.000Z","scheduledSendTimeType":"timedTransmission","templateId":"0","type":"sms","userId":"6235817071733772288","utime":"2017-02-17T07:30:53.433Z"}],"currentPageTotal":1,"totalPage":1,"page":1}

## 删除查询邮件短信 [/notice/deleteSmsEmailRecord]
### 删除查询邮件短信 [DELETE]
+ Parameters
    + id:`6238298215846907904` (string,required) - 推广记录Id
    + userId:`6235817071733772288` (string,required) - 用户Id

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

    + Body

            {
                "id": "6238298215846907904",
                "userId": "6235817071733772288"
            }

+ Response 200 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"c-AAfRcN4Bfa/CZqoDkm1/AA"

    + Body

            删除成功
