RethinkDB实例大全JavaScript版

目录

基本命令
筛选
操作文档
分页
变换
其他
基本命令

创建库

创建数据库，可以像下面这样使用 dbCreate 命令：

r.dbCreate("blog").run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
还可以通过Web界面创建数据库。打开 http://HOST:8080 ，点 Tables ，然后再点 Add Database 按钮。

重命名数据库

最简单的方式是使用 config 命令访问 db_config 系统表 ，然后使用 update命令。

r.db("old_db_name").config().update({name: "new_db_name"}).run(conn,
    function(err, result) {
        if (err) throw err;
        console.log(result);
    }
);
创建表

先用 db 命令选择要在哪个数据库中创建表，然后再像下面这样用 tableCreate创建表：

r.db("blog").tableCreate("posts").run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
如果是在连接的默认数据库（除非在 connect 指定，否则默认数据库为 test ）中创建表，可以省略 db 命令。

还可以通过Web界面创建表。打开 http://HOST:8080 ，点 Tables ，然后再点Add Table 按钮。

插入文档

在相应的表上调用 insert 命令可以插入文档：

r.table("user").insert({
    name: "Michel",
    age: 26
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
给 insert 传入文档数组可以一次插入多个文档：

r.table("user").insert([
    {
        name: "Michel",
        age: 26
    },
    {
        name: "Slava",
        age: 30
    }
]).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
删除文档

先选择要删除的文档，然后使用 delete 命令。下面的例子会删除所有作者为Michel的文章：

r.table("posts").filter(r.row("author").eq("Michel")).delete().run(conn,
    function(err, result) {
        if (err) throw err;
        console.log(result);
    }
);
或者，可以只删除一个用户：

r.table("posts").get("7644aaf2-9928-4231-aa68-4e65e31bf219").delete().run(conn,
    function(err, result) {
        if (err) throw err;
        console.log(result);
    }
);
这样可以删除一个表中的所有文档：

r.table("posts").delete().run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
取得文档

要取得表中的所有文档，使用 table 命令：

r.table("posts").run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
table 命令返回一个游标，可以使用 next k或 each 命令迭代结果，或者使用toArray 将结果转换为数组。

要通过ID取得特定文档，使用 get ：

r.table("posts").get(1).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
要通过特定字段值取得文档，使用 filter ：

r.table("posts").filter({author: "Michel"}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
要通过特定索引（ index ）取得文档，使用 getAll ：

r.table("posts").getAll("review", {index: "category"}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
（要了解更复杂的筛选操作，请继续往下看。）

筛选

根据多个字段筛选

假设你想查找作者名为Michel，类别为Geek的所有文章，可以这样做：

r.table("posts").filter({
    author: "Michel",
    category: "Geek",
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
或者，可以使用 and 命令先写一个断言，然后把它传给 filter ：

r.table("posts").filter(
    r.row("author").eq("Michel").and(r.row("category").eq("Geek"))
).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
还可以使用前缀写法（把所有参数传给 r.and ）：

r.table("posts").filter(
    r.and(r.row("author").eq("Michel"), r.row("category").eq("Geek"))
).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
类似地，使用 r.or 可以根据多个条件中的一个来筛选。

根据数组中是否有某个值筛选

假设有一个 users 表，其中保存下列形式的文档：

{
    name: "William Adama"
    emails: ["bill@bsg.com", "william@bsg.com"],
    ship: "Galactica"
}
要是我想找到所有电子邮件是 user@email.com 的用户，可以这样写：

r.table("user").filter(r.row("emails").contains("user@email.com"))
 .run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
想找到所有“银河号”（Galactica）和“天马号”（Pegasus）上的用户，可以这样写：

r.table("user").filter(function (user) {
    r(["Galactica", "Pegasus"]).contains(user("ship"))
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
根据嵌套字段筛选

在JavaScript中可以使用 () 取得字段的值，可以连环使用它取得嵌套字段的值。

假设 users 表中的文档是这样的：

{
    name: "William Adama"
    contact: {
        phone: "555-5555"
        email: "bill@bsg.com"
    }
}
这样就可以根据嵌套的 email 字段实现筛选：

r.table("user").filter(
    r.row("contact")("email").eq("user@email.com")
).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
对于很多ReQL命令，也可以使用JSON风格的嵌套语法，更灵活。请参考“ 访问嵌套的字段 ”。

通过主键迅速取得多个文档

要取得主键为 1 、 2 、 3 的所有文章，可以使用 getAll 命令:

r.table("posts").getAll(1, 2, 3).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
通过二级索引快速取得多个文档

假设表 posts 通过 author_id 字段将文章与作者联系起来。如果已经在author_id 上创建了二级索引，而且想取得所有 author_id 为 1 、 2 、 3 的文章，可以像这样使用 getAll 命令：

r.table("posts").getAll(1, 2, 3, {index: 'author_id'})
 .run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
参考 在RethindDB中创建二级索引 。

将流（游标）中的所有对象作为数组返回

如果命令返回的是流，而你想一次取得所有结果，不想通过游标迭代，可以使用toArray 命令将结果保存到数组中。

r.table('posts').run(conn, function(err, cursor) {
    if (err) throw err;
    cursor.toArray(function(result) {
        console.log(result);
    });
});
参见 数据类型文档 了解关于流的更多信息。

取得文档的特定字段

取得文档中的个别字段可以使用 pluck 命令。比如，从 users 表中取得每个文档的 name 和 age ：

r.table("users").pluck("name", "age").run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
这相当于SQL中的 SELECT name, age FROM users 。

pluck 命令也支持选择嵌套的字段。比如，要取得以下文档中的 phone 和email 字段：

{
    name: "William Adama"
    contact: {
        phone: "555-5555"
        email: "bill@bsg.com"
    }
}
可以这样写：

r.table("users").pluck(
    {contact: {phone: true, email: true}}
).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
根据日期范围筛选

要检索2012年1月1日到2013年1月1日之间的文章，这样写：

r.table("posts").filter(function(post) {
    return post("date").during(r.time(2012, 1, 1, 'Z'), r.time(2013, 1, 1, 'Z'));
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
也可以手工比较日期：

r.table("posts").filter(function(post) {
    return post("date").ge(r.time(2012, 1, 1, 'Z')).and(
        post("date").lt(r.time(2013, 1, 1, 'Z')));
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
使用正则筛选

要检索姓以Ma开头的所有用户，可以使用 r.match ：

// 会返回Martin、Martinez、Marshall等
r.table("users").filter(function(user) {
    return user("lastName").match("^Ma");
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
要检索姓以s结尾的所有用户，可以这样：

// 返回Williams、Jones、Davis等
r.table("users").filter(function(user) {
    return user("lastName").match("s$");
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
检索姓中包含ll的所有用户：

// 返回Williams、Miller、Allen等
r.table("users").filter(function(user) {
    return user("lastName").match("ll");
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
不区分大小写的筛选

检索所有名为Wiliam（不区分大小写）的用户。

// 返回william、William、WILLIAM、wiLLiam等
r.table("users").filter(function(user) {
    return user("name").match("(?i)^william$");
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
同时执行多次聚合

执行返回多个不同字段聚合的查询，属于典型的 map-reduce 。

假设有一个数据集是热门电影，按用户票数排名。你希望取得总票数和前25部电影的平均年份，即 votes 列的 sum() 和 year 列的 avg() ，按 rank 列排序取1～25位。

为此，通过 map 把前25部电影映射到一个新的结果集，并添加 count 列，然后将映射结果集的每一行 reduce 为每个字段（ votes 、 year 和 count ）的总和。再用 do 返回包含总票数和平均年份（用年数和除以数量）的结果。

r.table('movies').orderBy('rank').limit(25).map(function (doc) {
    return { totalVotes: doc('votes'), totalYear: doc('year'), count: 1 };
}).reduce(function (left, right) {
    return {
        totalVotes: left('totalVotes').add(right('totalVotes')),
        totalYear: left('totalYear').add(right('totalYear')),
        count: left('count').add(right('count'))
    };
}).do(function (res) {
    return {
        totalVotes: res('totalVotes'),
        averageYear: res('totalYear').div(res('count'))
    };
}).run(conn, callback);
我们还在研发聚合多个字段的更简单的语法，会使用 group 命令。要了解进度，请关注 issue 1725 。

操作文档

添加/重写文档中的某个字段

要添加/重写某个字段，使用 update 命令。例如，要给表 posts 中的所有文档添加值为Michel的 author 字段，可以这样：

r.table("posts").update({ author: "Michel" }).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
删除文档中的某个字段

update 可以重写字段，但不能删除字段。删除字段，要用 replace 命令以作为参数传入的新文档替换旧文档。以下代码会删除ID为 1 的文章中的 author 字段：

r.table("posts").get("1").replace(r.row.without('author'))
 .run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
根据条件原子性更新文档

update 和 replace 命令对单个文档都是原子性的。假设要在 countable 字段为 true 的情况下原子性地更新页面浏览量，并在一个查询中取得老的和新的结果，就可以这样：

r.table("pages").update(function(page) {
    return r.branch(page("countable").eq(true),  // 如果页面可以计数
        { views: page("views").add(1) },         // 浏览量加1
        {}                                       // 否则什么也不做
    );
}, {returnChanges: true}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
有条件的插入或替换

使用与之前的例子类似的技术，可以用 branch 和 replace 维护文档的updated_at 和 created_at 字段，根据指定ID的文档是否存在决定是插入新文档，还是更新已有文档。

r.table('users').get(id).replace(function (doc) {
    return r.branch(
        doc.eq(null),
        r.expr(userObject).merge({id: id, created_at: r.now()}),
        doc.merge(userObject).merge({updated_at: r.now()})
    )
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
将时间戳和JSON日期字符串保存为Time类型

可以用 epochTime 和 ISO8601 命令将Unix时间戳（以秒为单位）和JSON日期时间字符串（ISO 8601格式）转换为ReQL的时间类型。ReQL驱动程序也能将JavaScript Date对象转换为ReQL时间。.

var theDate = new Date();
var timestamp = theDate.getTime();
var JSONDate = theDate.toJSON();
r.table("dates").insert({
    from_object: theDate,
    from_epoch: r.epochTime(timestamp/1000.0),
    from_iso: r.ISO8601(JSONDate)
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
toEpochTime 和 toISO8601 用于反向转换。

递增字段的值

可以在服务器端每次递增文档中一个字段（如计数器）的值。

r.table('aggregated').get(id).update(
    { count: r.row('count').default(0).add(1) }
).run(conn, callback);
这里用 default 确保在文档中没有 count 字段时能正确相加，而不会抛出错误。

分页

限制返回的文档数

使用 limit 命令查询可以限制返回的文档数：

r.table("posts").orderBy("date").limit(10).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
实现分页

RethinkDB提供了多种分页方式。最简单的是使用 skip 和 limit （类似于SQL的OFFSET 和 LIMIT ），但效率也最差。较好的方式是使用 slice ，而更好的方式是使用 between 和一个二级索引。

slice 命令返回给定范围内（不包含结束值）的结果，替换 skip / limit 也很方便：起始值就是要取得的第一项，结束值是第一项加限制的数量。以下示例用 slice取得第11～20篇文章：

r.table("posts").orderBy("date").slice(11,21).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
如果有二级索引，可以使用 between 命令与 orderBy 、 limit 。这是最有效的分页方式，但要求查询的值必须在二级索引的字段中。

假设每页有25个用户，那么前25个用户使用 limit 效率更高：

r.table("users").orderBy({index: "name"}).limit(25).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
后续每一页，从前一页的姓开始。

r.table("users").between(lastName, r.maxval, {leftBound: "open", index: "name"})
 .orderBy({index: "name"}).limit(25).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
将前一页保存的 lastName 传入 between 作为起始索引。对于结束索引，传入null 表示从起始索引到表末尾。 leftBound 参数告诉 between 不包含第一条记录，因为它已经在前一页中返回了。

变换

计算表格中的文档数

使用 count 命令：

r.table("posts").count().run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
计算某个字段的平均值

使用 avg 命令：

r.table("posts").avg("num_comments").run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
通过子查询返回更多字段

假设要取得表 post 中的所有文章，同时还要返回一个额外字段 comments ，一个保存在 comments 表中的相关评论的数组。可以用子查询：

r.table("posts").merge(function(post) {
    return {
        comments: r.table("comments").filter(function(comment) {
            return comment("id_post").eq(post("id"))
        }).coerceTo("ARRAY")
    }
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
旋转

假设表 marks 中保存着学生每一科的分数：

[
    {
        "name": "William Adama",
        "mark": 90,
        "id": 1,
        "course": "English"
    },
    {
        "name": "William Adama",
        "mark": 70,
        "id": 2,
        "course": "Mathematics"
    },
    {
        "name": "Laura Roslin",
        "mark": 80,
        "id": 3,
        "course": "English"
    },
    {
        "name": "Laura Roslin",
        "mark": 80,
        "id": 4,
        "course": "Mathematics"
    }
]
你希望取得的结果为如下格式：

[
    {
        "name": "Laura Roslin",
        "Mathematics": 80,
        "English": 80
    },
    {
        "name": "William Adama",
        "Mathematics": 70,
        "English": 90
    }
]
此时，可以使用 group 和 coerceTo 命令执行旋转操作：

r.db('test').table('marks').group('name').map(function (row) {
    return [row('course'), row('mark')];
}).ungroup().map(function (res) {
    return r.expr({name: res('group')}).merge(res('reduction').coerceTo('object'));
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
注意：我们会增加一种更友好的语法，参见 Github issue 838 。

反旋转

要执行反旋转操作以抵销之前的旋转操作，可以使用 concatMap 、 map 和 keys命令：

r.table("pivotedMarks").concatMap(function (doc) {
    return doc.without("id", "name").keys().map(function (course) {
        return {
            name: doc("name"),
            course: course,
            mark: doc(course)
        };
    });
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
注意：我们会增加一种更友好的语法，参见 Github issue 838 。

取得文档时重命名字段

假设从表 users 中取得文档时要把字段 id 重命名为 idUser 。在子查询中，可以使用 merge 添加一个新字段，并给它赋予一个已有字段的值，然后用 without 删除原来的字段：

r.table("users").map(
    r.row.merge({ idUser: r.row("id") }).without("id")
).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
通过日期/时间分组查询结果

ReQL有从 日期和时间 里提取某一部分的命令，包括 year 、 month 、 day 、dayOfWeek ，等等。可以使用这些命令与 group 按照不同的时间长度来分组。假设有一个收入表，想按照年和月来分组：

r.table("invoices")
    .group([r.row("date").year(), r.row("date").month()])
    .ungroup()
    .merge({invoices: r.row('reduction'), month: r.row('group')})
    .without('reduction', 'group')
    .orderBy('month')
.run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
（这里也使用了前面提到的重命名字段的技术，把 reduction 和 group 换成了更有用的 invoices 和 month 。）可以在分组时使用任意ReQL日期/时间的区间组合，或者将日期/时间作为原生对象使用。

目前，ReQL默认限制数组最多包含10万个元素， group 的实现要求分组后的文档总数不超过这个数，因此最多只能处理10笔收入。不过，这个限制可以改，要把选项arrayLimit 传给 run 。（另外， ungroup 始终返回数组，未来的版本中可能会有改动。参见 #2719 。）

可以在要分组的时间区间上使用 复合索引 ：

r.table('invoices').indexCreate(
    'byDay', [r.row('date').year(), r.row('date').month(), r.row('date').day()]
).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
然后就可以在 group 函数中使用该索引。这个查询会返回每天的最高收入。

r.table("invoices")
    .group({index: 'byDay'})
    .max('price')
.run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
其他

生成单调增加的主键值

在分布式系统中有效生成单调增加的主键值是个难题。如果插入的文档没有主键，RethinkDB会生成一个随机的UUID。未来，我们还会支持其他自动生成方式。（参见https://github.com/rethinkdb/rethinkdb/issues/117 。 但在此期间，建议选择开源的分布式ID生成库（比如 twitter snowflake ）。

把RethinkDB的响应解析到一个写查询

发送写查询（ insert 、 delete 、 update 或 replace ）的时候，RethinkDB会返回一个这样的摘要对象：

{deleted:0, replaced:0, unchanged:0, errors:0, skipped:0, inserted:1}
其中最重要的字段是 errors 。一般来说，没有异常抛出且 errors 为0，写操作就成功了。（RethinkDB会在不能访问表的时候抛出异常，如果能访问表但写的时候出错，它会设置 errors 字段。由于存在这样的约定，批量写操作才不会因为碰到一个错误就半途而废。）

以下字段始终会存在于这个对象中。

inserted – 添加到数据库中的新文档数量。
deleted – 从数据库中删除的文档数量。
replaced – 修改的文档数量。
unchanged – 要不是新值与旧值相同，同样会修改的文档的数量。
skipped – 一次写操作中未修改的文档数量，原因是文档不能删除或更新。可能是由于同时有另一个操作已经将文档删除了，或者 get 操作的键并不存在。
errors – 由于某个错误导致未能修改的文档数量。
此外，以下两个字段视情况出现。

generated_keys – 如果是插入操作，而所有或部分行没有主键，服务器会为你生成主键，并在这个字段返回一个包含那些键的数组（数组中主键的顺序与插入行的顺序一致）。
first_error – 如果 errors 大于0，那这个字段保存第一条错误消息。这个消息对排错非常重要。（之所以不给出所有错误消息，是因为单纯一处拼写错误就可能在操作大型数据库时导致上百万个错误）。
在ReQL命令中使用动态键

有时候在写入文档时，可能会使用保存在变量中的字段名。为此，可以使用object 命令，它接受一系列键值（ (key, value, key, value ...) ）并返回一个对象。

r.table('users').get(1).update(r.object(propertyName, value)).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
字段名可以服务器端确定。比如，要更新一个字段，而该字段的名字需要从另一个字段的值中读取：

r.table('users').forEach(function (doc) {
  return r.table('users').get(doc('id')).update(r.object(doc('field'), newValue));
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
实际当中，可能会有像前面 旋转示例 中一样的数据，其中每个文档表示一名学生一科的成绩。

[
    {
        "name": "John",
        "mark": 70,
        "id": 1,
        "course": "Mathematics"
    },
    {
        "name": "John",
        "mark": 90,
        "id": 2,
        "course": "English"
    }
]
但我们想从文档中得到的是“成绩单”：

{
    "Mathematics": 70,
    "English": 90
}
使用 object 和一次旋转就可以：

r.table("marks").filter({student: "John"}).map(function(mark) {
    return r.object(mark("course"), mark("mark"));
}).reduce(function(left, right) {
    return left.merge(right);
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
将ReQL查询作为字符串返回

为了测试或记日志，可能需要把生成的ReQL查询保存为字符串。（比如ReQL的错误消息中就有。）虽然没有相应的ReQL命令，但只要在查询语句末尾用toString() 代替 run() 就行了：

`r.table('users').filter(r.row('groups').contains('operators')).toString()`
分行写ReQL查询

有时候需要以编程方式组装查询语句，比如先实例化一个查询对象，然后根据情况再调用并添加相应的查询命令，最后再调用执行前面添加的命令。就是运行时根据条件来动态修改查询。理想的写法可能是这样的：

var query = r.table('posts');
if (request.filter !== undefined) {
    query.filter(request.filter);
}
query.orderBy('date');
query.run(conn, callback);
但是不行。因为查询对象并不保存状态。第一条命令之后的命令同样会基于 query最初的 值（即这里的 posts 表）来运行。为此，可以把每次命令的运行结果都保存到 query 变量中：

var query = r.table('posts');
if (request.filter !== undefined) {
    query = query.filter(request.filter);
}
query = query.orderBy('date');
query.run(conn, callback);
将多条变动源消息合成一条

要产生“联结的”变动源消息（changefeed），以便通过一个源监控多个表或查询，可以这样：

`r.table('table1').union(r.table('table2')).changes().run(conn, callback);`
为明确哪个变动属于哪个表，还可以加“标签”：

r.table('table1').merge({table: 'table1'})
 .union(r.table('table2').merge({table: 'table2'})
 .changes().run(conn, callback);
此外，还可以针对每个查询调用 changes ，而不必等到最后再调用：

r.table('table1').filter({flag: 'blue'}).changes()
 .union(r.table('table2').filter({flag: 'red'}).changes())
 .run(conn, callback);