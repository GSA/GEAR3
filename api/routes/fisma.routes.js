const express = require('express');
const fismaCtrl = require('../controllers/fisma.controller');

const router = express.Router();

router.route('/')
    .get(fismaCtrl.findAll);

router.route('/:id')
    .get(fismaCtrl.findOne);

// Children
router.route('/:id/applications')
    .get(fismaCtrl.findApplications);

router.route('/retired')
    .get(fismaCtrl.findRetired);

module.exports = router;