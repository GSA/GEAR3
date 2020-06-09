const express = require('express');
const timeCtrl = require('../controllers/apptime.controller');

const router = express.Router();

router.route('/')
    .get(timeCtrl.findAll);

router.route('/:id')
    .get(timeCtrl.findOne);

module.exports = router;
