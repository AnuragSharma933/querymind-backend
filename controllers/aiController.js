import { convertNLToSQL, optimizeQuery, suggestImprovements } from '../utils/openRouter.js';
import { AppError } from '../middleware/errorHandler.js';

export const convertQuery = async (req, res, next) => {
  try {
    const { naturalLanguage, schema, dbType, language } = req.body;

    if (!naturalLanguage || !schema || !dbType) {
      throw new AppError('Missing required fields', 400);
    }

    const sqlQuery = await convertNLToSQL(naturalLanguage, schema, dbType, language);

    res.json({
      success: true,
      data: {
        sqlQuery,
        naturalLanguage,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

export const optimize = async (req, res, next) => {
  try {
    const { sqlQuery, dbType } = req.body;

    if (!sqlQuery || !dbType) {
      throw new AppError('Missing required fields', 400);
    }

    const optimization = await optimizeQuery(sqlQuery, dbType);

    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    next(error);
  }
};

export const getSuggestions = async (req, res, next) => {
  try {
    const { sqlQuery, schema, dbType } = req.body;

    if (!sqlQuery || !schema || !dbType) {
      throw new AppError('Missing required fields', 400);
    }

    const suggestions = await suggestImprovements(sqlQuery, schema, dbType);

    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    next(error);
  }
};