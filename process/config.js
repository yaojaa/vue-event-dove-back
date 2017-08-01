var mysql = require('mysql');

exports.excludedTables = ['EmailHistory'];

exports.mysqlConfig = {
  host     : 'henry.eatuo.com',
  user     : 'expo',
  password : '654321hyzing',
  database : 'sqlback170307',
  port:'3306'
};

exports.rdbConfig = {
    host: 'localhost',     // 192.168.100.36
    port: 28015,
    db:'eventdove'
};
