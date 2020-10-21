const express = require('express');
const mngrReqCtrl = require('../controllers/manager-request.controller');

const router = express.Router();

router.route('/')
  .post(mngrReqCtrl.create);

module.exports = router;