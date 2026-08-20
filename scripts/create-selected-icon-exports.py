from pathlib import Path
from PIL import Image, ImageDraw

root = Path('/home/ubuntu/aitechpros-website/client/public/assets/creative')
navy = '#12263a'
teal = '#247d80'
blue = '#85bfff'
orange = '#f2b66f'
white = '#f6faf9'

for size, filename in [(16, 'favicon-16.png'), (32, 'favicon-32.png'), (180, 'apple-touch-icon.png'), (512, 'icon-512.png')]:
    icon = Image.new('RGB', (size, size), navy)
    d = ImageDraw.Draw(icon)
    p = max(2, size // 7)
    baseline = size - p
    stroke = max(1, size // 24)
    points = [(p + size//8, int(size*.56)), (size//2, int(size*.39)), (size - p - size//8, int(size*.22))]
    d.line((p, baseline, size-p, baseline), fill=white, width=stroke)
    d.line(points, fill=teal, width=stroke+1, joint='curve')
    for (x, y), color in zip(points, [teal, blue, orange]):
        d.line((x, baseline, x, y), fill=white, width=stroke)
        r = max(1, size // 24)
        d.ellipse((x-r, y-r, x+r, y+r), fill=color)
    icon.save(root / filename, optimize=True)
    print(filename, size)
