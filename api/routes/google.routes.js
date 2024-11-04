import { Router } from 'express';
import { auth, saveToken } from '../controllers/google.controller';

const router = Router();

router.route('/auth')
  .get(auth);

router.route('/saveToken')
  .get(saveToken);

export default router;