const express = require('express');
const appCtrl = require('../controllers/applications.controller');

const router = express.Router();

router.route('/')
    .get(appCtrl.findAll);

router.route('/get/:id')
    .get(appCtrl.findOne);

router.route('/applications_retired')
    .get(appCtrl.findAllRetired);

router.route('/get/:id/capabilities/')
    .get(appCtrl.findCapabilities);

router.route('/get/:id/technologies/')
    .get(appCtrl.findTechnologies);

router.route('/get/:id/interfaces/')
    .get(appCtrl.findInterfaces);

router.route('/latest')
    .get(appCtrl.findLatest);

router.route('/update/:id')
    .put(appCtrl.update);

router.route('/create')
    .post(appCtrl.create);

router.route('/statuses')
    .get(appCtrl.findStatuses);

router.route('/host_providers')
    .get(appCtrl.findHosts);

// router.route('/:id/interfacesv2/')
//     .get(appCtrl.findInterfacesv2);

module.exports = router;