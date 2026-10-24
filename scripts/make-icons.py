# Renders the original Pack 6 badge to PNG icons with headless Chromium.
import pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent
src = (root / 'badge.svg.html').as_uri()
out = root.parent / 'public' / 'brand'
out.mkdir(parents=True, exist_ok=True)
jobs = [  # name, px, background, badge size within 512 frame
  ('badge-512.png', 512, 'transparent', 512),
  ('icon-512.png', 512, 'transparent', 512),
  ('icon-192.png', 192, 'transparent', 512),
  ('icon-maskable-512.png', 512, '#0B3B8C', 400),
  ('apple-touch-icon.png', 180, '#0B3B8C', 440),
]
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, px, bg, s in jobs:
        pg = b.new_page(viewport={'width': 512, 'height': 512}, device_scale_factor=px / 512)
        pg.goto(src); pg.wait_for_timeout(300)
        pg.evaluate(f"document.getElementById('wrap').style.setProperty('--bg','{bg}');document.querySelector('svg').style.setProperty('--s','{s}px')")
        pg.locator('#wrap').screenshot(path=str(out / name), omit_background=(bg == 'transparent'))
        pg.close()
    b.close()
print('ok')
