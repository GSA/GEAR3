const express = require('express');
const trmCtrl = require('../controllers/trm.controller');

const router = express.Router();

router.route('/')
  .get(trmCtrl.findAll);

// router.route('/get/:id')
//   .get(trmCtrl.findOne);

module.exports = router;