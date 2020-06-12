const express = require('express');
const investmentCtrl = require('../controllers/investments.controller');

const router = express.Router();

router.route('/')
    .get(investmentCtrl.findAll);

router.route('/:id')
    .get(investmentCtrl.findOne);

// Children
router.route('/:id/applications/')
    .get(investmentCtrl.findApplications);

module.exports = router;