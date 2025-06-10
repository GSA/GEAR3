const express = require('express');
const techCatalogCtrl = require('../controllers/tech-catalog.controller');

const router = express.Router();

router.route('/get/manufacturers')
  .get(techCatalogCtrl.getManufacturers);

router.route('/get/software_products/:id')
  .get(techCatalogCtrl.getSoftwareProducts);

router.route('/get/software_versions/:id')
  .get(techCatalogCtrl.getSoftwareVersions);

  router.route('/get/custom_manufacturers')
  .get(techCatalogCtrl.getCustomManufacturers);

router.route('/get/custom_software_products/:id')
  .get(techCatalogCtrl.getCustomSoftwareProducts);

router.route('/get/custom_software_versions/:id')
  .get(techCatalogCtrl.getCustomSoftwareVersions);

router.route('/get/software_releases/:id')
  .get(techCatalogCtrl.getSoftwareReleases);

router.route('/post/custom_manufacturer')
  .post(techCatalogCtrl.saveCustomManufacturer);

router.route('/post/custom_software_product')
  .put(techCatalogCtrl.saveCustomSoftwareProduct);

router.route('/post/custom_software_version')
  .post(techCatalogCtrl.saveCustomSoftwareVersion);

module.exports = router;