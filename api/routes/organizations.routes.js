import { Router } from 'express';
import { findAll, findOne, findCapabilites, findSystems } from '../controllers/organizations.controller';

const router = Router();

router.route('/')
  .get(findAll);

router.route('/get/:id')
  .get(findOne);

router.route('/get/:id/capabilities/')
  .get(findCapabilites);

router.route('/get/:name/systems/')
  .get(findSystems);

export default router;