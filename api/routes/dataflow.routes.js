import { Router } from 'express';
import { findAll, findOne } from '../controllers/dataflow.controller';

const router = Router();

router.route('/')
  .get(findAll);

router.route('/get/:id')
  .get(findOne);

export default router;