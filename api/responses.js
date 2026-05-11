import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authKey = req.headers['x-admin-key'] || req.query.key;
  if (authKey !== (process.env.ADMIN_KEY || '123##')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const raw = await redis.lrange('survey_responses', 0, -1);
    const responses = raw.map(r => typeof r === 'string' ? JSON.parse(r) : r);

    const conditions = { treat: 0, control: 0 };
    responses.forEach(r => {
      if (r.condition === 'treat') conditions.treat++;
      else conditions.control++;
    });

    return res.status(200).json({
      total: responses.length,
      conditions,
      responses
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
