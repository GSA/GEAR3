const express = require('express');
const trmCtrl = require('../controllers/trm.controller');

const router = express.Router();

router.route('/')
  .get(trmCtrl.findAll);

router.route('/get/:id')
  .get(trmCtrl.findOne);

router.route('/get/relatedITStandards/:id')
  .get(trmCtrl.relatedITStandards);

module.exports = router;