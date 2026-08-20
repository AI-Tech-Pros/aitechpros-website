from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path('/home/ubuntu/aitechpros-website/client/public/assets/creative')
ROOT.mkdir(parents=True, exist_ok=True)

BRAND_MARK = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="AI Tech Pros mark">
  <rect width="128" height="128" fill="#12263a"/>
  <rect x="22" y="73" width="14" height="33" rx="2" fill="#78c9c0"/>
  <rect x="48" y="48" width="14" height="58" rx="2" fill="#85bfff"/>
  <rect x="74" y="22" width="14" height="84" rx="2" fill="#f2b66f"/>
  <path d="M18 112H110" stroke="#f6faf9" stroke-width="3" opacity=".9"/>
</svg>'''
(ROOT / 'ai-tech-pros-mark.svg').write_text(BRAND_MARK)
(ROOT / 'favicon.svg').write_text(BRAND_MARK)

DIAGRAM = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" role="img" aria-labelledby="title desc">
<title id="title">AI Tech Pros operating principle</title>
<desc id="desc">Govern, guide, and connect are arranged around a shared system of useful intelligence.</desc>
<rect width="1200" height="720" fill="#102c43"/>
<g fill="none" stroke="#89c8c0" stroke-opacity=".5">
  <path d="M175 360H1025" stroke-width="2"/><path d="M600 112V608" stroke-width="1"/>
  <circle cx="600" cy="360" r="190" stroke-width="1"/><circle cx="600" cy="360" r="125" stroke-width="2"/>
  <path d="M240 195L600 360L960 195M240 525L600 360L960 525" stroke-width="1"/>
</g>
<g font-family="Arial, sans-serif" text-anchor="middle">
  <circle cx="600" cy="360" r="76" fill="#f7fbfa"/>
  <circle cx="600" cy="360" r="48" fill="#247d80"/>
  <text x="600" y="355" fill="#ffffff" font-size="16" font-weight="700">USEFUL</text>
  <text x="600" y="377" fill="#ffffff" font-size="16" font-weight="700">INTELLIGENCE</text>
  <g fill="#102c43" stroke="#89c8c0" stroke-width="2">
    <circle cx="240" cy="195" r="50"/><circle cx="240" cy="525" r="50"/><circle cx="960" cy="195" r="50"/><circle cx="960" cy="525" r="50"/>
  </g>
  <g fill="#ffffff" font-size="19" font-weight="700">
    <text x="240" y="201">GOVERN</text><text x="240" y="531">GUIDE</text><text x="960" y="201">CONNECT</text><text x="960" y="531">SCALE</text>
  </g>
  <g fill="#f2b66f"><circle cx="240" cy="360" r="7"/><circle cx="960" cy="360" r="7"/><circle cx="600" cy="112" r="7"/><circle cx="600" cy="608" r="7"/></g>
</g>
</svg>'''
(ROOT / 'operating-principles.svg').write_text(DIAGRAM)

# Exact social-preview composition; use a system font when available.
font_paths = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
]
font_path = next((p for p in font_paths if Path(p).exists()), None)
font_bold_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf').exists() else font_path

def font(path, size):
    return ImageFont.truetype(path, size) if path else ImageFont.load_default()

img = Image.new('RGB', (1200, 630), '#fbfcfb')
d = ImageDraw.Draw(img)
# Architectural right-side system motif.
for r, color, width in [(208, '#12263a', 4), (158, '#247d80', 3), (108, '#1266d6', 3)]:
    d.ellipse((810-r, 315-r, 810+r, 315+r), outline=color, width=width)
for x, y, c in [(810, 107, '#1266d6'), (1018, 315, '#f2b66f'), (810, 523, '#247d80'), (602, 315, '#12263a')]:
    d.ellipse((x-8, y-8, x+8, y+8), fill=c)
d.line((602,315,1018,315), fill='#c7d8dc', width=2)
d.line((810,107,810,523), fill='#c7d8dc', width=2)
d.rectangle((900, 170, 1080, 255), fill='#e3efee')
d.rectangle((980, 420, 1100, 505), fill='#eaf2f8')
# Left text block.
d.text((74, 82), 'AI TECH PROS', fill='#247d80', font=font(font_bold_path, 22))
d.text((74, 170), 'AI systems,', fill='#12263a', font=font(font_bold_path, 62))
d.text((74, 245), 'made useful.', fill='#1266d6', font=font(font_bold_path, 62))
d.text((78, 360), 'Strategy, secure infrastructure, and human expertise', fill='#4a6173', font=font(font_path, 21))
d.text((78, 393), 'for the work ahead.', fill='#4a6173', font=font(font_path, 21))
d.line((78, 495, 170, 495), fill='#d68d46', width=3)
d.text((190, 480), 'USEFUL INTELLIGENCE', fill='#718692', font=font(font_bold_path, 14))
img.save(ROOT / 'ai-tech-pros-social-preview.png', optimize=True)

# Favicon PNG exports at common sizes.
mark = Image.open(ROOT / 'ai-tech-pros-social-preview.png')
# Create clean square marks directly for crisp small sizes.
for size, filename in [(16, 'favicon-16.png'), (32, 'favicon-32.png'), (180, 'apple-touch-icon.png'), (512, 'icon-512.png')]:
    icon = Image.new('RGB', (size, size), '#12263a')
    di = ImageDraw.Draw(icon)
    pad = max(2, size // 6)
    bar_w = max(2, size // 8)
    baseline = size - pad
    bars = [(pad, size - pad - int(size * .27), '#78c9c0'), (size//2-bar_w//2, size - pad - int(size * .48), '#85bfff'), (size-pad-bar_w, pad, '#f2b66f')]
    for x, top, color in bars:
        di.rounded_rectangle((x, top, x + bar_w, baseline), radius=max(1, size//32), fill=color)
    di.line((pad, baseline, size-pad, baseline), fill='#f6faf9', width=max(1, size//32))
    icon.save(ROOT / filename, optimize=True)

print('Created deterministic SVG, PNG, and favicon assets in', ROOT)
