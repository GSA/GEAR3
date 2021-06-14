const express = require('express');
const recordsCtrl = require('../controllers/records.controller');

const router = express.Router();

router.route('/')
  .get(recordsCtrl.findAll);

router.route('/get/:id')
  .get(recordsCtrl.findOne);

router.route('/get/:id/systems')
  .get(recordsCtrl.findSystems);

router.route('/updateSystems/:id')
  .put(recordsCtrl.updateSystems);

module.exports = router;