const express = require('express');
const sysCtrl = require('../controllers/systems.controller');

const router = express.Router();

router.route('/')
  .get(sysCtrl.findAll);

router.route('/get/:id')
  .get(sysCtrl.findOne);

router.route('/get/:id/subsystems')
  .get(sysCtrl.findSubsystems);

router.route('/get/:id/capabilities')
  .get(sysCtrl.findCapabilities);

router.route('/updateCaps/:id')
  .put(sysCtrl.updateCaps);

router.route('/get/:id/investments')
  .get(sysCtrl.findInvestments);

router.route('/updateInvest/:id')
  .put(sysCtrl.updateInvest);

router.route('/get/:id/records')
  .get(sysCtrl.findRecords);

router.route('/get/:id/websites')
  .get(sysCtrl.findWebsites);

router.route('/get/:id/technologies')
  .get(sysCtrl.findTechnologies);

router.route('/updateTech/:id')
  .put(sysCtrl.updateTech);

router.route('/get/:id/time')
  .get(sysCtrl.findTIME);

router.route('/filter_totals')
  .get(sysCtrl.getFilterTotals);

router.route('/decommissioned_system_totals')
  .get(sysCtrl.getDecommissionedSystemTotals);

router.route('/get/pocBySystemId/:systemId')
  .get(sysCtrl.getPOCsBySystemId);

module.exports = router;