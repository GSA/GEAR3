const express = require('express');
const chatCtrl = require('../controllers/chat.controller');

const router = express.Router();

router.route('/')
  .post(chatCtrl.chatRateLimiter, chatCtrl.chat);

module.exports = router;
