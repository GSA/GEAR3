const express = require('express');
const mngrReqCtrl = require('../controllers/manager-request.controller');

const router = express.Router();

router.route('/')
  .post(mngrReqCtrl.create);

router.route('/manager_request_email')
  .post(mngrReqCtrl.sendEmail);

router.route('/accept')
  .put(mngrReqCtrl.accept);

router.route('/reject')
  .put(mngrReqCtrl.reject);

module.exports = router;