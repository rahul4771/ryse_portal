const express = require('express');
const checkAuth = require('../Middleware/checkAuth.middleware');
const checkRefreshAuth = require('../Middleware/checkRefreshAuth.middleware');
const customerControllers = require('../Controllers/customer.controllers');
const userControllers = require('../Controllers/users.controllers');
const adminControllers = require('../Controllers/admin.controllers');
const uomController = require('../Controllers/uom.controller');
const quoteControllers = require('../Controllers/quotes.controllers');
const contractControllers = require('../Controllers/contract.controller');
const invoiceControllers = require('../Controllers/invoice.controllers');
const customerSupply = require('../Controllers/customerSupply.controllers');
const blueboxSupply = require('../Controllers/blueboxSupply.controllers');
const hsp = require('../Controllers/hsp.controllers');
const router = express.Router();
const upload = require('../Middleware/multer.middleware');

router.post(
  '/uom',
  checkAuth,
  upload.singleFileUpload,
  uomController.createUom,
);
router.post('/uom/data', checkAuth, uomController.fetchAllUom);
router.get('/uom-doc', checkAuth, uomController.downloadUom);

router.post(
  '/uom-conv',
  checkAuth,
  upload.singleFileUpload,
  uomController.createUomConversion,
);
router.get('/uom-conv', checkAuth, uomController.fetchAllUomConversion);
router.get('/uom-conv-doc', checkAuth, uomController.downloadUomConversion);

router.post(
  '/materials',
  checkAuth,
  upload.singleFileUpload,
  uomController.createMaterial,
);
router.post('/materials/data', checkAuth, uomController.fetchAllMaterial);
router.get('/material-doc', checkAuth, uomController.downloadMaterial);

router.post(
  '/organizations',
  upload.singleFileUpload,
  userControllers.createOrganization,
);
router.put('/customer-update', checkAuth, customerControllers.customerUpdate);
router.post('/customer/approve', checkAuth, adminControllers.customerApprove);

router.post('/login', userControllers.userLogin);
router.post('/logout', checkAuth, userControllers.userLogout);
router.post('/reset-password-link', userControllers.userResetPasswordLink);
router.post('/verify-reset-link-token', userControllers.userResetLinkVerify);
router.post('/reset-password', userControllers.userResetPassword);

router.get('/quotes/requests', checkAuth, quoteControllers.requestedQuotes);
router.get('/quotes/expired', checkAuth, quoteControllers.expiredQuotes);
router.get('/quotes/approved', checkAuth, quoteControllers.approvedQuotes);

router.get('/quote-expire-mail', userControllers.quoteExpireNotify);
router.get('/status/update', adminControllers.updateStatus);

router.get(
  '/contracts/expired',
  checkAuth,
  contractControllers.expiredContracts,
);

router.post(
  '/quote/upload',
  checkAuth,
  upload.singleFileUpload,
  adminControllers.uploadQuote,
);
router.post(
  '/contract/upload',
  checkAuth,
  upload.singleFileUpload,
  adminControllers.uploadContract,
);
router.post(
  '/invoice/upload',
  checkAuth,
  upload.singleFileUpload,
  adminControllers.uploadInvoice,
);

router.post(
  '/customers/quote',
  checkAuth,
  upload.singleFileUpload,
  adminControllers.addQuoteCustomer,
);

router.post('/invoice-entry', checkAuth, invoiceControllers.invoiceEntry);
router.post('/invoices/send', checkAuth, invoiceControllers.sendInvoice);
router.post('/invoices/export', checkAuth, invoiceControllers.exportInvoiceCsv);

router.post('/quote/approve', checkAuth, quoteControllers.quoteApprove);
router.get('/open-user-pdf', userControllers.openPDF);

router.post(
  '/requiredAccountInformation',
  checkAuth,
  userControllers.requiredAccountInformation,
);
router.post(
  '/user/incompleteDetails',
  checkAuth,
  userControllers.userIncompleteDetails,
);
router.post(
  '/quote/customer/upload',
  checkAuth,
  upload.singleFileUpload,
  quoteControllers.uploadCustQuote,
);

router.post(
  '/contract/approve',
  checkAuth,
  upload.singleFileUpload,
  contractControllers.approveContract,
);
router.get('/contracts/download/:id', contractControllers.downloadContract);
router.get('/invoice/download/:id', invoiceControllers.downloadInvoice);

router.get('/contracts/list', checkAuth, contractControllers.contractlist);

router.post('/reports/download', checkAuth, customerSupply.downloadSupply);
router.delete(
  '/quotes/attachments',
  checkAuth,
  quoteControllers.deleteQuotesAttachments,
);

//Bluebox Supply Endpoints
router.post(
  '/supply-data/bluebox',
  checkAuth,
  upload.multipleFileUpload,
  blueboxSupply.createBluebox,
);
router.put(
  '/supply-data/bluebox/:id',
  upload.multipleFileUpload,
  blueboxSupply.updateBluebox,
);
router.get('/supply-data/bluebox/:id', blueboxSupply.getBluebox);
router.get('/supply-data/bluebox', checkAuth, blueboxSupply.getAllBluebox);
router.delete('/supply-data/bluebox/:id', blueboxSupply.deleteBluebox);
router.post(
  '/representation-agreement/upload',
  upload.singleFileUpload,
  blueboxSupply.uploadRepresentationAgreement,
);
router.delete(
  '/representation-agreement/delete/:id',
  blueboxSupply.deleteRepresentationAgreement,
);
router.get(
  '/representation-agreement/:id',
  blueboxSupply.fetchRepresentationAgreement,
);
//HSP Endpoints
router.put('/hsp/:id', upload.multipleFileUpload, hsp.updateHspCustomer);
router.get('/customers/hsp/:id', hsp.getHspCustomerInfo);
router.post(
  '/refresh-auth',
  checkRefreshAuth,
  userControllers.validateRemember,
);

module.exports = router;
