const express = require('express');
const appCtrl = require('../controllers/applications.controller');

const router = express.Router();

router.route('/')
    .get(appCtrl.findAll);

router.route('/:id')
    .get(appCtrl.findOne);

router.route('/applications_retired')
    .get(appCtrl.findAllRetired);

// Children
router.route('/:id/capabilities/')
    .get(appCtrl.findCapabilities);

router.route('/:id/technologies/')
    .get(appCtrl.findTechnologies);

// router.route('/:id/pocs/')
//     .get(appCtrl.findPOCs);

router.route('/:id/interfaces/')
    .get(appCtrl.findInterfaces);

// router.route('/:id/interfacesv2/')
//     .get(appCtrl.findInterfacesv2);

module.exports = router;