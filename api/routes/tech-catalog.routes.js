const express = require('express');
const techCatalogCtrl = require('../controllers/tech-catalog.controller');

const router = express.Router();

router.route('/get/manufacturers')
  .get(techCatalogCtrl.getManufacturers);

router.route('/get/software_products/:id')
  .get(techCatalogCtrl.getSoftwareProducts);

router.route('/get/software_versions/:id')
  .get(techCatalogCtrl.getSoftwareVersions);

router.route('/get/software_releases/:id')
  .get(techCatalogCtrl.getSoftwareReleases);

router.route('/get/taxonomy_chart')
  .get(techCatalogCtrl.getTaxonomyChart);

module.exports = router;