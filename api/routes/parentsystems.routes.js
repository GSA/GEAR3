const express = require('express');
const sysCtrl = require('../controllers/parentsystems.controller');

const router = express.Router();

router.route('/')
    .get(sysCtrl.findAll);

router.route('/get/:id')
    .get(sysCtrl.findOne);

router.route('/get/:id/applications')
    .get(sysCtrl.findApplications);

router.route('/latest')
    .get(sysCtrl.findLatest);

router.route('/update/:id')
    .put(sysCtrl.update);

router.route('/create')
    .post(sysCtrl.create);

module.exports = router;