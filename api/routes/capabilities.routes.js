const express = require('express');
const capabilitiesCtrl = require('../controllers/capabilities.controller');

const router = express.Router();

router.route('/')
    .get(capabilitiesCtrl.findAll);

// router.route('/:id')
//     .get(capabilityCtrl.findOne);

// children
// router.route('/:id/applications')
//     .get(capabilityCtrl.findApplications);

// special (reports, data viz, etc.)
// router.route('/app-counts')
//     .get(capabilityCtrl.findAppCounts);

module.exports = router;