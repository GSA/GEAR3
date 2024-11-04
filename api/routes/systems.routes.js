import { Router } from 'express';
import { findAll, findOne, findSubsystems, findCapabilities, updateCaps, findInvestments, updateInvest, findRecords, findWebsites, findTechnologies, updateTech, findTIME } from '../controllers/systems.controller';

const router = Router();

router.route('/')
  .get(findAll);

router.route('/get/:id')
  .get(findOne);

router.route('/get/:id/subsystems')
  .get(findSubsystems);

router.route('/get/:id/capabilities')
  .get(findCapabilities);

router.route('/updateCaps/:id')
  .put(updateCaps);

router.route('/get/:id/investments')
  .get(findInvestments);

router.route('/updateInvest/:id')
  .put(updateInvest);

router.route('/get/:id/records')
  .get(findRecords);

router.route('/get/:id/websites')
  .get(findWebsites);

router.route('/get/:id/technologies')
  .get(findTechnologies);

router.route('/updateTech/:id')
  .put(updateTech);

router.route('/get/:id/time')
  .get(findTIME);

export default router;