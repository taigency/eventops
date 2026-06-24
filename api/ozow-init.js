// Ozow instant EFT payment init (South African banks)
// Docs: https://docs.ozow.com
// POST { plan, userId, email, amount, cancelUrl, successUrl, notifyUrl }
const crypto = require('crypto');

const OZOW_SITE_CODE    = process.env.OZOW_SITE_CODE;
const OZOW_PRIVATE_KEY  = process.env.OZOW_PRIVATE_KEY;
const OZOW_API_KEY      = process.env.OZOW_API_KEY;
const OZOW_SANDBOX      = process.env.NODE_ENV !== 'production';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { plan, userId, email, amount, successUrl, cancelUrl, notifyUrl } = req.body;
    const reference = `EO-${userId.slice(0,8)}-${Date.now()}`;
    const countryCode = 'ZA';
    const currencyCode = 'ZAR';
    const isTest = OZOW_SANDBOX ? 'true' : 'false';

    // Ozow hash: concatenate fields lowercase then SHA512
    const hashInput = [
      OZOW_SITE_CODE, countryCode, currencyCode,
      amount, reference, '', '', // optional fields
      successUrl, errorUrl = cancelUrl, cancelUrl, notifyUrl,
      isTest, OZOW_PRIVATE_KEY
    ].join('').toLowerCase();
    const hashCheck = crypto.createHash('sha512').update(hashInput).digest('hex');

    const payload = {
      SiteCode: OZOW_SITE_CODE,
      CountryCode: countryCode,
      CurrencyCode: currencyCode,
      Amount: amount,
      TransactionReference: reference,
      BankReference: `EventOps ${plan}`,
      Customer: email,
      IsTest: OZOW_SANDBOX,
      SuccessUrl: successUrl,
      ErrorUrl: cancelUrl,
      CancelUrl: cancelUrl,
      NotifyUrl: notifyUrl,
      HashCheck: hashCheck,
    };

    const endpoint = OZOW_SANDBOX
      ? 'https://stagingapi.ozow.com/postpaymentrequest'
      : 'https://api.ozow.com/postpaymentrequest';

    const ozowRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ApiKey: OZOW_API_KEY },
      body: JSON.stringify(payload),
    });
    const data = await ozowRes.json();
    if (data.url) return res.json({ url: data.url, reference });
    res.status(400).json({ error: data.message || 'Ozow init failed', raw: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
