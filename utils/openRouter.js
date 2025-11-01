import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const convertNLToSQL = async (naturalLanguage, schema, dbType, language = 'en') => {
  try {
    const systemPrompt = `You are an expert SQL query generator. Convert natural language queries to SQL.
Database Type: ${dbType}
Schema: ${JSON.stringify(schema)}
User Language: ${language}

Rules:
1. Generate ONLY valid SQL queries for ${dbType}
2. Use proper table and column names from the schema
3. Include appropriate WHERE, JOIN, ORDER BY clauses as needed
4. Optimize for performance
5. Return ONLY the SQL query, no explanations
6. Support multi-language input (English, Hindi, Hinglish, Spanish, French, Chinese)`;

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: 'openai/gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: naturalLanguage }
        ],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://querymind-ai.com',
          'X-Title': 'QueryMind AI'
        }
      }
    );

    const sqlQuery = response.data.choices[0].message.content.trim();
    return sqlQuery.replace(/```sql|```/g, '').trim();
  } catch (error) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    throw new Error('Failed to convert query: ' + (error.response?.data?.error?.message || error.message));
  }
};

export const optimizeQuery = async (sqlQuery, dbType) => {
  try {
    const systemPrompt = `You are a SQL optimization expert for ${dbType}.
Analyze the given SQL query and provide:
1. Optimized version of the query
2. Brief explanation of optimizations made
3. Performance tips

Format your response as JSON:
{
  "optimizedQuery": "...",
  "improvements": ["improvement 1", "improvement 2"],
  "estimatedPerformanceGain": "..."
}`;

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: 'openai/gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sqlQuery }
        ],
        temperature: 0.2,
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    throw new Error('Failed to optimize query: ' + error.message);
  }
};

export const suggestImprovements = async (sqlQuery, schema, dbType) => {
  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Suggest improvements for this SQL query based on the schema and best practices for ${dbType}. Return 3-5 actionable suggestions as a JSON array of strings.`
          },
          {
            role: 'user',
            content: `Query: ${sqlQuery}\nSchema: ${JSON.stringify(schema)}`
          }
        ],
        temperature: 0.4,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    throw new Error('Failed to get suggestions: ' + error.message);
  }
};