const express = require('express');
const dataFlowCtrl = require('../controllers/dataflow.controller');

const router = express.Router();

router.route('/')
  .get(dataFlowCtrl.findAll);

router.route('/get/:id')
  .get(dataFlowCtrl.findOne);

module.exports = router;