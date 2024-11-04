import { Router } from 'express';
import { runDailyTechCatalogImport, runTechCatalogImport } from '../controllers/tech-catalog-import.controller';

const router = Router();

router.route('/runDailyImport')
  .post(runDailyTechCatalogImport);

router.route('/runTechCatalogImport')
  .post(runTechCatalogImport);

export default router;