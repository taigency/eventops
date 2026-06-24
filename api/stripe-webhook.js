// Stripe webhook — updates subscriptions table in Supabase
// Set STRIPE_WEBHOOK_SECRET in Vercel env vars (from Stripe Dashboard → Webhooks)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role to bypass RLS
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const planFromPriceId = (priceId) => {
    if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter';
    if (priceId === process.env.STRIPE_PRICE_PRO)     return 'pro';
    return 'starter';
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (!userId) break;
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        const plan = planFromPriceId(sub.items.data[0]?.price?.id);
        await sb.from('subscriptions').upsert({
          user_id: userId,
          plan,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: 'active',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });
        break;
      }
      case 'invoice.payment_succeeded': {
        const inv = event.data.object;
        const sub = await stripe.subscriptions.retrieve(inv.subscription);
        const userId = sub.metadata?.userId;
        if (!userId) break;
        const plan = planFromPriceId(sub.items.data[0]?.price?.id);
        await sb.from('subscriptions').upsert({
          user_id: userId, plan, status: 'active',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });
        break;
      }
      case 'invoice.payment_failed':
      case 'customer.subscription.deleted': {
        const obj = event.data.object;
        const userId = obj.metadata?.userId;
        if (!userId) break;
        await sb.from('subscriptions').update({ status: 'inactive', plan: 'free', updated_at: new Date().toISOString() }).eq('user_id', userId);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        const plan = planFromPriceId(sub.items.data[0]?.price?.id);
        await sb.from('subscriptions').update({
          plan, status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId);
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
