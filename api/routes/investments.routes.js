import { Router } from 'express';
import { findAll, findOne, findSystems } from '../controllers/investments.controller';

const router = Router();

router.route('/')
  .get(findAll);

router.route('/get/:id')
  .get(findOne);

router.route('/get/:id/systems/')
  .get(findSystems);

// router.route('/latest')
//   .get(investmentCtrl.findLatest);

// router.route('/update/:id')
//   .put(investmentCtrl.update);

// router.route('/create')
//   .post(investmentCtrl.create);

export default router;