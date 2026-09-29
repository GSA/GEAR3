const path = require('path');
const rateLimit = require('express-rate-limit');

const {
  runChat,
  runSearchOverview,
} = require(path.join('..', '..', 'mcp', 'chat-orchestrator'));

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
 * POST /api/chat
 * Body: { message: string, history?: [{role, content}] }
 */
exports.chat = async (req, res) => {
  try {
    const message = req.body && req.body.message;
    const history = (req.body && req.body.history) || [];

    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'A non-empty "message" is required.' });
    }
    if (message.length > 8000) {
      return res.status(400).json({ message: 'Message is too long.' });
    }

    const { reply, toolCalls } = await runChat(history, message);
    return res.status(200).json({ reply, toolCalls });
  } catch (err) {
    console.error('Chat error:', err);
    const status = err.status === 429 ? 429 : 502;
    const msg =
      err.status === 429
        ? 'The AI service is rate-limited or over budget. Please try again later.'
        : 'The GEAR Assistant is temporarily unavailable.';
    return res.status(status).json({ message: msg });
  }
};

/**
 * POST /api/chat/overview
 * Body: { searchKW: string, results: any[] }
 * Returns a short AI overview of the search term given the GEAR results.
 */
exports.overview = async (req, res) => {
  try {
    const searchKW = req.body && req.body.searchKW;
    const results = (req.body && req.body.results) || [];

    if (typeof searchKW !== 'string' || searchKW.trim().length === 0) {
      return res.status(400).json({ message: 'A non-empty "searchKW" is required.' });
    }
    if (!Array.isArray(results)) {
      return res.status(400).json({ message: '"results" must be an array.' });
    }

    const { reply } = await runSearchOverview(searchKW, results);
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Overview error:', err);
    const status = err.status === 429 ? 429 : 502;
    const msg =
      err.status === 429
        ? 'The AI service is rate-limited or over budget. Please try again later.'
        : 'The GEAR Assistant is temporarily unavailable.';
    return res.status(status).json({ message: msg });
  }
};
