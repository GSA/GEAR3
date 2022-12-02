const express = require('express');
const serviceCategoryCtrl = require('../controllers/service-category.controller');

const router = express.Router();

router.route('/').get(serviceCategoryCtrl.findAll);
router.route('/get/:id').get(serviceCategoryCtrl.findOne);
router.route('/get/:id/websites').get(serviceCategoryCtrl.findRelatedWebsites);

module.exports = router;