const express = require('express');
const downloadCtrl = require('../controllers/download.controller');

const router = express.Router();

router.route('/download-csv')
  .put(downloadCtrl.downloadCsv);


module.exports = router;