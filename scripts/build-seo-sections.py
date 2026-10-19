#!/usr/bin/env python3
"""Inject city-specific delivery content + related-page links into the static landing pages.

Why: Google Search Console listed the landing pages as "Discovered - currently not indexed" with no
referring pages, and the Lagos/Abuja occasion pages were ~90% identical. Each page now gets
  1. a delivery-fee table for its city, generated from src/delivery-zones.js (unique per city), and
  2. plain-HTML links to the sibling landing pages (same occasion in other cities, other occasions in
     the same city, the city delivery hub), so every page has crawlable referring pages.

Idempotent: content lives between <!-- bf-seo:start --> and <!-- bf-seo:end --> and is replaced on re-run.
Run after changing delivery zones or adding a landing page:  python3 scripts/build-seo-sections.py
"""
import html, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, 'public')
ZONES_JS = os.path.join(ROOT, 'src', 'delivery-zones.js')

CITIES = {'lagos': 'Lagos', 'abuja': 'Abuja', 'port-harcourt': 'Port Harcourt'}
ZONE_VARS = {'lagos': 'LAGOS_ZONES', 'abuja': 'ABUJA_ZONES', 'port-harcourt': 'PORT_HARCOURT_ZONES'}
OCCASIONS = {  # slug prefix -> (label, plural noun used in links)
    'flower-delivery': ('Flower delivery', 'Flower delivery'),
    'birthday-flowers': ('Birthday flowers', 'Birthday flowers'),
    'anniversary-flowers': ('Anniversary flowers', 'Anniversary flowers'),
    'graduation-flowers': ('Graduation flowers', 'Graduation flowers'),
}

# delivery-zones.js keeps spelling variants for matching customer input; show one name per place
ALIASES = {
    'vi', 'lekki 1', 'lekki 2', 'victoria garden city', 'anthony', 'ojodu berger', 'gra ikeja',
    'wuse ii', 'wuse2', 'gwarimpa', 'banana island abuja', 'a y a', 'a.y.a', 'maraba',
    'apo mechanical village', 'apo primary school', 'idu industrial',
    'port harcourt', 'ph', 'town', 'ph town', 'old g.r.a', 'new g.r.a', 'gra', 'd line', 'peter odili',
}
DISPLAY = {
    'vgc': 'VGC (Victoria Garden City)', 'old gra': 'Old GRA', 'new gra': 'New GRA', 'd-line': 'D-Line',
    'port harcourt town': 'Port Harcourt Town (Old Township)', 'uniport': 'Uniport', 'wuse 2': 'Wuse 2',
    'central business district': 'Central Business District', 'abraham adesanya': 'Abraham Adesanya',
    'ojodu': 'Ojodu / Berger', 'kings court': "King's Court", 'mile 12': 'Mile 12',
    'aya': 'AYA', 'naf valley': 'NAF Valley',
}

INTROS = {
    'lagos': ("We deliver across Lagos Island and the Mainland. Delivery starts at {min_fee} for {cheapest} "
              "and is {max_fee} for the farthest areas, such as {farthest}. Tell us the recipient's area when "
              "you order and we confirm the exact fee before you pay."),
    'abuja': ("We deliver across the FCT, from the city districts to the satellite towns. Delivery starts at "
              "{min_fee} for {cheapest} and is {max_fee} for the farthest areas, such as {farthest}. Tell us "
              "the district when you order and we confirm the exact fee before you pay."),
    'port-harcourt': ("We deliver across Port Harcourt and nearby Rivers State communities. Most of the city, "
                      "including {cheapest}, is {min_fee}; farther areas such as {farthest} are {max_fee}. "
                      "Tell us the recipient's area when you order and we confirm the exact fee before you pay."),
}
OCCASION_LINE = {
    'flower-delivery': "Sending flowers to someone else? Add the recipient's phone number so the rider can reach them on arrival.",
    'birthday-flowers': "For a birthday surprise, include the recipient's name, phone number and your card message, and mention in the order notes that it's a surprise.",
    'anniversary-flowers': "For an anniversary, tell us the date you want the bouquet to arrive and add your card message to the order.",
    'graduation-flowers': "Delivering to a graduation venue? Share the venue name and a contact person there along with the graduate's name.",
}


def naira(n):
    return f'₦{n:,}'


def title(area):
    if area in DISPLAY:
        return DISPLAY[area]
    return ' '.join(w if w.isupper() else w.capitalize() for w in area.split())


def parse_zones():
    src = open(ZONES_JS, encoding='utf-8').read()
    out = {}
    for slug, var in ZONE_VARS.items():
        block = re.search(var + r'\s*=\s*\[(.*?)\n\]', src, re.S).group(1)
        zones = []
        for fee, areas in re.findall(r'fee:\s*(\d+),\s*areas:\s*\[(.*?)\]', block, re.S):
            names = [a for a in re.findall(r"'([^']+)'", areas) if a not in ALIASES]
            if names:
                zones.append((int(fee), [title(a) for a in names]))
        out[slug] = sorted(zones)
    return out


def fee_section(occ, city, zones):
    c = CITIES[city]
    fees = [f for f, _ in zones]
    join = lambda xs: ', '.join(xs[:-1]) + ' and ' + xs[-1] if len(xs) > 1 else xs[0]
    cheapest = join(zones[0][1][:3])
    farthest = join(zones[-1][1][:3])
    intro = INTROS[city].format(min_fee=naira(min(fees)), max_fee=naira(max(fees)), cheapest=cheapest, farthest=farthest)
    rows = '\n'.join(
        f'          <tr><th scope="row">{naira(f)}</th><td>{html.escape(", ".join(names))}</td></tr>' for f, names in zones)
    heading = f'Delivery fees across {c}' if occ == 'flower-delivery' else f"{OCCASIONS[occ][0].replace(' flowers', ' flower')} delivery fees across {c}"
    return f'''  <section class="bf-local" aria-labelledby="bf-fees-title">
    <h2 id="bf-fees-title">{heading}</h2>
    <p>{html.escape(intro)}</p>
    <p>{html.escape(OCCASION_LINE[occ])}</p>
    <div class="bf-table-wrap">
      <table class="bf-fees">
        <thead><tr><th scope="col">Delivery fee</th><th scope="col">Areas in {c}</th></tr></thead>
        <tbody>
{rows}
        </tbody>
      </table>
    </div>
    <p class="bf-note">Same-day delivery is available for confirmed orders placed before 2pm. Deliveries run until 7pm. Area not listed? Message us and we'll quote it.</p>
  </section>'''


def related_section(occ, city, existing):
    c = CITIES[city]
    same_occ = [(f'/{occ}-{s}', f'{OCCASIONS[occ][1]} in {CITIES[s]}') for s in CITIES if s != city and f'{occ}-{s}' in existing]
    same_city = [(f'/{o}-{city}', f'{OCCASIONS[o][1]} in {c}') for o in OCCASIONS if o != occ and f'{o}-{city}' in existing]
    li = lambda items: '\n'.join(f'          <li><a href="{h}">{html.escape(t)}</a></li>' for h, t in items)
    return f'''  <nav class="bf-related" aria-label="More Bloomfield Flowers pages">
    <h2>More from Bloomfield Flowers</h2>
    <div class="bf-related-grid">
      <div>
        <h3>{OCCASIONS[occ][1]} in other cities</h3>
        <ul>
{li(same_occ)}
        </ul>
      </div>
      <div>
        <h3>More in {c}</h3>
        <ul>
{li(same_city)}
        </ul>
      </div>
    </div>
    <p class="bf-shop"><a href="/">Shop all bouquets at bloomfieldflowers.ng</a></p>
  </nav>'''


STYLE = '''  <style>
    .bf-local, .bf-related { max-width: 960px; margin: 0 auto; padding: 40px 20px; font-family: inherit; color: inherit; }
    .bf-local h2, .bf-related h2 { margin: 0 0 12px; }
    .bf-local p { line-height: 1.6; margin: 0 0 12px; }
    .bf-table-wrap { overflow-x: auto; margin: 16px 0; }
    .bf-fees { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
    .bf-fees th, .bf-fees td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid #eadcdf; }
    .bf-fees thead th { font-weight: 600; background: #f7efee; }
    .bf-fees tbody th { white-space: nowrap; font-weight: 600; color: #8f4c73; }
    .bf-note { font-size: 0.9rem; opacity: 0.8; }
    .bf-related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px 32px; }
    .bf-related h3 { font-size: 1rem; margin: 8px 0; }
    .bf-related ul { list-style: none; padding: 0; margin: 0; }
    .bf-related li { margin: 6px 0; }
    .bf-related a { color: #8f4c73; }
  </style>'''


def main():
    zones = parse_zones()
    pages = sorted(f[:-5] for f in os.listdir(PUBLIC) if f.endswith('.html'))
    existing = set(pages)
    for page in pages:
        m = re.match(r'(' + '|'.join(OCCASIONS) + r')-(' + '|'.join(CITIES) + r')$', page)
        if not m:
            continue
        occ, city = m.groups()
        path = os.path.join(PUBLIC, page + '.html')
        doc = open(path, encoding='utf-8').read()
        block = ('<!-- bf-seo:start (generated by scripts/build-seo-sections.py) -->\n'
                 + STYLE + '\n' + fee_section(occ, city, zones[city]) + '\n' + related_section(occ, city, existing)
                 + '\n<!-- bf-seo:end -->\n')
        if '<!-- bf-seo:start' in doc:
            doc = re.sub(r'<!-- bf-seo:start.*?<!-- bf-seo:end -->\n', block, doc, flags=re.S)
        else:
            idx = doc.rfind('<footer')
            if idx == -1:
                raise SystemExit(f'{page}: no <footer> to insert before')
            doc = doc[:idx] + block + '\n' + doc[idx:]
        open(path, 'w', encoding='utf-8').write(doc)
        print(f'updated {page}')


if __name__ == '__main__':
    main()
