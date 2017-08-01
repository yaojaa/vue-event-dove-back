/** 路由文件方便管理 以后单独提出来吧 @yaojia**/
const express       = require('express');
const router        = express.Router();
const settings      = require("./conf/settings");
const jwt           = require('./services/auth');
const adminAuth     = require('./services/adminAuth');
const check         = require('./services/check');
const checkEvent    = require('./services/checkEvent');
const myutil        = require('./util/util.js');
let   jwtCheck      = jwt({secret: settings.secret});
const captchaCheck  = check();
const eventCheck    = checkEvent();
const adminJwtCheck = adminAuth({secret: settings.secret});

const userController               = require('./controllers/userController');
const eventController              = require('./controllers/eventController');
const noticeController             = require('./controllers/noticeController');
const fieldTypeController          = require('./controllers/fieldTypeController');
const formFieldController          = require('./controllers/formFieldController');
const ticketController             = require('./controllers/ticketController');
const orderController              = require('./controllers/orderController');
const recommendController          = require('./controllers/recommendController');
const multiAuthorizationController = require('./controllers/multiAuthorizationController');
const attendeeController           = require('./controllers/attendeeController');
const payController                = require('./controllers/payController');
const memberController             = require('./controllers/memberController');
const invoiceController            = require('./controllers/invoiceController');
const addressBookController        = require('./controllers/addressBookController');
const addressBookTagsController    = require('./controllers/addressBookTagsController');
const walletController             = require('./controllers/walletController');
const adminEventController         = require('./controllers/admin/adminEventController');
const transactionController        = require('./controllers/transactionController');
const adminUserController          = require('./controllers/admin/adminUserController');
const adminAcountController        = require('./controllers/admin/adminAcountController');
const managerController            = require('./controllers/admin/managerController');
const adminOrderController         = require('./controllers/admin/adminOrderController');
const templateController           = require('./controllers/admin/templateController.js');
const adminWithdrawController      = require('./controllers/admin/adminWithdrawController');
const adminPictureLibController    = require('./controllers/admin/pictureLibController');
const adminPictureTypeController   = require('./controllers/admin/pictureTypeController');
const adminFeedback                = require('./controllers/admin/adminFeedbackController');
const qiniuController              = require('./controllers/qiniuController');
const importExportController       = require('./controllers/importExportController');
const invitationController         = require('./controllers/invitationController');
const wechatController             = require('./controllers/wechatController');

// 用户相关
router.get('/user/getEventStatisticsByUserId', jwtCheck, eventController.getEventStatisticsByUserId);
router.get('/user/getRegistrationStatisticsByUserId', jwtCheck, eventController.getRegistrationStatisticsByUserId);
router.get('/user/totalIncomeStatistics', jwtCheck, eventController.totalIncomeStatistics);
router.get('/user/visitStatistics', jwtCheck, eventController.visitStatistics);
router.get('/user/dataOverview', jwtCheck, eventController.dataOverview);
router.get('/user/isPhoneExist', userController.isPhoneExist);
router.get('/user/isEmailExist', userController.isEmailExist);
router.post('/user/register', userController.register);
router.post('/user/update', jwtCheck, userController.update);
router.post('/user/sendActivateEmail', userController.sendActivateEmail);
router.post('/user/directUpdatePwd', jwtCheck, userController.directUpdatePwd);
router.post('/user/updatePwd', userController.updatePwd);
router.post('/user/sendFindPwdEmail', userController.sendFindPwdEmail);
router.get('/user/verifyResetPwdToken', userController.verifyResetPwdToken);
router.post('/user/login', captchaCheck, userController.login);
router.get('/user/activate', userController.activate);
router.post('/user/sendVerificationCode', captchaCheck, userController.sendVerificationCode);
router.post('/user/checkVerificationCode', userController.checkVerificationCode);
router.post('/user/updatePwdByPhone', captchaCheck, userController.updatePwdByPhone);
router.get('/user/captcha', userController.captcha);
router.post('/user/checkCaptcha', userController.checkCaptcha);
router.post('/user/resetPwdByUserId', jwtCheck, userController.resetPwdByUserId);
router.get('/user/checkLoginStatus', jwtCheck, userController.checkLoginStatus);
router.post('/user/realNameAuthentication', jwtCheck, userController.realNameAuthentication);
router.post('/user/setManagepwd', jwtCheck, userController.setManagepwd);
router.get('/user/detail', jwtCheck, userController.userDetail);
router.post('/user/oauthLogin', userController.oauthLogin);
router.post('/user/cancelSinaOauth', userController.cancelSinaOauth);
router.post('/user/updateEmail', jwtCheck, userController.updateEmail);
router.post('/user/updatePhone', jwtCheck, userController.updatePhone);
// router.get('/user/thirdPartyLogin', userController.thirdPartyLogin);
// router.get('/user/weiboLogin', userController.weiboLogin);
// 用户相关

// 反馈相关
router.post('/help/feedback', userController.addFeedback);

// BEGIN 多用户授权
router.get('/user/getMyMultiAuthorizationsUsers', jwtCheck, multiAuthorizationController.getMyMultiAuthorizationsUsers);
router.get('/user/getMyEvents', jwtCheck, multiAuthorizationController.getMyEvents);
router.get('/user/operations', jwtCheck, multiAuthorizationController.operations);
router.get('/user/checkAuthorizationsUserEmail', jwtCheck, multiAuthorizationController.checkAuthorizationsUserEmail);
router.post('/user/addMultiAuthorization', jwtCheck, multiAuthorizationController.addMultiAuthorization);
router.post('/user/updateMultiAuthorization', jwtCheck, multiAuthorizationController.updateMultiAuthorization);
router.get('/user/getMultiAuthorizationById', jwtCheck, multiAuthorizationController.getMultiAuthorizationById);
router.post('/user/deleteMultiAuthorizationById', jwtCheck, multiAuthorizationController.deleteMultiAuthorizationById);
// END 多用户授权

// BEGIN 会员
router.get('/member/getMemberById', memberController.getMemberById);
router.get('/member/getMembershipById', memberController.getMembershipById);
router.get('/member/getMemberByEmail', memberController.getMemberByEmail);
router.get('/member/searchMembers', jwtCheck, memberController.searchMembers);
router.post('/member/addGroup', jwtCheck, memberController.addMembership);
router.post('/member/updateGroup', jwtCheck, memberController.updateMembership);
router.post('/member/joinGroup', jwtCheck, memberController.initMember);
router.post('/member/payMemberOrder', memberController.payMemberOrder);
router.get('/member/getMyJoinedGroups', jwtCheck, memberController.getMyMember);
router.get('/member/getMyManagedGroups', jwtCheck, memberController.getMyMembership);
router.get('/member/validateEmail', memberController.validateEmail);
router.get('/member/checkMembershipSubDomian', jwtCheck, memberController.checkMembershipSubDomian);
// END 会员

// BEGIN 支付相关
router.post('/pay/alipayNotify', payController.aliPayDirectPayNotify);
router.get('/pay/alipayDirectPayReturn', payController.alipayDirectPayReturn);
router.post('/pay/payPalNotify', payController.payPalNotify);
router.get('/pay/payPalReturn', payController.payPalReturn);
router.get('/pay/payPalCancel', payController.payPalCancel);
router.post('/wxpay/native/createUnifiedOrder', payController.wxpayNativeCreateUnifiedOrder);
router.post('/wxpay/jsapi/createUnifiedOrder', payController.wxpayJSAPICreateUnifiedOrder);
router.post('/wxpay/notify', payController.wxpayNotify);
router.post('/wxpay/refund', payController.wxpayRefundOrder);
// END 支付相关

// 活动相关
router.get('/user/getOrganizersByUserId', jwtCheck, userController.getOrganizersByUserId);
router.post('/event/create', jwtCheck, eventController.create);
router.post('/event/update', jwtCheck, eventCheck, eventController.update);
router.get('/event/validate', eventController.validateTitle);
router.get('/event/get', eventController.get);
router.get('/event/discover', eventController.discover);
router.get('/event/lenovoDiscover', eventController.lenovoDiscover);
router.get('/event/getEventsByUserIdAndPageIndex', jwtCheck, eventController.getEventsByUserIdAndPageIndex);
router.get('/event/getEventCategories', eventController.getEventCategories);
router.post('/event/updateDomainName', jwtCheck, eventCheck, eventController.updateDomainName);
router.post('/event/updateSmsNotice', jwtCheck, eventCheck, eventController.updateSmsNotice);
router.get('/event/collectionStatistics', jwtCheck, eventCheck, eventCheck, eventController.collectionStatistics);
router.get('/event/registrationStatistics', jwtCheck, eventCheck, eventController.registrationStatistics);
router.get('/event/attendeesStatistics', jwtCheck, eventCheck, eventController.attendeesStatistics);
router.post('/event/attendeesInformationStatistics', jwtCheck, eventCheck, eventController.attendeesInformationStatistics);
router.get('/event/getTypeCount', jwtCheck, eventController.getTypeCount);
router.post('/event/deleteEvent', jwtCheck, eventCheck, eventController.deleteEventByEventId);
router.post('/event/cancelEvent', jwtCheck, eventCheck, eventController.cancelEventByEventId);
router.get('/event/pictures', adminPictureLibController.getList);
router.post('/event/uploadRegisterListFile', eventController.uploadRegisterListFile);
router.post('/event/saveRegisterListRelationship', eventController.saveRegisterListRelationship);
// 活动相关

// 短信邮件
router.post('/notice/addSmsOrder', jwtCheck, noticeController.addSmsOrder);
router.post('/notice/addEmailOrder', jwtCheck, noticeController.addEmailOrder);
router.post('/notice/preparePaySmsEmailOrder', noticeController.preparePaySmsEmailOrder);
router.get('/notice/getSmsEmailOrderPayResult', noticeController.getSmsEmailOrderPayResult);
router.post('/notice/paySmsEmailOrder', noticeController.paySmsEmailOrder);
router.post('/sc/callbackListener', noticeController.callbackListener);
router.post('/ym/callbackListener', noticeController.yiMeiCallbackListener);
router.post('/notice/saveRecord', jwtCheck, noticeController.saveRecord);
router.get('/notice/getRecord', jwtCheck, noticeController.getRecord);
router.get('/notice/getRecords', jwtCheck, noticeController.getRecords);
router.post('/notice/updateRecord', jwtCheck, noticeController.updateRecord);
router.post('/notice/delRecord', jwtCheck, noticeController.delRecord);
router.post('/notice/resendRecord', jwtCheck, noticeController.resendRecord);
router.get('/notice/getSendRecords', jwtCheck, noticeController.getSendRecords);
// 短信邮件

// 表单收集项
router.post('/fieldType/add', jwtCheck, fieldTypeController.addFieldType);
router.post('/fieldType/addFieldTypes', jwtCheck, fieldTypeController.addFieldTypes);
router.post('/fieldType/update', jwtCheck, fieldTypeController.updateFieldType);
router.get('/fieldType/getById', fieldTypeController.getFieldTypeById);
router.get('/fieldType/getFieldTypeByIsCustomizableField/:customType', fieldTypeController.getFieldTypeByIsCustomizableField);
router.get('/fieldType/getAllFieldType', fieldTypeController.getAllFieldType);
router.post('/formField/addFormFields', jwtCheck, formFieldController.addFormFields);
router.post('/formField/add', jwtCheck, formFieldController.addFormField);
router.post('/formField/delete', jwtCheck, formFieldController.deleteFormFieldByName);
router.post('/formField/update', jwtCheck, formFieldController.updateFormField);
router.get('/formField/getByName', jwtCheck, formFieldController.getFormFieldByName);
router.get('/formField/getFormFieldListByEventId', jwtCheck, formFieldController.getFormFieldListByEventId);
// 表单收集项

// 门票相关
router.post('/ticket/add', jwtCheck, ticketController.addTicket);
router.post('/ticket/addTickets', jwtCheck, ticketController.addTickets);
router.post('/ticket/update', jwtCheck, ticketController.updateTicket);
router.post('/ticket/delete', jwtCheck, ticketController.deleteTicket);
router.post('/ticket/updateRefundSettings', jwtCheck, ticketController.updateRefundSettings);
router.get('/event/tickets', jwtCheck, ticketController.getEventTickets);
router.get('/event/getEventTicketDetail', jwtCheck, ticketController.getEventTicketDetail);
router.post('/discount/delete', jwtCheck, ticketController.deleteDiscount);
// 门票相关

// 折扣码
router.post('/discount/add', jwtCheck, eventCheck, ticketController.addDiscount);
router.post('/discount/update', jwtCheck, ticketController.updateDiscount);
router.post('/discount/delete', jwtCheck, ticketController.deleteDiscount);
router.get('/event/discounts', jwtCheck, eventCheck, ticketController.getEventDiscounts);
router.get('/discount/get', ticketController.getDiscountById);
router.get('/discount/getDiscountByCode', ticketController.getDiscountByCode);
// 折扣码

// 订单相关
router.post('/order/create', orderController.createOrder);
router.get('/order/prepareAdminAddAttendee', jwtCheck, orderController.prepareAdminAddAttendee);
router.post('/order/cancelOrder', orderController.cancelOrder);
router.post('/order/updatePaymentMethod', orderController.updatePaymentMethod);
router.get('/order/getOrderByEventIdAndPageIndex', jwtCheck, eventCheck, orderController.getOrderByEventIdAndPageIndex);
router.get('/order/getOrderById', orderController.getOrderById);
router.get("/order/getOrderByOrderNum", orderController.getOrderByOrderNum);
router.post("/order/isUnique", orderController.validateIsUnique);
router.post("/order/auditOrder", jwtCheck, orderController.auditOrder);
router.get("/order/statisticsDiscountCodeUsage", jwtCheck, orderController.statisticsDiscountCodeUsage);
router.post("/order/updateOrderNote", jwtCheck, orderController.updateOrderNote);
router.post("/order/prepareCreateOrder", orderController.prepareCreateOrder);
router.post("/order/preparePay", orderController.preparePay);
router.get("/order/getTicketOrderPayResult", orderController.getTicketOrderPayResult);
router.get("/order/prepareExportOrders", jwtCheck, orderController.prepareExportOrders);
router.post('/order/payTicketOrder', orderController.payTicketOrder);
router.get("/order/getOrderByUserIdAndPageIndex", jwtCheck, orderController.getOrderByUserIdAndPageIndex);
router.post('/order/confirmOfflineOrder', jwtCheck, orderController.confirmOfflineOrder);
router.post('/order/confirmAttendee', jwtCheck, orderController.confirmAttendee);
// 订单相关

// 参会者
router.get("/attendee/getAttendeesByEventIdAndPageIndex", jwtCheck, eventCheck, attendeeController.getAttendeesByEventIdAndPageIndex);
router.post("/attendee/addAttendeeNotes", jwtCheck, attendeeController.addAttendeeNotes);
router.get("/attendee/getAttendee", attendeeController.getAttendee);
router.get("/attendee/getAllAttendee", attendeeController.getAllAttendee);
router.post("/attendee/updateAttendee", jwtCheck, attendeeController.updateAttendee);

router.post("/attendee/updateAttendeeById", attendeeController.updateAttendeeById);

router.get("/attendee/generateBarcode", jwtCheck, attendeeController.generateBarcode);
router.get("/attendee/generateQRcode", attendeeController.generateQRcode);
router.post("/attendee/checkedIn", jwtCheck, attendeeController.checkedIn);
router.post("/attendee/batchCheckedIn", jwtCheck, attendeeController.batchCheckedIn);
router.post("/attendee/reSendEticket", jwtCheck, attendeeController.reSendEticket);
router.get("/attendee/downloadEticket", attendeeController.downloadEticket);
router.get("/attendee/downloadAllEticket", attendeeController.downloadAllEticket);
router.get('/attendee/prepareExportAttendees', jwtCheck, attendeeController.prepareExportAttendees);
router.get('/attendee/waitForWirtenCompleted', attendeeController.waitForWirtenCompleted);
router.get('/attendee/downloadFile', attendeeController.downloadFile);
router.post('/attendee/serchAttendeesByQuery', attendeeController.serchAttendeesByQuery);


// 参会者

// 数据导入导出  export:导出   import:导入  {name:名称}
router.get('/export/:name', jwtCheck, importExportController.exportData);
router.get('/file/itexist', importExportController.fileItexist);
router.get('/file/download', importExportController.downloadFile);
// 导入导出

// 首页推荐
router.get('/recommend/index', recommendController.recommend);
router.get('/recommend/getRecommendByObjectTypeAndPageIndex', recommendController.getRecommendByObjectTypeAndPageIndex);
// 首页推荐

// 发票相关
router.get("/invoice/getInvoiceSetting", jwtCheck, invoiceController.getInvoiceSetting);
router.get("/invoice/getInvoiceList", jwtCheck, eventCheck, invoiceController.getInvoiceList);
router.get("/invoice/getInvoiceDetail", jwtCheck, invoiceController.getInvoiceDetail);
router.post("/invoice/updateInvoiceSetting", jwtCheck, invoiceController.updateInvoiceSetting);
router.post("/invoice/updateInvoice", jwtCheck, invoiceController.updateInvoice);
// 发票相关

// 联系人
router.get("/ab/getAddressBook", jwtCheck, addressBookController.getAddressBook);
router.get("/ab/getAddressBookById", jwtCheck, addressBookController.getAddressBookById);
router.post("/ab/addAddressBook", jwtCheck, addressBookController.addAddressBook);
router.post("/ab/updateAddressBook", jwtCheck, addressBookController.updateAddressBook);
router.post("/ab/deleteAddressBook", jwtCheck, addressBookController.deleteAddressBook);
router.post("/ab/batchAddAddressBook", jwtCheck, addressBookController.batchAddAddressBook);
router.post("/ab/addTag", jwtCheck, addressBookTagsController.addTag);
router.post("/ab/updateTag", jwtCheck, addressBookTagsController.updateTag);
router.post("/ab/deleteTag", jwtCheck, addressBookTagsController.deleteTag);
router.get("/ab/getAllTag", jwtCheck, addressBookTagsController.getAllTag);
// 联系人

// 钱包
router.post("/wallet/addPaypalAccount", jwtCheck, walletController.addPaypalAccount);
router.post("/wallet/updatePaypalAccount", jwtCheck, walletController.updatePaypalAccount);
router.post("/wallet/deletePaypalAccountById", jwtCheck, walletController.deletePaypalAccountById);
router.post("/wallet/addPersonalAccount", jwtCheck, walletController.addPersonalAccount);
router.post("/wallet/updatePersonalAccountById", jwtCheck, walletController.updatePersonalAccountById);
router.post("/wallet/deletePersonalAccountById", jwtCheck, walletController.deletePersonalAccountById);
router.post("/wallet/addBusinessAccount", jwtCheck, walletController.addBusinessAccount);
router.post("/wallet/updateBusinessAccountById", jwtCheck, walletController.updateBusinessAccountById);
router.post("/wallet/deleteBusinessAccountById", jwtCheck, walletController.deleteBusinessAccountById);
router.post("/wallet/auditBusinessAccount", jwtCheck, walletController.auditBusinessAccount);
router.get("/wallet/getWalletDetail", jwtCheck, walletController.getWalletDetail);
router.get("/wallet/getBankList", (req, res) => res.send(myutil.getBankList()));
// 钱包

//tools
router.get("/tools/qiniu/upToken", qiniuController.getUpToken);
//tools

// 事物表
router.get('/transaction/getTransactionRecordList', jwtCheck, transactionController.getTransactionRecordList);
router.get('/transaction/getAvailableCashList', jwtCheck, transactionController.getAvailableCashList);
router.post('/transaction/submitCashApplication', jwtCheck, transactionController.submitCashApplication);
router.get('/transaction/getWithdrawList', jwtCheck, transactionController.getWithdrawList);
// 事物表

// BEGIN 微信邀请函
router.post('/invitation/generateWXInvitations', jwtCheck, invitationController.generateWXInvitations)
router.post('/invitation/updateTemplate', jwtCheck, invitationController.updateTemplate)
router.post('/invitation/updateAutosend', jwtCheck, invitationController.updateAutosend)
router.post('/invitation/insertWxTemplate', jwtCheck, invitationController.insertWxTemplate)
// END 微信邀请函

// 会鸽后台接口
router.post('/admin/manager/addManager', adminJwtCheck, managerController.addManager);
router.post('/admin/manager/managerLogin', managerController.managerLogin);
router.post('/admin/manager/addRole', adminJwtCheck, managerController.addRole);
router.post('/admin/manager/updatePwd', adminJwtCheck, managerController.updatePwd);
router.post('/admin/manager/updateRole', adminJwtCheck, managerController.updateRole);
router.post('/admin/manager/addAuth', adminJwtCheck, managerController.addAuth);
router.post('/admin/manager/updateAuth', adminJwtCheck, managerController.updateAuth);
router.post('/admin/manager/deleteAuth', adminJwtCheck, managerController.deleteAuth);
router.get('/admin/manager/getRootAuth', adminJwtCheck, managerController.getRootAuth);
router.get('/admin/manager/getAuthPageIndex', adminJwtCheck, managerController.getAuthPageIndex);
router.get('/admin/manager/getAuthById', adminJwtCheck, managerController.getAuthById);
router.get('/admin/manager/getRolePageIndex', adminJwtCheck, managerController.getRolePageIndex);
router.get('/admin/manager/getRoleById', adminJwtCheck, managerController.getRoleById);
router.post('/admin/manager/deleteRole', adminJwtCheck, managerController.deleteRole);
router.get('/admin/manager/getAllAuthList', adminJwtCheck, managerController.getAllAuthList);
router.get('/admin/manager/getAllRoleList', adminJwtCheck, managerController.getAllRoleList);
router.get('/admin/manager/getManagerPageIndex', adminJwtCheck, managerController.getManagerPageIndex);
router.post('/admin/manager/deleteManager', adminJwtCheck, managerController.deleteManager);
router.post('/admin/manager/resetManagerPwd', adminJwtCheck, managerController.resetManagerPwd);
router.get('/admin/manager/getManagerById', adminJwtCheck, managerController.getManagerById);
router.post('/admin/manager/updateManager', adminJwtCheck, managerController.updateManager);
router.get('/admin/event/getEventsPageIndex', adminJwtCheck, adminEventController.getEventsPageIndex);
router.post('/admin/event/updateEventStatus', adminEventController.updateEventStatus);
router.get('/admin/event/getAllEventDomains', adminJwtCheck, adminEventController.getAllEventDomains);
router.get('/admin/event/get', adminJwtCheck, adminEventController.get);
router.post('/admin/event/addEventDomainName', adminJwtCheck, adminEventController.addEventDomainName);
router.post('/admin/event/updateEventDomainName', adminJwtCheck, adminEventController.updateEventDomainName);
router.post('/admin/event/deleteEventDomainName', adminJwtCheck, adminEventController.deleteEventDomainName);
router.get('/admin/user/getUsersPageIndex', adminJwtCheck, adminUserController.getUsersPageIndex);
router.post('/admin/user/updateAuditStatus', adminJwtCheck, adminUserController.updateAuditStatus);
router.get('/admin/user/getBAccountsPageIndex', adminJwtCheck, adminAcountController.getBAccountsPageIndex);
router.get('/admin/user/getBAccountsDatil', adminJwtCheck, adminAcountController.getBAccountsDatil);
router.post('/admin/user/updateBAccount', adminJwtCheck, adminAcountController.updateBAccount);
router.get('/admin/user/getAllUser', adminUserController.getAllUser);
router.post('/admin/user/updateUser', adminJwtCheck, adminUserController.updateUser);
router.get('/admin/user/getUserById', adminJwtCheck, adminUserController.getUserById);
router.get('/admin/user/getUserEvent', adminJwtCheck, adminUserController.getUserEvent);
router.get('/admin/user/getUserGroups', adminJwtCheck, adminUserController.getUserGroups);
router.get('/admin/user/getUserOrders', adminJwtCheck, adminUserController.getUserOrders);
router.get('/admin/order/getOrderById', adminJwtCheck, adminOrderController.getOrderById);
router.post('/admin/recommend/update', adminJwtCheck, recommendController.update);
router.post('/admin/recommend/uploadRecommendImage', recommendController.uploadRecommendImage);
router.post('/admin/recommend/add', adminJwtCheck, recommendController.add);
router.post('/admin/recommend/del', adminJwtCheck, recommendController.del);
router.post('/admin/template/uploadFiles', templateController.uploadFiles);
router.post('/admin/template/addTemplate', templateController.addTemplate);
router.get('/admin/feedback/getFeedbackPageIndex', adminJwtCheck, adminFeedback.getFeedbackPageIndex);
router.post('/admin/feedback/updataStatus', adminJwtCheck, adminFeedback.updateFeedbackStatus);


router.get('/admin/template/emailSms/list', templateController.getList);
router.post('/admin/template/emailSms/add', templateController.add);
router.post('/admin/template/emailSms/update', adminJwtCheck, templateController.update);
router.post('/admin/template/emailSms/del', adminJwtCheck, templateController.del);

router.get('/template/emailSms/byname', templateController.getByName);


router.get('/admin/member/getMembershipAndPageIndex', adminJwtCheck, memberController.getMembershipAndPageIndex);
router.get('/admin/withdraw/getWithdrawAndPageIndex', adminJwtCheck, adminWithdrawController.getWithdrawPageIndex);
router.post('/admin/withdraw/updateWithdrawStatus', adminJwtCheck, adminWithdrawController.updateWithdrawStatus);
router.get('/admin/picture/list', adminJwtCheck, adminPictureLibController.getList);
router.post('/admin/picture/add', adminJwtCheck, adminPictureLibController.add);
router.post('/admin/picture/update', adminJwtCheck, adminPictureLibController.update);
router.post('/admin/picture/del', adminJwtCheck, adminPictureLibController.del);
router.get('/admin/pictureType/list', adminJwtCheck, adminPictureTypeController.getList);
router.post('/admin/pictureType/add', adminJwtCheck, adminPictureTypeController.add);
router.post('/admin/pictureType/update', adminJwtCheck, adminPictureTypeController.update);
router.post('/admin/pictureType/del', adminJwtCheck, adminPictureTypeController.del);
router.post('/test/test', eventController.test);

// 会鸽后台接口

// 微信相关
router.get('/wechat', wechatController.wxIndex);
router.post('/wechat', wechatController.wxData);
router.get('/wx/menu', wechatController.wxMenu);
router.get('/wx/oauth', wechatController.wxAuth);
router.post('/wx/qrCode/:name', wechatController.cQrcode);
// 微信相关

module.exports = router;
