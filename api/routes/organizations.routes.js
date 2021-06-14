const express = require('express');
const orgCtrl = require('../controllers/organizations.controller');

const router = express.Router();

router.route('/')
  .get(orgCtrl.findAll);

router.route('/get/:id')
  .get(orgCtrl.findOne);

router.route('/get/:id/capabilities/')
  .get(orgCtrl.findCapabilites);

router.route('/get/:name/systems/')
  .get(orgCtrl.findSystems);

module.exports = router;