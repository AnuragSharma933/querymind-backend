import express from 'express';
import { convertQuery, optimize, getSuggestions, executeUserQuery } from '../controllers/aiController.js';
import { queryRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/convert', queryRateLimiter, convertQuery);
router.post('/execute', queryRateLimiter, executeUserQuery);
router.post('/optimize', queryRateLimiter, optimize);
router.post('/suggestions', queryRateLimiter, getSuggestions);

export default router;