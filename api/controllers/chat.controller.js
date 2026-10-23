const path = require('path');
const rateLimit = require('express-rate-limit');

const {
  runChat,
} = require(path.join('..', '..', 'mcp', 'chat-orchestrator'));

const { saveFeedback, log: cacheLog } = require(path.join('..', '..', 'mcp', 'prompt-cache'));

/**
 * Dedicated rate limiter for the chat endpoint to protect the USAi budget
 * (USAi enforces 3 chat calls/sec/key and a weekly cost cap). One user turn can
 * fan out into several USAi calls via the tool loop, so keep this conservative.
 */
exports.chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Too many chat requests. Please wait a moment and try again.' },
});

/**
 * PATCH /api/chat/feedback
 * Body: { logId: number, feedback: 'up' | 'down' }
 */
exports.feedback = async (req, res) => {
  try {
    const { logId, feedback } = req.body || {};

    if (!logId || !Number.isInteger(Number(logId)) || Number(logId) <= 0) {
      return res.status(400).json({ message: 'A valid numeric "logId" is required.' });
    }
    if (feedback !== 'up' && feedback !== 'down') {
      return res.status(400).json({ message: '"feedback" must be "up" or "down".' });
    }

    await saveFeedback(Number(logId), feedback);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Feedback error:', err);
    return res.status(500).json({ message: 'Failed to save feedback.' });
  }
};
exports.chat = async (req, res) => {
  try {
    const message = req.body && req.body.message;
    const rawHistory = (req.body && req.body.history) || [];

    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'A non-empty "message" is required.' });
    }
    if (message.length > 8000) {
      return res.status(400).json({ message: 'Message is too long.' });
    }

    // Validate history at the controller boundary before passing deeper.
    if (!Array.isArray(rawHistory)) {
      return res.status(400).json({ message: '"history" must be an array.' });
    }
    if (rawHistory.length > 40) {
      return res.status(400).json({ message: '"history" is too long.' });
    }
    const history = rawHistory.filter(
      (m) => m && typeof m.role === 'string' && typeof m.content === 'string'
    );

    const { reply, toolCalls, logId } = await runChat(history, message);
    return res.status(200).json({ reply, toolCalls, logId: logId ?? null });
  } catch (err) {
    console.error('Chat error:', err);
    // Log the failure so error patterns are visible in analytics.
    try {
      const message = req.body && req.body.message;
      if (typeof message === 'string' && message.trim().length > 0) {
        cacheLog(message, 'chat', null, [], { source: undefined }).catch(() => {});
      }
    } catch (_) {}
    const status = err.status === 429 ? 429 : 502;
    const msg =
      err.status === 429
        ? 'The AI service is rate-limited or over budget. Please try again later.'
        : 'The GEAR Assistant is temporarily unavailable.';
    return res.status(status).json({ message: msg });
  }
};
