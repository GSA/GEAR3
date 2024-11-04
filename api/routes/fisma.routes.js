import { Router } from 'express';
import { findAll, findOne, findRetired } from '../controllers/fisma.controller';

const router = Router();

router.route('/')
  .get(findAll);

router.route('/get/:id')
  .get(findOne);

// router.route('/get/:id/applications')
//   .get(fismaCtrl.findApplications);

router.route('/retired')
  .get(findRetired);

/* router.route('/update')
  .put(fismaCtrl.updateAll); */

export default router;