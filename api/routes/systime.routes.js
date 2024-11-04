import { Router } from 'express';
import { findAll } from '../controllers/systime.controller';

const router = Router();

router.route('/')
  .get(findAll);

export default router;