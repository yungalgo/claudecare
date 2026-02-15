# ClaudeCare — TODO

## Blocking (before launch)

- [ ] **Verify `claudecare.com` in Resend** — Run: `curl -X POST "https://api.resend.com/domains" -H "Authorization: Bearer $RESEND_API_KEY" -H "Content-Type: application/json" -d '{"name":"claudecare.com"}'` — then add the returned DNS records to Cloudflare
- [ ] **Add `RESEND_API_KEY` to Railway** — Add to Variables tab in Railway dashboard
- [ ] **Update Twilio webhooks to production URL** — In Twilio Console → Phone Numbers → your number, set Voice URL to `https://claudecare.com/api/twilio/voice` and Status Callback to `https://claudecare.com/api/twilio/status`

## Design

- [ ] **Create logo** — Proper brand logo (currently using a simple clock SVG). Need wordmark + icon versions for nav, favicon, OG image, social profiles
- [ ] **Replace OG image** — Current `og.png` is auto-generated from SVG. Replace with a proper designed OG card once logo exists

## Social / Marketing

- [ ] **Create Twitter/X account** — @claudecare
- [ ] **Create LinkedIn page** — ClaudeCare
- [ ] **Create GitHub org** — github.com/claudecare (public presence)
- [ ] **Create Product Hunt page** — for launch

## Future Enhancements

- [ ] **Multi-tenancy** — Add `userId` to persons table so orgs only see their own data
- [ ] **Quarterly instrument collection** — Schema + scoring exist, but call protocol doesn't collect them yet
- [ ] **SMS notifications** — Send Twilio SMS to emergency contacts for immediate escalations
- [ ] **Transcript processing** — Recording URLs are stored but not transcribed
- [ ] **Test suite** — No automated tests exist yet
