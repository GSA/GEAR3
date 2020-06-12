const express = require('express');
const itsCtrl = require('../controllers/it-standards.controller');

const router = express.Router();

router.route('/')
    .get(itsCtrl.findAll);

router.route('/:id')
    .get(itsCtrl.findOne);

// Children
router.route('/:id/applications/')
    .get(itsCtrl.findApplications);

module.exports = router;
