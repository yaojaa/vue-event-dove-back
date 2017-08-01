FORMAT: 1A
HOST: http://qa.www.eventdove.com/api
# Eventdove API
欢迎使用 **Eventdove** API ，这些 API 提供了操作 **Eventdove** 数据的接口。
# Group 优惠码相关
## 根据活动Id查询优惠码 [/discount/getEventDiscount/{?eventId,total,page,limit}]
### 根据活动Id查询优惠码 [GET]
+ Parameters
    + page: `1` (number,optional) - 当前页数
    + limit: `10`(number,optional) - 每一页数量
    + total: `-1`(number,optional) - 总记录数(备注：-1或不传为重查总记录数)
    + eventId:`6237218272375345156` (string,required) - 活动Id

+ Request

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE



+ Response 200 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"5f6-O5U0WvZFbBbAyTfjHTRXUw"

    + Body

            {"perPage":10,"total":3,"items":[{"applyToAllTickets":true,"applyToTickets":["6237218272375345152","6237218272375345153"],"ctime":"2017-02-14T10:59:50.337Z","discountCode":"2zr2s5ru9bi8s0","discountExpiryDate":"custom","discountType":"fixed","discountTypeValue":50,"endTime":"2017-02-15T10:59:50.000Z","eventId":"6237218272375345156","generationMode":"random","id":"6237223608763158528","isDeleted":false,"maxUseCount":10,"startTime":"2017-02-14T10:59:50.000Z","totalUsedCount":0,"utime":"2017-02-14T10:59:50.337Z"},{"applyToAllTickets":true,"applyToTickets":["6237218272375345152","6237218272375345153"],"ctime":"2017-02-14T10:59:50.337Z","discountCode":"4zzs0l7tsdc088","discountExpiryDate":"custom","discountType":"fixed","discountTypeValue":50,"endTime":"2017-02-15T10:59:50.000Z","eventId":"6237218272375345156","generationMode":"random","id":"6237223608758964224","isDeleted":false,"maxUseCount":10,"startTime":"2017-02-14T10:59:50.000Z","totalUsedCount":0,"utime":"2017-02-14T10:59:50.337Z"},{"applyToAllTickets":true,"applyToTickets":["6237218272375345152","6237218272375345153"],"ctime":"2017-02-14T10:59:50.337Z","discountCode":"3fhdd2ol602so0","discountExpiryDate":"custom","discountType":"fixed","discountTypeValue":50,"endTime":"2017-02-15T10:59:50.000Z","eventId":"6237218272375345156","generationMode":"random","id":"6237223608750575616","isDeleted":true,"maxUseCount":10,"startTime":"2017-02-14T10:59:50.000Z","totalUsedCount":0,"utime":"2017-02-14T10:59:50.337Z"}],"currentPageTotal":3,"totalPage":1,"page":1}

## 根据Id删除优惠码 [/discount/delete]
### 根据Id删除优惠码 [DELETE]

+ Parameters
    + id:`6237223608758964224` (string,required) - 优惠码Id  批量删除格式: id1,id2

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

    + Body

            {
                "id": "6237223608758964224"
            }

+ Response 200 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"1e3-Y5ZXpdEY1eChW9G6XjnQJQ"

    + Body

            [{"applyToAllTickets":true,"applyToTickets":["6237218272375345152","6237218272375345153"],"ctime":"2017-02-14T10:59:50.337Z","discountCode":"4zzs0l7tsdc088","discountExpiryDate":"custom","discountType":"fixed","discountTypeValue":50,"endTime":"2017-02-15T10:59:50.000Z","eventId":"6237218272375345156","generationMode":"random","id":"6237223608758964224","isDeleted":true,"maxUseCount":10,"startTime":"2017-02-14T10:59:50.000Z","totalUsedCount":0,"utime":"2017-02-14T10:59:50.337Z"}]

## 根据Id获取优惠码 [/discount/get/{id}]
### 根据Id获取优惠码 [GET]

根据定单号获取定单请求URL为RESTful风格

+ Parameters
    + id (string,required) - 优惠码Id
       + Default: `6237223608763158528`

+ Request

   + Headers

           Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

+ Response 200 (application/json; charset=utf-8)

   + Headers

           Access-Control-Allow-Origin: *
           X-Powered-By: Express
           Etag: W/"1e2-DiFlzDS5BArLWYlHhZJEoA"

   + Body

           {"applyToAllTickets":true,"applyToTickets":["6237218272375345152","6237218272375345153"],"ctime":"2017-02-14T10:59:50.337Z","discountCode":"2zr2s5ru9bi8s0","discountExpiryDate":"custom","discountType":"fixed","discountTypeValue":50,"endTime":"2017-02-15T10:59:50.000Z","eventId":"6237218272375345156","generationMode":"random","id":"6237223608763158528","isDeleted":false,"maxUseCount":10,"startTime":"2017-02-14T10:59:50.000Z","totalUsedCount":0,"utime":"2017-02-14T10:59:50.337Z"}

## 修改优惠码 [/discount/update]
### 修改优惠码 [POST]
+ Parameters
    + id: (string,required) - 优惠码Id
    + discountType: (string,required) - 优惠方式
    + discountTypeValue: (number,required) - 优惠方式的值   备注: discountType 为 free 时该值可为空或不填
    + applyToAllTickets:(boolean,required) - 优惠范围,是否所有门票都能使用优惠码
    + applyToTickets: (array,required) - 可以使用此优惠码的票Id 备注: applyToAllTickets 为 true 时该值可为空
    + maxUseCount: (number,required) - 最多使用次数   备注: -1为无限制次数
    + discountExpiryDate:(string,required) - 优惠码有效期 备注: any(任意时间都可以使用),custom(自定义有效期时间范围)
    + startTime:(date,required) -  优惠码有效期开始时间  备注: discountExpiryDate 为 any 时 该值为null
    + endTime:(date,required) -  优惠码有效期结束时间  备注: discountExpiryDate 为 any 时 该值为null

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

    + Body

            {
                "id": "6237223608763158528",
                "discountType": "free",
                "discountTypeValue": 0,
                "applyToAllTickets": true,
                "applyToTickets": "",
                "maxUseCount": -1,
                "discountExpiryDate": "any",
                "startTime": "2429-12-30T00:00:00.000Z",
                "endTime": "2429-12-30T00:00:00.000Z"
            }

+ Response 200 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"1de-z1CI6p340a7LibJRlYEu4A"

    + Body

            {"applyToAllTickets":true,"applyToTickets":["6237218272375345152","6237218272375345153"],"ctime":"2017-02-14T10:59:50.337Z","discountCode":"2zr2s5ru9bi8s0","discountExpiryDate":"any","discountType":"free","discountTypeValue":-1,"endTime":"2429-12-30T00:00:00.000Z","eventId":"6237218272375345156","generationMode":"random","id":"6237223608763158528","isDeleted":false,"maxUseCount":-1,"startTime":"2429-12-30T00:00:00.000Z","totalUsedCount":0,"utime":"2017-02-16T11:03:09.482Z"}
