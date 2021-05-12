const express = require('express');
const sysTimeCtrl = require('../controllers/systime.controller');

const router = express.Router();

router.route('/')
  .get(sysTimeCtrl.findAll);

router.route('/get/:id')
  .get(sysTimeCtrl.findOne);

router.route('/getByName/:name')
  .get(sysTimeCtrl.findByName);

module.exports = router;