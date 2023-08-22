const express = require('express');
const techCatImpCtrl = require('../controllers/tech-catalog-import.controller');

const router = express.Router();

//router.route('/runImport')
//  .post(techCatImpCtrl.runImport);

router.route('/runTechCatalogImport')
  .post(techCatImpCtrl.runTechCatalogImport);

module.exports = router;