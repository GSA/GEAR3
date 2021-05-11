const express = require('express');
const sysCtrl = require('../controllers/systems.controller');

const router = express.Router();

router.route('/')
  .get(sysCtrl.findAll);

router.route('/get/:id')
  .get(sysCtrl.findOne);

router.route('/getByName/:name')
  .get(sysCtrl.findByName);

// router.route('/get/:id/systems')
//   .get(sysCtrl.findSubSystems);

// router.route('/get/:id/capabilities')
//   .get(sysCtrl.findCapabilities);

// router.route('/get/:id/technologies')
//   .get(sysCtrl.findTechnologies);

module.exports = router;