const express = require('express');
const capabilitiesCtrl = require('../controllers/capabilities.controller');

const router = express.Router();

router.route('/')
  .get(capabilitiesCtrl.findAll);

router.route('/get/:id')
  .get(capabilitiesCtrl.findOne);

router.route('/get/:id/systems')
  .get(capabilitiesCtrl.findSystems);

// router.route('/sso/:name')
//   .get(capabilitiesCtrl.findSSO);

module.exports = router;