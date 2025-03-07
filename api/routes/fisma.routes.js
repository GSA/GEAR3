const express = require('express');
const fismaCtrl = require('../controllers/fisma.controller');

const router = express.Router();

router.route('/')
  .get(fismaCtrl.findAll);

router.route('/get/:id')
  .get(fismaCtrl.findOne);

// router.route('/get/:id/applications')
//   .get(fismaCtrl.findApplications);

router.route('/retired')
  .get(fismaCtrl.findRetired);

/* router.route('/update')
  .put(fismaCtrl.updateAll); */

router.route('/expiring_quarter')
  .get(fismaCtrl.getExpiringQuarter);

router.route('/expiring_week')
  .get(fismaCtrl.getExpiringWeek);

module.exports = router;