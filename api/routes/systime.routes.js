const express = require('express');
const sysTimeCtrl = require('../controllers/systime.controller');

const router = express.Router();

router.route('/')
  .get(sysTimeCtrl.findAll);

module.exports = router;