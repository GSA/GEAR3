import { Router } from 'express';
import { getDataDictionary, getDataDictionaryByReportName } from '../controllers/data-dictionary.controller';

const router = Router();

router.route('/')
  .get(getDataDictionary);

  router.route('/get/:reportName')
  .get(getDataDictionaryByReportName);

export default router;