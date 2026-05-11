import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authKey = req.headers['x-admin-key'] || req.query.key;
  if (authKey !== (process.env.ADMIN_KEY || 'sgh2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const raw = await redis.lrange('survey_responses', 0, -1);
    const responses = raw.map(r => typeof r === 'string' ? JSON.parse(r) : r);

    if (responses.length === 0) {
      return res.status(200).send('No responses yet');
    }

    const headers = [
      'id', 'timestamp', 'condition', 'studentCode', 'durationSeconds',
      'has_mobywatel', 'has_profil_zaufany', 'usage_frequency', 'admin_interaction', 'tech_skills',
      'dv_1', 'dv_2', 'dv_3', 'dv_4', 'dv_5',
      'mod_1', 'mod_2', 'mod_3', 'mod_4',
      'mc_1', 'mc_2', 'mc_3',
      'age', 'gender', 'occupation', 'city_size'
    ];

    const rows = responses.map(r => {
      const resp = r.responses || {};
      const demo = r.demographics || {};
      const mc = r.manipulationCheck || {};
      return [
        r.id, r.timestamp, r.condition, r.studentCode,
        r.metadata?.durationSeconds || '',
        resp.has_mobywatel || '', resp.has_profil_zaufany || '',
        resp.usage_frequency || '', resp.admin_interaction || '', resp.tech_skills || '',
        resp.dv_1 || '', resp.dv_2 || '', resp.dv_3 || '', resp.dv_4 || '', resp.dv_5 || '',
        resp.mod_1 || '', resp.mod_2 || '', resp.mod_3 || '', resp.mod_4 || '',
        mc.mc_1 || '', mc.mc_2 || '', mc.mc_3 || '',
        demo.age || '', demo.gender || '', demo.occupation || '', demo.city_size || ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=mobywatel_responses.csv');
    return res.status(200).send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error exporting:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
