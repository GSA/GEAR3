import { Router } from 'express';
import { findAll, findAllNoFilter, findOne, findSystems, findLatest, update, create, find508Compliance, findCategories, findDeployTypes, findStatuses, findTypes, findAttestationStatusTypes } from '../controllers/it-standards.controller';

const router = Router();

router.route('/')
  .get(findAll);

router.route('/all')
  .get(findAllNoFilter);

router.route('/get/:id')
  .get(findOne);

router.route('/get/:id/systems/')
  .get(findSystems);

router.route('/latest')
  .get(findLatest);

router.route('/update/:id')
  .put(update);

router.route('/create')
  .post(create);

router.route('/508_compliance')
  .get(find508Compliance);

router.route('/categories')
  .get(findCategories);

router.route('/deployment_types')
  .get(findDeployTypes);

router.route('/statuses')
  .get(findStatuses);

router.route('/types')
  .get(findTypes);

router.route('/attestation_status_types')
  .get(findAttestationStatusTypes);

export default router;
