const express = require('express');
const capabilitiesCtrl = require('../controllers/capabilities.controller');

const router = express.Router();

router.route('/')
    .get(capabilitiesCtrl.findAll);

router.route('/:id')
    .get(capabilitiesCtrl.findOne);

// Children
router.route('/:id/applications')
    .get(capabilitiesCtrl.findApplications);

router.route('/sso/:name')
    .get(capabilitiesCtrl.findSSO);

module.exports = router;