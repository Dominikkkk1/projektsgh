import { randomUUID } from 'crypto';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const RESPONSES_KEY = 'survey_responses';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body;
    if (!data || !data.condition || !data.responses) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const record = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      condition: data.condition,
      studentCode: data.studentCode || '',
      responses: data.responses,
      demographics: data.demographics || {},
      manipulationCheck: data.manipulationCheck || {},
      metadata: {
        userAgent: req.headers['user-agent'] || '',
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        durationSeconds: data.durationSeconds || 0
      }
    };

    await redis.rpush(RESPONSES_KEY, JSON.stringify(record));

    return res.status(200).json({ success: true, id: record.id });
  } catch (error) {
    console.error('Error saving response:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
