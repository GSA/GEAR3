const express = require('express');
const pocCtrl = require('../controllers/pocs.controller');

const router = express.Router();

router.route('/')
  .get(pocCtrl.findAll);

router.route('/get/:samName')
  .get(pocCtrl.findOne);

router.route('/risso')
  .get(pocCtrl.findRissos);

module.exports = router;