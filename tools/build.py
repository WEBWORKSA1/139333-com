#!/usr/bin/env python3
"""139333.com static site builder.
Each file in src/pages/*.html starts with a JSON meta comment:
<!--meta {"title": "...", "description": "...", "nav": "analyzer", "crumb": "Analyzer", "scripts": ["tools"], "faq": [["Q","A"], ...]} -->
Run:  python3 tools/build.py   -> writes the finished pages to the repo root (GitHub Pages serves them as-is).
"""
import json, re, pathlib, datetime, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "pages"
SITE_URL = "https://139333.com"
INTEREST = "https://web.works/contact"
VER = datetime.date.today().strftime("%Y%m%d")

NAV = [
    ("analyzer", "analyzer.html", "Analyzer"),
    ("valuation", "valuation.html", "Valuation"),
    ("tools", "tools.html", "Tools"),
    ("meanings", "meanings.html", "Meanings"),
    ("insights", "insights.html", "Insights"),
    ("videos", "videos.html", "Videos"),
    ("contests", "contests.html", "Contests"),
    ("support", "support.html", "Support"),
]

CUR = ' aria-current="page"'

def header(active):
    items = "".join(
        f'<li><a href="{href}"{CUR if key == active else ""}>{label}</a></li>'
        for key, href, label in NAV)
    return f'''<a class="skip" href="#main">Skip to content</a>
<div class="topbar" role="note">Contact, if you are interested in this <a href="{INTEREST}" target="_blank" rel="noopener">website / domain name / Sponsorship / Advertisement / Partnership</a></div>
<header class="site-header"><div class="wrap nav">
  <a class="brand" href="index.html" aria-label="139333.com home"><span class="brand-mark" aria-hidden="true">生</span><span>139333<small>Lucky Number Lab</small></span></a>
  <ul class="menu" id="menu">{items}<li><a href="services.html"{CUR if active == "services" else ""}>Concierge</a></li></ul>
  <div class="nav-actions">
    <a class="btn btn-primary btn-sm" href="services.html">Get a lucky number</a>
    <button class="icon-btn" data-theme-toggle aria-label="Toggle dark mode">◐</button>
    <button class="icon-btn burger" aria-controls="menu" aria-expanded="false" aria-label="Open menu">☰</button>
  </div>
</div></header>'''

FOOTER = f'''<footer class="site-footer"><div class="wrap">
 <div class="footer-grid">
  <div>
   <a class="brand" href="index.html" style="color:#fff"><span class="brand-mark">生</span><span>139333<small style="color:#9fb3a7">Lucky Number Lab</small></span></a>
   <p style="margin-top:14px;font-size:.93rem">要生久 · 生生生 — free tools and honest data on Chinese lucky numbers, mobile number patterns and the lucky-number economy.</p>
   <form class="footer-news" data-form="Newsletter — Lucky Number of the Day" data-success="Subscribed! Watch your inbox for tomorrow's lucky number.">
     <input type="email" name="email" required placeholder="Your email" aria-label="Email for newsletter">
     <button class="btn btn-gold btn-sm" type="submit">Subscribe</button>
   </form>
   <p class="small" style="margin-top:6px;color:#8fa198">Daily lucky number + monthly market notes. Unsubscribe anytime.</p>
  </div>
  <div><h4>Free tools</h4><ul>
   <li><a href="analyzer.html">Phone Number Analyzer</a></li><li><a href="valuation.html">Number Value Estimator</a></li>
   <li><a href="generator.html">Lucky Number Generator</a></li><li><a href="zodiac.html">Zodiac &amp; Compatibility</a></li>
   <li><a href="dates.html">Lucky Date Checker</a></li><li><a href="tools.html#plate">Licence Plate Checker</a></li></ul></div>
  <div><h4>Learn</h4><ul>
   <li><a href="meanings.html">Number Meanings A–Z</a></li><li><a href="meaning-of-139333.html">What 139333 Means</a></li>
   <li><a href="insights.html">Lucky-Number Economy</a></li><li><a href="connectivity.html">China SIM &amp; eSIM Guide</a></li>
   <li><a href="videos.html">Video Library</a></li><li><a href="about.html">About &amp; Method</a></li></ul></div>
  <div><h4>Work with us</h4><ul>
   <li><a href="services.html">Lucky Number Concierge</a></li><li><a href="support.html#advertise">Advertise &amp; Sponsor</a></li>
   <li><a href="support.html">Donate / Support</a></li><li><a href="contests.html">Contests &amp; Prizes</a></li>
   <li><a href="careers.html">Careers &amp; Talent</a></li><li><a href="contact.html">Contact</a></li>
   <li><a href="{INTEREST}" target="_blank" rel="noopener">Buy / partner on this domain</a></li></ul></div>
 </div>
 <div class="footer-legal">
  <p><b>Trademark &amp; copyright disclosure:</b> 139333.com is an independent educational and entertainment website. The number “139333” is used descriptively as a numeral; no trademark rights in any number are claimed. This site is not affiliated with, endorsed by or sponsored by China Mobile, its “139” mail or cloud services, or any telecom operator, registry, lottery or government body. All third-party names, logos and videos belong to their respective owners and are referenced for identification, commentary and education. Original text, tools and design © <span data-year></span> 139333.com — all rights reserved. <a href="legal.html">Terms · Privacy · Disclaimer · Cookies</a></p>
  <p>Readings are cultural folklore for entertainment, not financial, legal, medical or investment advice. Contests are free to enter; no purchase necessary.</p>
 </div>
</div></footer>
<div class="mobile-cta"><a class="btn btn-ghost" href="analyzer.html">Check a number</a><a class="btn btn-primary" href="services.html">Get a lucky number</a></div>
<button class="icon-btn to-top" aria-label="Back to top">↑</button>
<div class="cookie" role="dialog" aria-label="Cookie consent"><b>Cookies &amp; ads</b><p class="small" style="margin:.4em 0 0">We use cookies for analytics and to show ads (Google AdSense) that keep our tools free. See our <a href="legal.html#cookies">cookie policy</a>.</p><div class="btns"><button class="btn btn-primary btn-sm" data-consent="yes">Accept</button><button class="btn btn-ghost btn-sm" data-consent="no">Decline</button></div></div>
<div class="modal" id="leadModal" role="dialog" aria-modal="true" aria-labelledby="lmT"><div class="card"><button class="x" data-close aria-label="Close">×</button>
 <span class="eyebrow">Free download</span><h3 id="lmT">Your {datetime.date.today().year + 1} Lucky Numbers Guide</h3>
 <p class="small">The 88 luckiest phone endings, dates to avoid, and lucky numbers for all 12 zodiac signs — emailed to you free.</p>
 <form data-form="Lead magnet — Lucky Numbers Guide" data-success="Sent! Check your inbox in a few minutes.">
  <div class="field"><input type="text" name="name" placeholder="First name" aria-label="First name"></div>
  <div class="field"><input type="email" name="email" required placeholder="you@email.com" aria-label="Email"></div>
  <button class="btn btn-gold btn-block" type="submit">Send me the guide</button>
 </form><p class="small muted" style="margin-top:8px">No spam. One-click unsubscribe.</p></div></div>'''

def ad(slot="inContent"):
    return f'<div class="ad-slot" data-slot="{slot}" aria-label="Advertisement">Advertisement</div>'

def page(meta, body, name):
    title = meta["title"]
    desc = meta["description"]
    url = f"{SITE_URL}/" + ("" if name == "index" else f"{name}.html")
    ld = [{
        "@context": "https://schema.org", "@type": "WebSite", "name": "139333.com", "url": SITE_URL + "/",
        "potentialAction": {"@type": "SearchAction", "target": SITE_URL + "/analyzer.html?n={number}", "query-input": "required name=number"}
    }] if name == "index" else [{
        "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/"},
            {"@type": "ListItem", "position": 2, "name": meta.get("crumb", title), "item": url}]
    }]
    if meta.get("faq"):
        ld.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in meta["faq"]]})
    faq_html = ""
    if meta.get("faq"):
        faq_html = '<section class="section-alt"><div class="wrap prose"><h2>Frequently asked questions</h2>' + "".join(
            f"<details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>" for q, a in meta["faq"]) + "</div></section>"
    scripts = "".join(f'<script src="assets/js/{s}.js?v={VER}" defer></script>' for s in ["engine", "tools"] if s in meta.get("scripts", []))
    crumb = "" if name == "index" or meta.get("nocrumb") else f'<nav class="breadcrumb wrap" aria-label="Breadcrumb" style="padding-top:16px;margin:0 auto"><a href="index.html">Home</a> › {html.escape(meta.get("crumb", title))}</nav>'
    body = body.replace("{{AD}}", ad()).replace("{{AD_TOP}}", ad("header")).replace("{{AD_FOOT}}", ad("footer"))
    robots = '<meta name="robots" content="noindex">' if name == "404" else ""
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">{robots}
<meta name="theme-color" content="#139333">
<meta property="og:type" content="website"><meta property="og:site_name" content="139333.com">
<meta property="og:title" content="{html.escape(title)}"><meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{SITE_URL}/assets/img/og.svg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Serif+SC:wght@700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css?v={VER}">
<script>try{{var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t)}}catch(e){{}}</script>
<script type="application/ld+json">{json.dumps(ld if len(ld) > 1 else ld[0], ensure_ascii=False)}</script>
</head>
<body>
{header(meta.get("nav", ""))}
{crumb}
<main id="main">
{body}
{faq_html}
</main>
{FOOTER}
<script src="assets/js/config.js?v={VER}"></script>
<script src="assets/js/main.js?v={VER}" defer></script>
{scripts}
</body>
</html>
'''

def build():
    names = []
    for f in sorted(SRC.glob("*.html")):
        raw = f.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--meta\s+(.*?)\s*-->", raw, re.S)
        meta = json.loads(m.group(1))
        body = raw[m.end():]
        (ROOT / f.name).write_text(page(meta, body, f.stem), encoding="utf-8")
        names.append(f.stem)
    today = datetime.date.today().isoformat()
    urls = "".join(
        f"<url><loc>{SITE_URL}/{'' if n == 'index' else n + '.html'}</loc><lastmod>{today}</lastmod><priority>{'1.0' if n == 'index' else '0.8'}</priority></url>"
        for n in names if n != "404")
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')
    print("built", len(names), "pages")

if __name__ == "__main__":
    build()
