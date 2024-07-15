const express = require('express');
const attDefCtrl = require('../controllers/tech-attribute-definitions.controller');

const router = express.Router();

router.route('/get/attribute_definitions')
  .get(attDefCtrl.getAttributeDefinitions);

module.exports = router;
