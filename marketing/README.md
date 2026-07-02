# EventOps — Marketing & Brand Kit

Everything to launch EventOps to the public.

## Domains — check & buy

`eventops` is taken across most TLDs. Recommended plan:

| Domain | Status | Action |
|---|---|---|
| **eventops.africa** | ✅ available | **Register this** — on-brand, ~R200-400/yr |
| eventops.co.za | ❌ registered (parked "Launching Soon", listed for sale) | Optional: enquire on price, but don't overpay |
| geteventops.co.za | ✅ available | Good local backup |
| myeventops.co.za | ✅ available | Backup |
| eventops.org.za / .net.za / .za | ✅ available | Optional to protect the brand |

**Where to buy (South Africa):** domains.co.za, afrihost.com, or hetzner.co.za for `.co.za`;
for `.africa` use these or an international registrar (Namecheap, Cloudflare). After buying,
point it at Vercel (add the domain in your Vercel project → Domains → follow the DNS records).

> I can't complete a domain purchase for you (that's a payment/checkout you need to do), but
> once it's bought I can wire the DNS to Vercel and update the app's URLs.

## /brand — logo & visual identity

| File | Use |
|---|---|
| `logo-mark.svg` | The app icon / square mark |
| `favicon.svg` | Browser tab icon |
| `logo-horizontal-dark.svg` | Full logo for dark backgrounds |
| `logo-horizontal-light.svg` | Full logo for light backgrounds/print |
| `social-avatar.svg` | 1080×1080 profile picture for all socials |
| `og-cover.svg` | 1200×630 cover / link-preview image |

**Brand colours:** Indigo `#5462F0` → Purple `#8B5CF6` → Cyan `#0BB5CC` (gradient).
Dark surface `#06080F`. Font: Plus Jakarta Sans.
Export SVG → PNG via Chrome or cloudconvert.com when a network needs a raster file.

## /marketing — content

| File | What it is |
|---|---|
| `social-kit.md` | Handles, bios, image specs, step-by-step page setup, hashtags |
| `launch-content.md` | Launch posts, paid-ad copy, 2-week calendar, video script |
| `promo.html` | Animated showcase — **screen-record this for your promo video** |

## Making the promo video
1. Open `marketing/promo.html` in Chrome, click **⛶ Fullscreen**.
2. Record with `Win + Alt + R` (Xbox Game Bar) or OBS Studio.
3. It auto-plays a ~30s loop; stop after one cycle.
4. Add voiceover/music in CapCut (script is in `launch-content.md`), export MP4.
5. Post as IG Reel + FB video + LinkedIn native video.

## What you need to do vs. what I can do
- **You:** create the FB/IG/LinkedIn accounts, buy the domain, run the screen recording.
- **I can:** wire the domain to Vercel once bought, tweak any copy or the logo, adjust the
  promo, add a favicon/OG tags to the live app, build a public landing page.
