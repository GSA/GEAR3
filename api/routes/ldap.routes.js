const express = require('express');
const ldap = require('../controllers/ldap.controller');

const router = express.Router();

router.route('/:first_name&:last_name')
  .get(ldap.check);

module.exports = router;