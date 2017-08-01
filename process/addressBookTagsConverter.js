var _ = require('underscore'),
    datautils = require("./datautils"),
    f2n = datautils.f2n,
    loc2hash = datautils.loc2hash,
    locale2Country = datautils.locale2Country;

var fs = require("fs");
var Promise = require('bluebird');
var mysql = require('promise-mysql');
var r = require('rethinkdb');
var fp = require('../util/fixParams.js');
var config = require("./config");
var mysqlConfig = config.mysqlConfig;
var moment     = require('moment');

function readAndConvert() {
    Promise.coroutine(function*() {
        try {
            console.log('trying to connnect rethinkdb...');
            // rConn = yield r.connect( {host: 'localhost', port: 28015, db:'eventdove'});
            rConn = yield r.connect(config.rdbConfig);
            // run this the second time will get error
            try {
                yield r.dbCreate("eventdove").run(rConn);
                yield r.db('eventdove').tableCreate('AddressBookTags').run(rConn);
            } catch (err) {
                console.log('err:' + err);
            }
            console.log('trying to connnect mysql...');
            connection = yield mysql.createConnection(mysqlConfig);
            console.log('connected');

            var batchSize = 6; // TODO: change to 1000
            var offset = -batchSize;
            for( ; ; ) {
                offset += batchSize;
                // 只导未被删除的联系人标签数据 A: 正常 U: 删除
                var query = 'SELECT * from ContactGroup where state = "A" limit ' + batchSize + ' offset ' + offset;
                console.log('query: ', query);

                var rows = yield connection.query(query);

                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var oldTags = rows[i];
                    var newTags = {   // 转换联系人标签
                        id          : oldTags.contactGroupId,
                        name        : oldTags.groupName,
                        contactCount: 0,
                        userId      : oldTags.loginId,
                        uTime       : _.isNull(oldTags.createTime)? null :moment(oldTags.createTime).add(8,'h').toDate()
                    };
                    console.log("AddressBookTags is: " + JSON.stringify(newTags));
                    yield r.table('AddressBookTags').insert(newTags).run(rConn);
                }
                break; //TODO: remove this after testing
            }
            console.log('done');
            rConn.close();
            connection.end();
        } catch (err) {
            console.log('error:' + err);
            if (connection)
                connection.end();
            if( rConn)
                rConn.close();
        }
    })();
}

var connection = null;
var rConn = null;
readAndConvert();
