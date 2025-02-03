const express = require('express');
const itsCtrl = require('../controllers/it-standards.controller');

const router = express.Router();

router.route('/')
  .get(itsCtrl.findAll);

router.route('/all')
  .get(itsCtrl.findAllNoFilter);

router.route('/get/:id')
  .get(itsCtrl.findOne);

router.route('/get/:id/systems/')
  .get(itsCtrl.findSystems);

router.route('/latest')
  .get(itsCtrl.findLatest);

router.route('/update/:id')
  .put(itsCtrl.update);

router.route('/create')
  .post(itsCtrl.create);

router.route('/508_compliance')
  .get(itsCtrl.find508Compliance);

router.route('/categories')
  .get(itsCtrl.findCategories);

router.route('/deployment_types')
  .get(itsCtrl.findDeployTypes);

router.route('/statuses')
  .get(itsCtrl.findStatuses);

router.route('/types')
  .get(itsCtrl.findTypes);

router.route('/attestation_status_types')
  .get(itsCtrl.findAttestationStatusTypes);

router.route('/operating_systems')
  .get(itsCtrl.getAllOperatingSystems);

router.route('/app_bundles/:id')
  .get(itsCtrl.getAppBundles);

module.exports = router;
