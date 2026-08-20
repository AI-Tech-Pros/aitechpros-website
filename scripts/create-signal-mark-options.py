from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path('/home/ubuntu/aitechpros-website/client/public/assets/creative')
ROOT.mkdir(parents=True, exist_ok=True)

NAVY = '#12263a'
TEAL = '#247d80'
BLUE = '#1266d6'
ORANGE = '#f2b66f'
MUTED = '#667984'

options = {
    'signal-axis': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="AI Tech Pros Signal Axis mark">
  <rect width="128" height="128" rx="8" fill="#12263a"/>
  <path d="M20 101H108" stroke="#f6faf9" stroke-width="5" stroke-linecap="round"/>
  <rect x="24" y="69" width="16" height="32" rx="3" fill="#78c9c0"/>
  <rect x="56" y="44" width="16" height="57" rx="3" fill="#85bfff"/>
  <rect x="88" y="19" width="16" height="82" rx="3" fill="#f2b66f"/>
</svg>''',
    'signal-node': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="AI Tech Pros Signal Node mark">
  <rect width="128" height="128" rx="8" fill="#12263a"/>
  <path d="M20 99H108" stroke="#f6faf9" stroke-width="4" stroke-linecap="round"/>
  <path d="M31 78L64 55L97 28" fill="none" stroke="#89c8c0" stroke-width="4" stroke-linecap="round"/>
  <circle cx="31" cy="78" r="9" fill="#78c9c0"/><circle cx="64" cy="55" r="9" fill="#85bfff"/><circle cx="97" cy="28" r="9" fill="#f2b66f"/>
  <path d="M31 99V78M64 99V55M97 99V28" stroke="#f6faf9" stroke-width="3" opacity=".9"/>
</svg>''',
    'signal-bridge': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="AI Tech Pros Signal Bridge mark">
  <rect width="128" height="128" rx="8" fill="#12263a"/>
  <path d="M20 101H108" stroke="#f6faf9" stroke-width="4" stroke-linecap="round"/>
  <path d="M28 91V67M64 91V41M100 91V19" stroke="#f6faf9" stroke-width="5" stroke-linecap="round"/>
  <path d="M28 67L64 41L100 19" fill="none" stroke="#247d80" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="28" cy="67" r="6" fill="#78c9c0"/><circle cx="64" cy="41" r="6" fill="#85bfff"/><circle cx="100" cy="19" r="6" fill="#f2b66f"/>
</svg>''',
}

for name, svg in options.items():
    (ROOT / f'logo-{name}-mark.svg').write_text(svg)

# Production option: Signal Bridge, designed for the selected tagline and responsive use.
logo = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 72" role="img" aria-labelledby="title desc">
  <title id="title">AI Tech Pros</title>
  <desc id="desc">AI Tech Pros with the tagline AI systems that work.</desc>
  <g transform="translate(0 8)">
    <rect width="56" height="56" rx="2" fill="#12263a"/>
    <path d="M9 51H47" stroke="#f6faf9" stroke-width="2" stroke-linecap="round"/>
    <path d="M14 43V31M28 43V18M42 43V8" stroke="#f6faf9" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M14 31L28 18L42 8" fill="none" stroke="#247d80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="14" cy="31" r="3" fill="#78c9c0"/><circle cx="28" cy="18" r="3" fill="#85bfff"/><circle cx="42" cy="8" r="3" fill="#f2b66f"/>
  </g>
  <g fill="#12263a" font-family="Arial, Helvetica, sans-serif">
    <text x="74" y="35" font-size="22" font-weight="700" letter-spacing="-0.7">AI Tech Pros</text>
    <text x="75" y="55" fill="#667984" font-size="10" font-weight="700" letter-spacing=".35">AI SYSTEMS THAT WORK.</text>
  </g>
</svg>'''
(ROOT / 'ai-tech-pros-logo-signal-bridge.svg').write_text(logo)

# Build a comparison board that shows the three options in the real header context.
font_candidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
]
bold_candidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf',
]
font_path = next((p for p in font_candidates if Path(p).exists()), None)
bold_path = next((p for p in bold_candidates if Path(p).exists()), font_path)
def f(path, size): return ImageFont.truetype(path, size) if path else ImageFont.load_default()

board = Image.new('RGB', (1440, 990), '#eef3f2')
d = ImageDraw.Draw(board)
d.text((72, 42), 'AI TECH PROS / SIGNAL MARK OPTIONS', fill=NAVY, font=f(bold_path, 22))
d.text((72, 78), 'Header study using the approved tagline: “AI systems that work.”', fill=MUTED, font=f(font_path, 20))
labels = [
    ('01  SIGNAL AXIS', 'Simple ascending bars with a clean baseline.'),
    ('02  SIGNAL NODE', 'A connected signal path with visible data points.'),
    ('03  SIGNAL BRIDGE  /  RECOMMENDED', 'A rising signal path carried by three stable pillars.'),
]
colors = [TEAL, BLUE, ORANGE]
for i, ((title, desc), y) in enumerate(zip(labels, [170, 430, 690])):
    d.rounded_rectangle((72, y, 1368, y+190), radius=8, fill='#ffffff', outline='#d6e0df', width=2)
    d.text((100, y+26), title, fill=NAVY, font=f(bold_path, 19))
    d.text((100, y+58), desc, fill=MUTED, font=f(font_path, 16))
    # Draw header-like lockup.
    x0, y0 = 100, y + 100
    d.rounded_rectangle((x0, y0, x0+58, y0+58), radius=3, fill=NAVY)
    baseline = y0+49
    d.line((x0+10, baseline, x0+48, baseline), fill='#f6faf9', width=2)
    if i == 0:
        bars = [(x0+14, y0+31, 7, TEAL), (x0+27, y0+20, 7, BLUE), (x0+40, y0+8, 7, ORANGE)]
        for x, top, w, c in bars: d.rounded_rectangle((x, top, x+w, baseline), radius=1, fill=c)
    elif i == 1:
        pts = [(x0+15, y0+37), (x0+29, y0+26), (x0+43, y0+12)]
        d.line(pts, fill=TEAL, width=2)
        for (x,yx), c in zip(pts, colors): d.ellipse((x-4,yx-4,x+4,yx+4), fill=c)
        for x,yx in pts: d.line((x, baseline, x, yx), fill='#f6faf9', width=2)
    else:
        pts = [(x0+15, y0+36), (x0+29, y0+23), (x0+43, y0+11)]
        d.line(pts, fill=TEAL, width=3)
        for x,yx in pts: d.line((x, baseline, x, yx), fill='#f6faf9', width=2)
        for (x,yx), c in zip(pts, colors): d.ellipse((x-3,yx-3,x+3,yx+3), fill=c)
    d.text((x0+76, y0+12), 'AI Tech Pros', fill=NAVY, font=f(bold_path, 24))
    d.text((x0+77, y0+40), 'AI SYSTEMS THAT WORK.', fill=MUTED, font=f(bold_path, 11))
    d.text((870, y0+22), 'Capabilities     Our approach     OrchestrateOS', fill=MUTED, font=f(font_path, 16))
    d.rounded_rectangle((1210, y0+7, 1330, y0+49), radius=4, fill=BLUE)
    d.text((1224, y0+19), 'Start a conversation', fill='#ffffff', font=f(bold_path, 12))

board.save(ROOT / 'signal-mark-header-options.png', optimize=True)
print('Created three signal mark options, production lockup, and header comparison board.')
