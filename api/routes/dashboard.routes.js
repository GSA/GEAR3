const express = require('express');
const dashCtrl = require('../controllers/dashboard.controller');

const router = express.Router();

router.route('/').get(dashCtrl.getDashboardSummary);
router.route('/hosting_platforms').get(dashCtrl.getHostingPlatforms);

module.exports = router;
