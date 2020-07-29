const express = require('express');
const searchCtrl = require('../controllers/search.controller');

const router = express.Router();

router.route('/:kw')
  .get(searchCtrl.searchAll);

module.exports = router;