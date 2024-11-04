import { Router } from 'express';
import { getAttributeDefinitions } from '../controllers/tech-attribute-definitions.controller';

const router = Router();

router.route('/get/attribute_definitions')
  .get(getAttributeDefinitions);

export default router;
