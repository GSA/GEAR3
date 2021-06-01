const express = require('express');
const investmentCtrl = require('../controllers/investments.controller');

const router = express.Router();

router.route('/')
  .get(investmentCtrl.findAll);

router.route('/get/:id')
  .get(investmentCtrl.findOne);

router.route('/get/:id/systems/')
  .get(investmentCtrl.findSystems);

// router.route('/latest')
//   .get(investmentCtrl.findLatest);

// router.route('/update/:id')
//   .put(investmentCtrl.update);

// router.route('/create')
//   .post(investmentCtrl.create);

module.exports = router;