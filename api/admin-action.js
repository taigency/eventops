// POST { action, userId, reason, plan, fee, notes }
// Admin-only endpoint: block, unblock, delete, set_plan, set_notes

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL  = 'tiaanj@gmail.com';

const hdr = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function rest(path, method = 'GET', body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...hdr, Prefer: 'return=minimal' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) { const t = await res.text(); throw new Error(t); }
  return res.status === 204 ? {} : res.json();
}

async function authAdmin(path, method = 'GET', body = null) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`, {
    method,
    headers: hdr,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) { const t = await res.text(); throw new Error(t); }
  return res.status === 204 ? {} : res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Verify caller is admin
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
  });
  const caller = await userRes.json();
  if (caller?.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Admin only' });

  const { action, userId, reason, plan, fee, notes } = req.body || {};
  if (!userId && action !== 'ping') return res.status(400).json({ error: 'userId required' });

  try {
    if (action === 'block') {
      await rest(`company_accounts?user_id=eq.${userId}`, 'PATCH', {
        status: 'blocked',
        blocked_reason: reason || 'Blocked by admin',
        blocked_at: new Date().toISOString(),
      });
      // Ban in Supabase Auth (100-year ban = effectively permanent)
      await authAdmin(`users/${userId}`, 'PUT', { ban_duration: '876600h' });
      return res.json({ ok: true });
    }

    if (action === 'unblock') {
      await rest(`company_accounts?user_id=eq.${userId}`, 'PATCH', {
        status: 'active',
        blocked_reason: null,
        blocked_at: null,
      });
      await authAdmin(`users/${userId}`, 'PUT', { ban_duration: 'none' });
      return res.json({ ok: true });
    }

    if (action === 'delete') {
      await authAdmin(`users/${userId}`, 'DELETE');
      // company_accounts row cascades via FK
      return res.json({ ok: true });
    }

    if (action === 'set_plan') {
      await rest(`company_accounts?user_id=eq.${userId}`, 'PATCH', {
        plan: plan || 'beta',
        monthly_fee: fee ?? 0,
      });
      return res.json({ ok: true });
    }

    if (action === 'set_notes') {
      await rest(`company_accounts?user_id=eq.${userId}`, 'PATCH', { notes });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
