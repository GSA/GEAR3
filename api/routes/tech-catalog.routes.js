const express = require('express');
const techCatalogCtrl = require('../controllers/tech-catalog.controller');

const router = express.Router();

router.route('/get/manufacturers')
  .get(techCatalogCtrl.getManufacturers);

router.route('/get/software_products/:id')
  .get(techCatalogCtrl.getSoftwareProduct);

router.route('/get/software_versions/:id')
  .get(techCatalogCtrl.getSoftwareVersion);

module.exports = router;