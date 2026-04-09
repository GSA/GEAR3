const express = require('express');
const searchCtrl = require('../controllers/search.controller');
const aiCtrl = require('../controllers/ai.controller');

const router = express.Router();

router.route('/:kw')
  .get(searchCtrl.searchAll);

// router.route('/ai_test')
//   .get(aiCtrl.get);

module.exports = router;