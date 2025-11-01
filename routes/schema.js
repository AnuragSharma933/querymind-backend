import express from 'express';
import { getSchema } from '../controllers/dbController.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

router.post('/analyze', async (req, res, next) => {
  try {
    const { connectionId } = req.body;

    if (!connectionId) {
      throw new AppError('Connection ID is required', 400);
    }

    const schema = await getSchema(connectionId);

    res.json({
      success: true,
      data: { schema }
    });
  } catch (error) {
    next(error);
  }
});

export default router;