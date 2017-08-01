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

// 转换 联系人 基础数据
function __addressBookConverter(oldAddressBook) {
    var newAddressBook = {};
        newAddressBook.id        = oldAddressBook.contactId;
        newAddressBook.userId    = oldAddressBook.ownerId;
        newAddressBook.email     = oldAddressBook.pdataUserMail;
        newAddressBook.name      = oldAddressBook.pdataUserName;
        newAddressBook.phone     = oldAddressBook.pdataUserPhone;
        newAddressBook.company   = oldAddressBook.pdataUserCompany;
        newAddressBook.position  = oldAddressBook.pdataUserTitle;
        newAddressBook.location  = '';
        // tags可以只含有tag id
        newAddressBook.tags      = [oldAddressBook.contactGroupId]; //[type.string()]
        newAddressBook.uTime     = moment(new Date()).add(8,'h').toDate();
        newAddressBook.cTime     = moment(new Date()).add(8,'h').toDate();

    return newAddressBook;
};

function readAndConvert() {
    Promise.coroutine(function*() {
        try {
            console.log('trying to connnect rethinkdb...');
            //rConn = yield r.connect( {host: 'localhost', port: 28015, db:'eventdove'});
            rConn = yield r.connect(config.rdbConfig);

            // run this the second time will get error
            try {
                yield r.dbCreate("eventdove").run(rConn);
                yield r.db('eventdove').tableCreate('AddressBook').run(rConn);
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
                // 只导入未被删除的联系人信息数据 state A: 正常 U: 删除
                var query = 'SELECT c.*, g.contactGroupId from `Contact` c left join `ContactGroupList` g on c.contactId = g.contactId  where 1=1 AND c.state = "A" limit ' + batchSize + ' offset ' + offset;
                console.log('query: ', query);

                var rows = yield connection.query(query);
                var len = rows.length;
                if ( len <= 0) {
                    //break the batchSize loop
                    break;
                }
                for (var i = 0; i < len; i++) {
                    var oldAddressBook = rows[i];
                    var newAddressBook = __addressBookConverter(oldAddressBook);

                    console.log("newAddressBook is: " + JSON.stringify(newAddressBook));
                    yield r.table('AddressBook').insert(newAddressBook).run(rConn);
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
