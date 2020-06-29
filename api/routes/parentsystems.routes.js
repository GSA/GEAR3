const express = require('express');
const sysCtrl = require('../controllers/parentsystems.controller');

const router = express.Router();

router.route('/')
    .get(sysCtrl.findAll);

router.route('/:id')
    .get(sysCtrl.findOne);

// Children
router.route('/:id/applications/')
    .get(sysCtrl.findApplications);

module.exports = router;