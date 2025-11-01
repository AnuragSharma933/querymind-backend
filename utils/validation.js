import Joi from 'joi';

export const validateConnectionConfig = (config) => {
  const schema = Joi.object({
    type: Joi.string().valid('mysql', 'postgresql', 'sqlite').required(),
    host: Joi.when('type', {
      is: Joi.string().valid('mysql', 'postgresql'),
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    }),
    port: Joi.when('type', {
      is: 'mysql',
      then: Joi.number().default(3306),
      otherwise: Joi.when('type', {
        is: 'postgresql',
        then: Joi.number().default(5432),
        otherwise: Joi.number().optional()
      })
    }),
    user: Joi.when('type', {
      is: Joi.string().valid('mysql', 'postgresql'),
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    }),
    password: Joi.when('type', {
      is: Joi.string().valid('mysql', 'postgresql'),
      then: Joi.string().allow('').optional(),
      otherwise: Joi.string().optional()
    }),
    database: Joi.string().required(),
    filename: Joi.when('type', {
      is: 'sqlite',
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    })
  });

  return schema.validate(config);
};

export const sanitizeSQL = (query) => {
  // Basic SQL injection prevention
  const dangerous = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE'];
  const upperQuery = query.toUpperCase();
  
  for (const keyword of dangerous) {
    if (upperQuery.includes(keyword)) {
      throw new Error(`Potentially dangerous SQL operation detected: ${keyword}`);
    }
  }
  
  return query;
};