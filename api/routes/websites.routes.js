const express = require('express');
const websitesCtrl = require('../controllers/websites.controller');

const router = express.Router();

router.route('/')
  .get(websitesCtrl.findAll);

router.route('/get/:id')
  .get(websitesCtrl.findOne);

router.route('/get/:id/scans')
  .get(websitesCtrl.findScans);

router.route('/get/:id/scans/:scanId')
  .get(websitesCtrl.findOneScan);

router.route('/get/:id/systems')
  .get(websitesCtrl.findSystems);

router.route('/updateSystems/:id')
  .put(websitesCtrl.updateSystems);

module.exports = router;