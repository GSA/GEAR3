const express = require('express');
const capabilitiesCtrl = require('../controllers/capabilities.controller');

const router = express.Router();

router.route('/')
  .get(capabilitiesCtrl.findAll);

router.route('/get/:id')
  .get(capabilitiesCtrl.findOne);

router.route('/getByName/:name')
  .get(capabilitiesCtrl.findOneName);

router.route('/get/:id/systems')
  .get(capabilitiesCtrl.findSystems);

router.route('/get/:id/orgs')
  .get(capabilitiesCtrl.findOrgs);

router.route('/updateOrgs/:id')
  .put(capabilitiesCtrl.updateOrgs);

module.exports = router;