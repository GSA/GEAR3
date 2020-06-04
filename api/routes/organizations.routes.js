const express = require('express');
const orgCtrl = require('../controllers/organizations.controller');

const router = express.Router();

router.route('/')
    .get(orgCtrl.findAll);

router.route('/:id')
    .get(orgCtrl.findOne);

// Children
router.route('/:id/applications/')
    .get(orgCtrl.findApplications);

module.exports = router;