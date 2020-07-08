const express = require('express');
const investmentCtrl = require('../controllers/investments.controller');

const router = express.Router();

router.route('/')
    .get(investmentCtrl.findAll);

router.route('/:id')
    .get(investmentCtrl.findOne);

router.route('/:id/applications/')
    .get(investmentCtrl.findApplications);

router.route('/update/:id')
    .put(investmentCtrl.update);

router.route('/types')
    .get(investmentCtrl.findTypes);

module.exports = router;