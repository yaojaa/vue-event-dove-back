const _              = require('lodash');
const Promise        = require('bluebird');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const myutil         = require('../util/util');
const r              = require('../util/thinky').r;
const Transaction    = require('../model/transaction');
const Event          = require('../model/event.js');
const Order          = require('../model/order.js');

// 处理事务表中audited为false的记录
(async function processTransactionAudited() {

    const opts  = {squash: true, includeTypes: true, includeStates: true, includeInitial: true};
    const feeds = await r.table("Transaction").filter({audited: false}).changes(opts).run();

    feeds.each(function (err, doc) {

        const changeType = _.isUndefined(doc.type) ? '' : doc.type;

        if (myutil.inArray(changeType, ['initial', 'add'])) {

            const transactionInfo = doc.new_val;

            Transaction.auditTransaction(transactionInfo);

        }

    });

})();

// 处理订单表
(async function processOrder() {

    const opts  = {squash: true, includeTypes: true, includeStates: true, includeInitial: true};
    const feeds = await r.table("Order").filter({audited: false}).changes(opts).run();

    feeds.each(function (err, doc) {

        const changeType = _.isUndefined(doc.type) ? '' : doc.type;

        if (myutil.inArray(changeType, ['initial', 'add'])) {

            const newOrderInfo = doc.new_val;

            Order.processOrder(newOrderInfo);

        }

    });

})();

// 处理活动表
(async function processEvent() {

    const opts  = {squash: true, includeTypes: true, includeStates: true, includeInitial: true};
    const feeds = await r.table("Event").filter({audited: false}).changes(opts).run();

    feeds.each(function (err, doc) {

        const changeType = _.isUndefined(doc.type) ? '' : doc.type;

        if (myutil.inArray(changeType, ['initial', 'add'])) {

            const newEventInfo = doc.new_val;
            Event.auditEvent(newEventInfo);

        }

        if (myutil.inArray(changeType, ['change'])) {

            const newEventInfo = doc.new_val;
            const oldEventInfo = doc.old_val;

            if (oldEventInfo.endTime !== newEventInfo.endTime) {

                Event.auditEvent(newEventInfo);

            }

        }

    });

})();
