const express = require('express');
const chatCtrl = require('../controllers/chat.controller');

const router = express.Router();

router.route('/')
  .post(chatCtrl.chatRateLimiter, chatCtrl.chat);

router.route('/overview')
  .post(chatCtrl.chatRateLimiter, chatCtrl.overview);

module.exports = router;
