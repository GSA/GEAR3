const express = require('express');
const sysCtrl = require('../controllers/systems.controller');

const router = express.Router();

router.route('/')
  .get(sysCtrl.findAll);

router.route('/get/:id')
  .get(sysCtrl.findOne);

// router.route('/get/:id/subsystems')
//   .get(sysCtrl.findSubSystems);

router.route('/get/:id/capabilities')
  .get(sysCtrl.findCapabilities);

router.route('/updateCaps/:id')
  .put(sysCtrl.updateCaps);

router.route('/get/:id/technologies')
  .get(sysCtrl.findTechnologies);

router.route('/updateTech/:id')
  .put(sysCtrl.updateTech);

  router.route('/get/:id/records')
    .get(sysCtrl.findRecords);

module.exports = router;