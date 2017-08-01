FORMAT: 1A
HOST: http://qa.www.eventdove.com/api
# Eventdove API
欢迎使用 **Eventdove** API ，这些 API 提供了操作 **Eventdove** 数据的接口。


# Group 注册
注册

## 使用手机号注册用户 [/user/register]
### 使用手机号注册用户 [POST]
使用手机号注册用户

+ Parameters

    + token: `xxx` (string) - 发送短信验证码接口返回的token
    + verificationCode: `xxx` (string) - 用户手机上接收到的短信验证码

+ Request (application/json; charset=utf-8)

        {
            "password": "123456",
            "phone": "18600833853",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZSI6IjE4NjAwODMzODUzIiwidmVyaWZpY2F0aW9uQ29kZSI6IjcyOTU2MiIsImlhdCI6MTQ4MzUzMjYxNCwiZXhwIjoxNDgzNjE5MDE0fQ.VHz_JNZg0nXle48LzTTguanLfjnF9Z13V2LVAQCszpk",
            "verificationCode": "729562"
        }

+ Response 201 (application/json; charset=utf-8)

    + Body

            {
                "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ0NjUwNTA3MzQ1OTIiLCJ1c2VybmFtZSI6IjE4NjAwODMzODUzIiwiaWF0IjoxNDgzNTMyMDYyLCJleHAiOjE0ODM1MzgwNjJ9.LtjPRKCTBWt_Ja4OM7EotKGEq7FQ89OOPY8D5ZKCtPk",
                "phone": "18600833853",
                "username": "18600833853",
                "accountStatus": "active",
                "ctime": "2017-01-04T12:14:22.781Z",
                "utime": "2017-01-04T12:14:22.781Z",
                "basePrice": 0,
                "percent": 2.5,
                "maxFee": 0,
                "id": "6222384465050734592"
            }

## 使用邮箱注册用户 [/user/register]
### 使用邮箱注册用户 [POST]
使用邮箱注册用户

+ Request (application/json; charset=utf-8)

        {
            "password": "123456",
            "email": "hongyu_zhao@eventown.com"
        }

+ Response 201 (application/json; charset=utf-8)

    + Body

            {
                "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjA4MTEzMjMzODc4MDk3OTIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4MzE1Njk5NywiZXhwIjoxNDgzMTYyOTk3fQ.AOdkSfqHJ_C_uSTXSW18577YIVIBE04-I5VgCwoJiwE",
                "email": "hongyu_zhao@eventown.com",
                "username": "hongyu_zhao@eventown.com",
                "accountStatus": "registered",
                "ctime": "2016-12-31T04:03:16.581Z",
                "utime": "2016-12-31T04:03:16.581Z",
                "basePrice": 0,
                "percent": 2.5,
                "maxFee": 0,
                "id": "6220811323387809792"
            }

## 邮箱注册用户激活 [/user/activate{?token}]
### 邮箱注册用户激活 [GET]
邮箱注册用户激活

+ Parameters

    + token: `xxx` (string) - 邮箱激活的token

+ Response 200 (application/json; charset=utf-8)

    + Body

            User zhaohongyu activated successfully.

## 重新发送注册激活邮件 [/user/sendActivateEmail]
### 重新发送注册激活邮件 [POST]
重新发送注册激活邮件

+ Request (application/json; charset=utf-8)

        {
            "email": "hongyu_zhao@eventown.com"
        }

+ Response 201 (application/json; charset=utf-8)

    + Body

            {
                "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjA4MTEzMjMzODc4MDk3OTIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4MzE1OTQwNiwiZXhwIjoxNDgzMTY1NDA2fQ.qE3_nza6rSmqTQteCrx5OUpW4qc97n-sDi7yPi_cJfE",
                "accountStatus": "registered",
                "basePrice": 0,
                "ctime": "2016-12-31T04:03:16.581Z",
                "email": "hongyu_zhao@eventown.com",
                "id": "6220811323387809792",
                "maxFee": 0,
                "percent": 2.5,
                "username": "hongyu_zhao@eventown.com",
                "utime": "2016-12-31T04:33:13.354Z"
            }

# Group 登录
登录

## 用户名登录 [/user/login]
### 邮箱登录 [POST]
包含邮箱,手机号登录

+ Parameters

    + token: `xxx` (string) - 获取图片验证码接口responseheader中的token
    + sessionId: `xxx` (string) - 获取图片验证码接口responseheader中的sessionId
    + captcha: `3829` (string) - 图片验证码
    + keepLogin: `true` (boolean) - 是否7天内免登录

+ Request (application/json; charset=utf-8)

        {
            "username": "hongyu_zhao@eventown.com",
            "password": "123456",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2MjIyMzg0OTAwNjc5NTM2NjQwIiwiY2FwdGNoYSI6IjM4MjkiLCJpYXQiOjE0ODM1MzIxNjYsImV4cCI6MTQ4MzUzMjc2Nn0.7xFZwcgMXd0c9yqHKNxffHOMpLeyRafz0gi6wFk-hMg",
            "sessionId": "6222384900679536640",
            "captcha": "3829",
            "keepLogin": true
        }

+ Response 201 (application/json; charset=utf-8)

    + Body

            {
                "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4MzUzMjIwOSwiZXhwIjoxNDgzNTM4MjA5fQ.5nbgOwI8cpcyCnaRRoQ_x1z2hGzSfei57h9tIGOirqI",
                "accountStatus": "active",
                "basePrice": 0,
                "ctime": "2017-01-04T12:15:23.201Z",
                "email": "hongyu_zhao@eventown.com",
                "id": "6222384718470582272",
                "maxFee": 0,
                "percent": 2.5,
                "username": "hongyu_zhao@eventown.com",
                "utime": "2017-01-04T12:15:39.413Z"
            }

## 手机号动态验证码登录 [/user/login]
### 手机号动态验证码登录 [POST]
手机号动态验证码登录

+ Parameters

    + token: `xxx` (string) - 发送短信验证码接口中返回的token
    + phone: `xxx` (string) - 动态登录的手机号,与username相同
    + verificationCode: `xxx` (string) - 用户手机上接收到的短信验证码

+ Request (application/json; charset=utf-8)

        {
            "username": "18600833853",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZSI6IjE4NjAwODMzODUzIiwidmVyaWZpY2F0aW9uQ29kZSI6IjcyOTU2MiIsImlhdCI6MTQ4MzUzMjYxNCwiZXhwIjoxNDgzNjE5MDE0fQ.VHz_JNZg0nXle48LzTTguanLfjnF9Z13V2LVAQCszpk",
            "phone": "18600833853",
            "verificationCode": "729562"
        }

+ Response 201 (application/json; charset=utf-8)

    + Body

            {
                "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIwMzc0MDMwODM4NzAyMDgiLCJ1c2VybmFtZSI6IjE4NjAwODMzODUzIiwiaWF0IjoxNDgzNTMxMzA5LCJleHAiOjE0ODM1MzczMDl9.2cK33iWVkuexsYfp1HtdTtu_qmycXR8lpgNSOzMJNNY",
                "accountStatus": "active",
                "basePrice": 0,
                "ctime": "2017-01-03T13:15:16.760Z",
                "id": "6222037403083870208",
                "maxFee": 0,
                "percent": 2.5,
                "phone": "18600833853",
                "username": "18600833853",
                "utime": "2017-01-03T13:15:21.452Z"
            }

# Group 根据邮箱重置密码
根据邮箱重置密码

## 根据邮箱发送密码重置邮件 [/user/sendFindPwdEmail]
### 根据邮箱发送密码重置邮件 [POST]
根据邮箱发送密码重置邮件

+ Request (application/json; charset=utf-8)

        {
            "email": "hongyu_zhao@eventown.com"
        }

+ Response 201 (application/json; charset=utf-8)

    + Body

            User hongyu_zhao@eventown.com send reset password email successfully.

## 验证重置密码token [/user/verifyResetPwdToken{?token}]
### 验证重置密码token [GET]
验证重置密码token

+ Parameters

    + token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` (string) - 邮箱验证token

+ Response 200 (application/json; charset=utf-8)

    + Body

            User hongyu_zhao@evendown.com verify successfully.

## 修改密码 [/user/updatePwd]
### 修改密码 [POST]
修改密码

+ Parameters
    + email: `hongyu_zhao@evendown.com` (string) - 用户邮箱
    + password: `123456` (string) - 新密码
    + token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` (string) - 邮箱验证token

+ Request (application/json; charset=utf-8)

        {
            "email": "hongyu_zhao@evendown.com",
            "password": "123456",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMTcyNDA2MDQwNzQ3MDg5OTIiLCJ1c2VybmFtZSI6InpoYW9ob25neXUiLCJlbWFpbCI6Imhvbmd5dV96aGFvQGV2ZW5kb3duLmNvbSIsImlhdCI6MTQ4Mjk5ODc2MywiZXhwIjoxNDgzMDA0NzYzfQ.rbn1zVvgmdMFF4aoXRqna9TDhn09AmqlJj9LzcIQR_g"
        }

+ Response 200 (application/json; charset=utf-8)

    + Body

            {
              "accountStatus": "active",
              "authStatus": 0,
              "canPublishEvent": true,
              "email": "hongyu_zhao@evendown.com",
              "emailActToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InpoYW9ob25neXUiLCJpYXQiOjE0ODIzMDU2NzAsImV4cCI6MTQ4MjMwODY3MH0.pRorNgqKt0FjSnyyAK9XaOepNlZkw6q8c9WucWL_7H4",
              "guideStatus": "",
              "id": "6217240604074708992",
              "lastLoginIp": "127.0.0.1",
              "locale": "",
              "loginRole": 0,
              "managepw": "",
              "password": "e10adc3949ba59abbe56e057f20f883e",
              "paymentMethod": 0,
              "phone": "18600833853",
              "registerStatus": true,
              "token": "",
              "username": "zhaohongyu",
              "viewName": "赵洪禹",
              "vip": 1
            }

# Group 根据手机号重置密码
根据手机号重置密码

## 根据手机号重置密码 [/user/updatePwdByPhone]
### 根据手机号重置密码 [POST]
根据手机号重置密码

+ Parameters

    + token: `xxx` (string) - 发送短信验证码返回的token
    + verificationCode: `xxx` (string) - 用户手机上接收到的短信验证码

+ Request (application/json; charset=utf-8)

        {
            "phone": "18600833853",
            "password": "123456",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZSI6IjE4NjAwODMzODUzIiwidmVyaWZpY2F0aW9uQ29kZSI6IjcyOTU2MiIsImlhdCI6MTQ4MzUzMjYxNCwiZXhwIjoxNDgzNjE5MDE0fQ.VHz_JNZg0nXle48LzTTguanLfjnF9Z13V2LVAQCszpk",
            "verificationCode": "729562"
        }

+ Response 201 (application/json; charset=utf-8)

    + Body

            User 18600833853 password changed successfully.

# Group 图形验证码
图形验证码

## 获取图片验证码 [/user/captcha]
### 获取图片验证码 [GET]
获取图片验证码

+ Response 200 (image/bmp)

    + Headers
            sessionId: 6222384900679536640
            token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2MjIyMzg0OTAwNjc5NTM2NjQwIiwiY2FwdGNoYSI6IjM4MjkiLCJpYXQiOjE0ODM1MzIxNjYsImV4cCI6MTQ4MzUzMjc2Nn0.7xFZwcgMXd0c9yqHKNxffHOMpLeyRafz0gi6wFk-hMg

    + Body
        这里是图片的内容

## 验证图片验证码是否有效 [/user/checkCaptcha]
### 验证图片验证码是否有效 [POST]
验证图片验证码是否有效

+ Request (application/json; charset=utf-8)

        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2MjIyMzg0OTAwNjc5NTM2NjQwIiwiY2FwdGNoYSI6IjM4MjkiLCJpYXQiOjE0ODM1MzIxNjYsImV4cCI6MTQ4MzUzMjc2Nn0.7xFZwcgMXd0c9yqHKNxffHOMpLeyRafz0gi6wFk-hMg",
            "sessionId": "6222384900679536640",
            "captcha": "8373"
        }

+ Response 200 (application/json)

# Group 手机号验证码
手机号验证码

## 发送短信验证码 [/user/sendVerificationCode]
### 发送短信验证码 [POST]
发送短信验证码

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE

    + Body

            {
                "phone": "18600833853",
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2MjIzMTEyOTgxOTY2ODg0ODY0IiwiY2FwdGNoYSI6InlYcWYiLCJpYXQiOjE0ODM3MDU3NTQsImV4cCI6MTQ4MzcwNjM1NH0.wivgKEuw482XkE2eQ68OI5pTE4uBkia5HT7iFt8UARA",
                "sessionId": "6223112981966884864",
                "captcha": "yxqf"
            }

+ Response 201 (application/json; charset=utf-8)

    + Headers

            Access-Control-Allow-Origin: *
            X-Powered-By: Express
            Etag: W/"cf-w5chf1Q0j9FnmjsrXhDB7g"

    + Body

            {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZSI6IjE4NjAwODMzODUzIiwidmVyaWZpY2F0aW9uQ29kZSI6IjQ3MjIyNSIsImlhdCI6MTQ4MzcwNTg2NiwiZXhwIjoxNDgzNzkyMjY2fQ.QgCjWCB9hI-5PsJR2UPVeFYvq8sW1yDKS1sX-AJguVs"}

## 验证短信验证码是否有效 [/user/checkVerificationCode]
### 验证短信验证码是否有效 [POST]
验证短信验证码是否有效

+ Parameters

    + token: `xxx` (string) - 发送短信验证码返回的token

+ Request (application/json; charset=utf-8)

        {
            "phone": "18600833853",
            "verificationCode": "360486",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZSI6IjE4NjAwODMzODUzIiwidmVyaWZpY2F0aW9uQ29kZSI6IjM2MDQ4NiIsImlhdCI6MTQ4MzQ0OTk0MiwiZXhwIjoxNDgzNDUwNTQyfQ.hyQfLoCaItZ5JOOcOnkOBmCmYV6Tl8K1x0AHP5_N7Kk"
        }

+ Response 200 (application/json)

# Group 我的帐号
我的帐号

## 根据用户id更新用户基本信息 [/user/update]
### 根据用户id更新用户基本信息 [POST]
根据用户id更新用户基本信息

+ Request (application/json; charset=utf-8)

    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NjExMzcwNywiZXhwIjoxNDg2NzE4NTA3fQ.YzFESQyWtwiJj642d3GA0ZiwIuP9GPoNag2ne3jBbF4

    + Body

            {
                "id": "6222384718470582272",
                "basePrice": 10
            }

+ Response 200 (application/json; charset=utf-8)

    + Body

            {"accountStatus":"active","basePrice":10,"ctime":"2017-01-04T12:15:23.201Z","email":"hongyu_zhao@eventown.com","emailActToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4MzUzMjEyMywiZXhwIjoxNDgzNTM4MTIzfQ.kGuy7my6DyMPJkMFJYwlNPanZdLCQm14XgtLbk0-NTg","id":"6222384718470582272","maxFee":0,"password":"e10adc3949ba59abbe56e057f20f883e","percent":2.5,"username":"hongyu_zhao@eventown.com","utime":"2017-02-04T08:12:44.387Z"}

## 根据用户id重置密码 [/user/resetPwdByUserId]
### 根据用户id重置密码 [POST]
根据用户id重置密码
     
+ Request (application/json; charset=utf-8)
    
    + Headers

            Cookie: locale=s%3Aj%3A%5B%22*%22%5D.FuNuaF19hGDOzcW2yUzMh1qE0MDHLYLjgCc9Zu42CtE
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMjIzODQ3MTg0NzA1ODIyNzIiLCJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4NjExMzcwNywiZXhwIjoxNDg2NzE4NTA3fQ.YzFESQyWtwiJj642d3GA0ZiwIuP9GPoNag2ne3jBbF4

    + Body

            {
                "id": "6222384718470582272",
                "originPwd": "1234567",
                "newPwd": "123456"
            }
    
+ Response 200 (application/json; charset=utf-8)
    
    + Body
    
                {"accountStatus":"active","basePrice":10,"ctime":"2017-01-04T12:15:23.201Z","email":"hongyu_zhao@eventown.com","emailActToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imhvbmd5dV96aGFvQGV2ZW50b3duLmNvbSIsImlhdCI6MTQ4MzUzMjEyMywiZXhwIjoxNDgzNTM4MTIzfQ.kGuy7my6DyMPJkMFJYwlNPanZdLCQm14XgtLbk0-NTg","id":"6222384718470582272","maxFee":0,"password":"e10adc3949ba59abbe56e057f20f883e","percent":2.5,"username":"hongyu_zhao@eventown.com","utime":"2017-02-04T09:29:21.506Z"}        
                