const express = require('express');
const pocCtrl = require('../controllers/pocs.controller');

const router = express.Router();

router.route('/')
  .get(pocCtrl.findAll);

router.route('/get/:id')
  .get(pocCtrl.findOne);

module.exports = router;