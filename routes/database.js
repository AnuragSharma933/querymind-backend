import express from 'express';
import { createConnection, executeQuery, closeConnection } from '../controllers/dbController.js';
import { validateConnectionConfig, sanitizeSQL } from '../utils/validation.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

router.post('/connect', async (req, res, next) => {
  try {
    const { error, value } = validateConnectionConfig(req.body);
    
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const connectionId = await createConnection(value);

    res.json({
      success: true,
      data: { connectionId }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/execute', async (req, res, next) => {
  try {
    const { connectionId, query } = req.body;

    if (!connectionId || !query) {
      throw new AppError('Missing required fields', 400);
    }

    // Sanitize query
    sanitizeSQL(query);

    const results = await executeQuery(connectionId, query);

    res.json({
      success: true,
      data: { results, rowCount: results.length }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/disconnect', async (req, res, next) => {
  try {
    const { connectionId } = req.body;

    if (!connectionId) {
      throw new AppError('Connection ID is required', 400);
    }

    closeConnection(connectionId);

    res.json({
      success: true,
      message: 'Disconnected successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;