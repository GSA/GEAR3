import { Router } from 'express';
import { findAll, findOne, findOneName, findSystems, findOrgs, updateOrgs } from '../controllers/capabilities.controller';

const router = Router();

router.route('/')
  .get(findAll);

router.route('/get/:id')
  .get(findOne);

router.route('/getByName/:name')
  .get(findOneName);

router.route('/get/:id/systems')
  .get(findSystems);

router.route('/get/:id/orgs')
  .get(findOrgs);

router.route('/updateOrgs/:id')
  .put(updateOrgs);

export default router;