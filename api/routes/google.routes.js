const express = require('express');
const googleCtrl = require('../controllers/google.controller');

const router = express.Router();

router.route('/auth')
  .get(googleCtrl.auth);

router.route('/saveToken')
  .get(googleCtrl.saveToken);

module.exports = router;