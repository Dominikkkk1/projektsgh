import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authKey = req.headers['x-admin-key'] || req.query.key;
  if (authKey !== (process.env.ADMIN_KEY || 'sgh2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await redis.del('survey_responses');
    return res.status(200).json({ success: true, message: 'All responses deleted' });
  } catch (error) {
    console.error('Error resetting:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
