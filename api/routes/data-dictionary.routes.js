const express = require('express');
const dataDictionaryCtrl = require('../controllers/data-dictionary.controller');

const router = express.Router();

router.route('/')
  .get(dataDictionaryCtrl.getDataDictionary);

  router.route('/get/:reportName')
  .get(dataDictionaryCtrl.getDataDictionaryByReportName);

module.exports = router;