import { Router } from 'express';
import { check } from '../controllers/ldap.controller';

const router = Router();

router.route('/:first_name&:last_name')
  .get(check);

export default router;