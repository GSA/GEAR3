import { Router } from 'express';
import { getManufacturers, getSoftwareProducts, getSoftwareVersions, getSoftwareReleases } from '../controllers/tech-catalog.controller';

const router = Router();

router.route('/get/manufacturers')
  .get(getManufacturers);

router.route('/get/software_products/:id')
  .get(getSoftwareProducts);

router.route('/get/software_versions/:id')
  .get(getSoftwareVersions);

router.route('/get/software_releases/:id')
  .get(getSoftwareReleases);

export default router;