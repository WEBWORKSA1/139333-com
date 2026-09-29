# 139333.com — Lucky Number Lab

A static site of free Chinese lucky-number tools: a phone number analyzer, value estimator, generator, zodiac finder, date checker, plate checker and a meanings dictionary. Revenue comes from a lead-generation concierge, AdSense, YouTube, donations, sponsorship and contests. It is designed for the **GitHub Pages free plan**.

- **Concept & research:** [`docs/RESEARCH.md`](docs/RESEARCH.md)
- **Phase-wise build prompt:** [`docs/BUILD-PROMPT.md`](docs/BUILD-PROMPT.md)

## Structure
```
src/pages/*.html     page bodies (edit these)
tools/build.py       wraps pages with header/footer/SEO → writes root *.html + sitemap.xml
assets/css/style.css design system (brand colour = #139333)
assets/js/config.js  ← AdSense, GA4, donation links, encoded inbox (edit to go live)
assets/js/engine.js  lucky-number scoring engine
assets/js/tools.js   tool UIs
assets/js/main.js    forms, consent, ads loader, donations, modals
```

## Build
```bash
python3 tools/build.py
```

## Go-live checklist
1. **Forms.** Submit any form once. FormSubmit emails an activation link to the site inbox; click it. After that, all forms deliver to that inbox.
2. **AdSense.** Set `adsenseClient` and `adSlots` in `assets/js/config.js`, then replace the contents of `ads.txt` with your publisher line.
3. **Analytics.** Set `ga4` in `config.js`.
4. **Donations.** PayPal works out of the box. Stripe, Buy Me a Coffee and Ko-fi links are optional and set in `config.js`.
5. **Custom domain.**
   - Add a `CNAME` file containing `139333.com`.
   - At the registrar, point A records at `185.199.108.153`, `.109.153`, `.110.153` and `.111.153`, and point the `www` CNAME at `webworksa1.github.io`.
   - Enable **Enforce HTTPS** in Settings → Pages.

## Legal
This is an independent site, not affiliated with China Mobile or its 139 services. No trademark is claimed in any number. See `legal.html`.
