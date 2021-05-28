const express = require('express');
const recordsCtrl = require('../controllers/records.controller');

const router = express.Router();

router.route('/')
  .get(recordsCtrl.findAll);

router.route('/get/:id')
  .get(recordsCtrl.findOne);

module.exports = router;