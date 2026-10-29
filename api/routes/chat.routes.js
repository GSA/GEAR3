const express = require('express');
const chatCtrl = require('../controllers/chat.controller');

const router = express.Router();

router.route('/')
  .post(chatCtrl.chatRateLimiter, chatCtrl.chat);

router.route('/feedback')
  .patch(chatCtrl.chatRateLimiter, chatCtrl.feedback);

module.exports = router;
