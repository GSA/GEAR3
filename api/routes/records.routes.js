import { Router } from 'express';
import { findAll, findOne, findSystems, updateSystems, refreshAllSystems, logEvent } from '../controllers/records.controller';

const router = Router();

router.route('/')
  .get(findAll);

router.route('/get/:id')
  .get(findOne);

router.route('/get/:id/systems')
  .get(findSystems);

router.route('/updateSystems/:id')
  .put(updateSystems);

  // Refresh all systems from Google Sheet
router.route('/updateAllSystems')
  .put(refreshAllSystems);

router.route('/logEvent')
  .post(logEvent);

export default router;