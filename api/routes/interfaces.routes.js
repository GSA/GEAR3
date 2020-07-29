const express = require('express');
const interfaceCtrl = require('../controllers/interfaces.controller');

const router = express.Router();

router.route('/')
  .get(interfaceCtrl.findAll);

module.exports = router;