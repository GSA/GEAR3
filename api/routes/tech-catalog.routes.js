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

router.route('/post/custom_manufacturer/:name')
  .post(techCatalogCtrl.saveCustomManufacturer);

router.route('/put/custom_software_product/:name')
  .put(techCatalogCtrl.saveCustomSoftwareProduct);

router.route('/put/custom_software_version/:name')
  .put(techCatalogCtrl.saveCustomSoftwareVersion);

module.exports = router;